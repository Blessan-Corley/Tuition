import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { StorageService } from '../utils/storage';
import { Toast } from '../components/Toast';
import { THEME } from '../constants/theme';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Export full JSON backup to WhatsApp, Drive, or phone storage
  const handleExportBackup = async () => {
    try {
      const jsonBackup = await StorageService.exportFullBackupJson();
      await Share.share({
        message: jsonBackup,
        title: 'Allwyn Tuition Backup',
      });
      setToastMessage('Backup ready to share.');
      setToastVisible(true);
    } catch {
      Alert.alert('Backup Export', 'Could not open share dialog.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Toast Feedback */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onDismiss={() => setToastVisible(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Save Backup Copy */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconCircle}>
              <Feather name="download" size={18} color={THEME.colors.primary} />
            </View>
            <Text style={styles.sectionHeader}>Save Backup Copy</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Save or share a backup of your student attendance and payments to WhatsApp or Google Drive.
          </Text>

          <TouchableOpacity
            style={styles.backupButton}
            onPress={handleExportBackup}
            activeOpacity={0.8}
          >
            <Feather name="share-2" size={18} color={THEME.colors.textPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.backupButtonText}>Share Backup to WhatsApp / Drive</Text>
          </TouchableOpacity>
        </View>

        {/* Tuition Rules & Class Duration Guide */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconCircle}>
              <Feather name="book-open" size={18} color={THEME.colors.primary} />
            </View>
            <Text style={styles.sectionHeader}>Tuition Billing Rules</Text>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleBullet} />
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>12-Class Cycle:</Text> Fees are tracked for every 12 classes completed.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleBullet} />
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>1 Hour:</Text> Counted as 1 class.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleBullet} />
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>1.5 Hours:</Text> Counted as 1.5 classes.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleBullet} />
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>2 Hours:</Text> Counted as 2 classes.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleBullet} />
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Fee Collection Rollover:</Text> When you mark fee collected, 12 classes are deducted and any extra classes automatically carry over into the next cycle.
            </Text>
          </View>
        </View>

        {/* About App */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>Allwyn Maths Tuition</Text>
          <Text style={styles.aboutText}>Attendance & Cycle Tracker • Version 1.0.0</Text>
        </View>
      </ScrollView>
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
    paddingTop: 8,
    paddingBottom: 12,
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
  section: {
    backgroundColor: THEME.colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  sectionDescription: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  backupButton: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.primary,
    minHeight: THEME.touchTarget.minHeight,
    borderRadius: THEME.touchTarget.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 5,
  },
  ruleBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.primary,
    marginTop: 8,
    marginRight: 10,
  },
  ruleText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  ruleBold: {
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  aboutCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  aboutText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
});
