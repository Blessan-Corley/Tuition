import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Student, AttendanceRecord, FeePayment } from '../types';
import { StorageService } from '../utils/storage';
import { getTodayDateString, getDefaultTimeWindow } from '../utils/dateUtils';
import { triggerBackgroundSync } from '../utils/syncEngine';
import { StudentCard } from '../components/StudentCard';
import { Toast } from '../components/Toast';
import { Logger } from '../utils/logger';
import { THEME } from '../constants/theme';

interface HomeScreenProps {
  onSelectStudent: (student: Student) => void;
  onAddStudent: () => void;
  onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectStudent,
  onAddStudent,
  onOpenSettings,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<{ [studentId: string]: AttendanceRecord[] }>({});
  const [paymentsMap, setPaymentsMap] = useState<{ [studentId: string]: FeePayment[] }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const todayStr = getTodayDateString();

  const loadData = async () => {
    try {
      const studentList = await StorageService.getStudents();
      setStudents(studentList);

      const allAttendance = await StorageService.getAllAttendance();
      const allPayments = await StorageService.getAllPayments();

      const attGroup: { [id: string]: AttendanceRecord[] } = {};
      allAttendance.forEach((rec) => {
        if (!attGroup[rec.studentId]) attGroup[rec.studentId] = [];
        attGroup[rec.studentId].push(rec);
      });
      setAttendanceMap(attGroup);

      const payGroup: { [id: string]: FeePayment[] } = {};
      allPayments.forEach((p) => {
        if (!payGroup[p.studentId]) payGroup[p.studentId] = [];
        payGroup[p.studentId].push(p);
      });
      setPaymentsMap(payGroup);

      Logger.info(
        'HomeScreen',
        `Data loaded successfully: ${studentList.length} students, ${allAttendance.length} attendance sessions, ${allPayments.length} payments.`
      );
    } catch (e: any) {
      Logger.error('HomeScreen', 'Error loading home data:', e?.message || e);
    }
  };

  useEffect(() => {
    loadData();
    triggerBackgroundSync();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await triggerBackgroundSync();
    setRefreshing(false);
  };

  const handleQuickMarkToday = async (student: Student) => {
    const studentRecords = attendanceMap[student.id] || [];
    const alreadyMarked = studentRecords.some((r) => r.date === todayStr && !r.isDeleted);

    if (alreadyMarked) {
      // If already marked, open details to view or edit
      onSelectStudent(student);
      return;
    }

    const timeWindow = getDefaultTimeWindow(60);
    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId: student.id,
      date: todayStr,
      startTime: timeWindow.startTime,
      endTime: timeWindow.endTime,
      durationMinutes: 60,
      createdAt: new Date().toISOString(),
    };

    await StorageService.addAttendanceRecord(newRecord);
    await loadData();
    triggerBackgroundSync();

    setToastMessage(`Marked present for ${student.name} (1 class)`);
    setToastVisible(true);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.grade && s.grade.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Toast Feedback */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onDismiss={() => setToastVisible(false)}
      />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Allwyn Maths Tuition</Text>
          <Text style={styles.subtitle}>
            {students.length} {students.length === 1 ? 'Student' : 'Students'} Enrolled
          </Text>
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={onOpenSettings}
          accessibilityLabel="Open settings and backups"
        >
          <Feather name="settings" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      {students.length > 0 && (
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color={THEME.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search student by name or class..."
            placeholderTextColor={THEME.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {/* Student List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => {
          const recs = attendanceMap[item.id] || [];
          const pays = paymentsMap[item.id] || [];
          const isMarkedToday = recs.some((r) => r.date === todayStr && !r.isDeleted);

          return (
            <StudentCard
              student={item}
              attendance={recs}
              payments={pays}
              onPress={() => onSelectStudent(item)}
              onQuickMarkToday={() => handleQuickMarkToday(item)}
              isMarkedToday={isMarkedToday}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Feather name="users" size={36} color={THEME.colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No students match your search' : 'No Students Added Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try searching with a different name or class.'
                : 'Add your home tuition students to start tracking their classes and 12-class fee cycles.'}
            </Text>
          </View>
        }
      />

      {/* Primary Floating "+ Add Student" Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddStudent}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.addButtonText}>Add New Student</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: THEME.colors.textPrimary,
    paddingVertical: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: THEME.colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: THEME.colors.background,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.primary,
    minHeight: THEME.touchTarget.minHeight,
    borderRadius: THEME.touchTarget.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
