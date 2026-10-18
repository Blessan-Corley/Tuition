import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Student } from './src/types';
import { HomeScreen } from './src/screens/HomeScreen';
import { StudentDetailScreen } from './src/screens/StudentDetailScreen';
import { AddEditStudentScreen } from './src/screens/AddEditStudentScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { Logger } from './src/utils/logger';
import { testDatabaseConnection } from './src/utils/syncEngine';
import { THEME } from './src/constants/theme';

type ScreenType = 'home' | 'detail' | 'add_edit' | 'settings';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Logger.error('AppCrash', 'Uncaught component error in tree:', error.message);
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={errorStyles.container} edges={['top', 'left', 'right']}>
          <Text style={errorStyles.title}>Allwyn Tuition Attendance</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'An unexpected issue occurred.'}
          </Text>
          <TouchableOpacity
            style={errorStyles.retryButton}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={errorStyles.retryText}>Reload App</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  useEffect(() => {
    Logger.info('App', 'Allwyn Tuition Attendance App mounted successfully');
    testDatabaseConnection().then((res) => {
      Logger.info('App', `Initial database status: ${res.message}`);
    });
  }, []);

  // Handle Android physical back button on Realme 8s
  useEffect(() => {
    const onBackPress = () => {
      if (currentScreen === 'add_edit') {
        if (selectedStudent) {
          setCurrentScreen('detail');
        } else {
          setCurrentScreen('home');
        }
        return true;
      }
      if (currentScreen === 'detail' || currentScreen === 'settings') {
        setCurrentScreen('home');
        setSelectedStudent(null);
        return true;
      }
      return false; // Exit app on home
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentScreen, selectedStudent]);

  const handleSelectStudent = (student: Student) => {
    Logger.info('Navigation', `Opening student details: ${student.name}`);
    setSelectedStudent(student);
    setCurrentScreen('detail');
  };

  const handleAddNewStudent = () => {
    Logger.info('Navigation', 'Opening Add New Student screen');
    setEditingStudent(null);
    setCurrentScreen('add_edit');
  };

  const handleEditStudent = () => {
    Logger.info('Navigation', `Opening Edit Student screen for: ${selectedStudent?.name}`);
    setEditingStudent(selectedStudent);
    setCurrentScreen('add_edit');
  };

  const handleStudentSaved = (savedStudent: Student) => {
    Logger.info('Navigation', `Student saved: ${savedStudent.name}. Navigating to detail view.`);
    setSelectedStudent(savedStudent);
    setCurrentScreen('detail');
  };

  const handleStudentDeleted = () => {
    Logger.info('Navigation', 'Student deleted. Returning to home.');
    setSelectedStudent(null);
    setCurrentScreen('home');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {currentScreen === 'home' && (
        <HomeScreen
          onSelectStudent={handleSelectStudent}
          onAddStudent={handleAddNewStudent}
          onOpenSettings={() => {
            Logger.info('Navigation', 'Opening Settings & Sync screen');
            setCurrentScreen('settings');
          }}
        />
      )}

      {currentScreen === 'detail' && selectedStudent && (
        <StudentDetailScreen
          student={selectedStudent}
          onBack={() => {
            setSelectedStudent(null);
            setCurrentScreen('home');
          }}
          onEditStudent={handleEditStudent}
        />
      )}

      {currentScreen === 'add_edit' && (
        <AddEditStudentScreen
          initialStudent={editingStudent}
          onBack={() => {
            if (selectedStudent) {
              setCurrentScreen('detail');
            } else {
              setCurrentScreen('home');
            }
          }}
          onSaved={handleStudentSaved}
          onDeleted={handleStudentDeleted}
        />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen onBack={() => setCurrentScreen('home')} />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <MainApp />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
