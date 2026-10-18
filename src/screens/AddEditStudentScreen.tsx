import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Student } from '../types';
import { StorageService } from '../utils/storage';
import { triggerBackgroundSync } from '../utils/syncEngine';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { THEME } from '../constants/theme';

interface AddEditStudentScreenProps {
  initialStudent?: Student | null;
  onBack: () => void;
  onSaved: (student: Student) => void;
  onDeleted: () => void;
}

export const AddEditStudentScreen: React.FC<AddEditStudentScreenProps> = ({
  initialStudent,
  onBack,
  onSaved,
  onDeleted,
}) => {
  const isEditing = !!initialStudent;

  const [name, setName] = useState(initialStudent?.name || '');
  const [grade, setGrade] = useState(initialStudent?.grade || '');
  const [phone, setPhone] = useState(initialStudent?.phone || '');
  const [feeAmount, setFeeAmount] = useState(
    initialStudent ? String(initialStudent.feeAmount || 5000) : '5000'
  );

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Student Name Required', 'Please enter the student full name.');
      return;
    }

    const studentToSave: Student = {
      id: initialStudent?.id || `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      grade: grade.trim(),
      phone: phone.trim(),
      feeAmount: parseFloat(feeAmount) || 0,
      classesPerCycle: 12,
      createdAt: initialStudent?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await StorageService.saveStudent(studentToSave);
    triggerBackgroundSync();
    onSaved(studentToSave);
  };

  const handleConfirmDelete = async () => {
    if (initialStudent) {
      await StorageService.deleteStudent(initialStudent.id);
      triggerBackgroundSync();
      onDeleted();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Student' : 'Add New Student'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Student Full Name *</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Rahul Sharma"
            placeholderTextColor={THEME.colors.textMuted}
            autoFocus={!isEditing}
          />
        </View>

        {/* Grade / Standard Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Standard / Class</Text>
          <TextInput
            style={styles.textInput}
            value={grade}
            onChangeText={setGrade}
            placeholder="e.g. 10th CBSE / 12th State Board"
            placeholderTextColor={THEME.colors.textMuted}
          />
        </View>

        {/* Parent Phone Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Parent WhatsApp Phone Number</Text>
          <TextInput
            style={styles.textInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 9876543210"
            placeholderTextColor={THEME.colors.textMuted}
            keyboardType="phone-pad"
          />
          <Text style={styles.helperText}>Used for 1-tap WhatsApp attendance summaries.</Text>
        </View>

        {/* Fee per 12 classes */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tuition Fee for 12 Classes (Rs.)</Text>
          <TextInput
            style={styles.textInput}
            value={feeAmount}
            onChangeText={setFeeAmount}
            placeholder="e.g. 5000"
            placeholderTextColor={THEME.colors.textMuted}
            keyboardType="numeric"
          />
          <Text style={styles.helperText}>Pre-fills the amount when 12 classes are settled.</Text>
        </View>

        {/* Primary Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Feather name="check" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Add Student'}</Text>
        </TouchableOpacity>

        {/* Danger Zone: Safe Delete (Inside Settings only) */}
        {isEditing && (
          <View style={styles.dangerZone}>
            <Text style={styles.dangerZoneTitle}>Manage Student</Text>
            <Text style={styles.dangerZoneText}>
              Removing a student archives them from the active list. All past attendance and payment records are preserved in device backups.
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setDeleteModalVisible(true)}
              activeOpacity={0.8}
            >
              <Feather name="trash-2" size={18} color={THEME.colors.dangerText} style={{ marginRight: 8 }} />
              <Text style={styles.deleteButtonText}>Remove Student</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        visible={deleteModalVisible}
        studentName={name}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleConfirmDelete}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: THEME.colors.textPrimary,
    minHeight: THEME.touchTarget.minHeight,
  },
  helperText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 6,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.primary,
    minHeight: THEME.touchTarget.minHeight,
    borderRadius: THEME.touchTarget.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dangerZone: {
    marginTop: 20,
    padding: 18,
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.dangerBorder,
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.dangerText,
    marginBottom: 6,
  },
  dangerZoneText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: THEME.colors.dangerBg,
    borderWidth: 1,
    borderColor: THEME.colors.dangerBorder,
  },
  deleteButtonText: {
    color: THEME.colors.dangerText,
    fontSize: 15,
    fontWeight: '700',
  },
});
