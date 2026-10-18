import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CycleStatus } from '../types';
import { getTodayDateString, formatReadableDate } from '../utils/dateUtils';
import { formatClassCount, getRemainingClassesAfterSettlement } from '../utils/cycleCalculator';
import { THEME } from '../constants/theme';

interface FeeCollectedModalProps {
  visible: boolean;
  studentName: string;
  defaultFeeAmount: number;
  cycleStatus: CycleStatus;
  onClose: () => void;
  onConfirm: (data: { amount: number; date: string; classesSettled: number }) => void;
}

export const FeeCollectedModal: React.FC<FeeCollectedModalProps> = ({
  visible,
  studentName,
  defaultFeeAmount,
  cycleStatus,
  onClose,
  onConfirm,
}) => {
  const [amountStr, setAmountStr] = useState(
    defaultFeeAmount ? String(defaultFeeAmount) : '5000'
  );
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());

  const remainingAfter = getRemainingClassesAfterSettlement(cycleStatus.currentCycleClasses, 12);

  const handleConfirm = () => {
    const amount = parseFloat(amountStr) || 0;
    onConfirm({
      amount,
      date: paymentDate,
      classesSettled: 12,
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
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Mark Fee Collected</Text>
              <Text style={styles.studentSubtitle}>{studentName}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={22} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Cycle Rollover Breakdown Card */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>12-Class Settlement Calculation</Text>
            
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Current Classes Completed:</Text>
              <Text style={styles.calcValue}>{formatClassCount(cycleStatus.currentCycleClasses)} classes</Text>
            </View>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Settled in this payment:</Text>
              <Text style={[styles.calcValue, { color: THEME.colors.accent }]}>-12 classes</Text>
            </View>

            <View style={[styles.calcRow, styles.calcRowTotal]}>
              <Text style={styles.calcLabelBold}>Carryover to Next Cycle:</Text>
              <Text style={styles.calcValueBold}>{formatClassCount(remainingAfter)} classes</Text>
            </View>
          </View>

          {/* Amount Collected Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Fee Amount (Rs.)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={amountStr}
              onChangeText={setAmountStr}
              placeholder="e.g. 5000"
              placeholderTextColor={THEME.colors.textMuted}
            />
          </View>

          {/* Date Label */}
          <View style={styles.dateRow}>
            <Feather name="calendar" size={16} color={THEME.colors.textSecondary} />
            <Text style={styles.dateLabelText}>
              Payment Date: {formatReadableDate(paymentDate)}
            </Text>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Feather name="check" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.confirmButtonText}>Confirm & Deduct 12 Classes</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
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
  breakdownCard: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 18,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  calcRowTotal: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 8,
    marginTop: 6,
  },
  calcLabel: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  calcValue: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  calcLabelBold: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  calcValueBold: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: THEME.colors.textPrimary,
    minHeight: 48,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateLabelText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginLeft: 8,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.primary,
    minHeight: THEME.touchTarget.minHeight,
    borderRadius: THEME.touchTarget.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
