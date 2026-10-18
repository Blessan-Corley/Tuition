import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AttendanceRecord } from '../types';
import {
  formatReadableDate,
  getDefaultTimeWindow,
  calculateEndTime,
} from '../utils/dateUtils';
import { THEME } from '../constants/theme';

interface AddAttendanceModalProps {
  visible: boolean;
  dateString: string;
  studentName: string;
  existingRecord?: AttendanceRecord | null;
  onClose: () => void;
  onSave: (record: {
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
  }) => void;
  onDelete?: (recordId: string) => void;
}

const DURATION_OPTIONS = [
  { label: '1 hr (1 class)', minutes: 60 },
  { label: '1.25 hr (1.25 class)', minutes: 75 },
  { label: '1.5 hr (1.5 class)', minutes: 90 },
  { label: '2 hrs (2 classes)', minutes: 120 },
];

export const AddAttendanceModal: React.FC<AddAttendanceModalProps> = ({
  visible,
  dateString,
  studentName,
  existingRecord,
  onClose,
  onSave,
  onDelete,
}) => {
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [startTime, setStartTime] = useState('05:00 PM');
  const [endTime, setEndTime] = useState('06:00 PM');

  useEffect(() => {
    if (visible) {
      if (existingRecord) {
        setSelectedDuration(existingRecord.durationMinutes || 60);
        setStartTime(existingRecord.startTime || '05:00 PM');
        setEndTime(existingRecord.endTime || '06:00 PM');
      } else {
        const defaults = getDefaultTimeWindow(60);
        setSelectedDuration(60);
        setStartTime(defaults.startTime);
        setEndTime(defaults.endTime);
      }
    }
  }, [visible, existingRecord]);

  const handleSelectDuration = (minutes: number) => {
    setSelectedDuration(minutes);
    setEndTime(calculateEndTime(startTime, minutes));
  };

  const handleSave = () => {
    onSave({
      date: dateString,
      startTime,
      endTime,
      durationMinutes: selectedDuration,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {existingRecord ? 'Class Details' : 'Mark Attendance'}
              </Text>
              <Text style={styles.studentSubtitle}>{studentName}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close dialog"
            >
              <Feather name="x" size={22} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Date Banner */}
          <View style={styles.dateBanner}>
            <Feather name="calendar" size={18} color={THEME.colors.textPrimary} />
            <Text style={styles.dateText}>{formatReadableDate(dateString)}</Text>
          </View>

          {/* Duration Selector */}
          <Text style={styles.sectionLabel}>Class Duration</Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((opt) => {
              const isSelected = selectedDuration === opt.minutes;
              return (
                <TouchableOpacity
                  key={opt.minutes}
                  style={[
                    styles.durationChip,
                    isSelected && styles.durationChipSelected,
                  ]}
                  onPress={() => handleSelectDuration(opt.minutes)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      isSelected && styles.durationChipTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time Window Summary */}
          <View style={styles.timeCard}>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <Text style={styles.timeValue}>{startTime}</Text>
            </View>
            <Feather name="arrow-right" size={18} color={THEME.colors.textMuted} />
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>End Time</Text>
              <Text style={styles.timeValue}>{endTime}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Feather name="check" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>
                {existingRecord ? 'Update Attendance' : 'Save Attendance'}
              </Text>
            </TouchableOpacity>

            {existingRecord && onDelete ? (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  onDelete(existingRecord.id);
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Feather name="trash-2" size={18} color={THEME.colors.dangerText} />
                <Text style={styles.deleteButtonText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Slate 900 overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: THEME.colors.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  studentSubtitle: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 18,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginLeft: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 10,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  durationChipSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  durationChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  durationChipTextSelected: {
    color: '#FFFFFF',
  },
  timeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 22,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  actionRow: {
    gap: 10,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.primary,
    minHeight: THEME.touchTarget.minHeight,
    borderRadius: THEME.touchTarget.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: THEME.colors.dangerBg,
    borderWidth: 1,
    borderColor: THEME.colors.dangerBorder,
  },
  deleteButtonText: {
    color: THEME.colors.dangerText,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
});
