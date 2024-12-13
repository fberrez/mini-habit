import React from 'react';
import { StyleSheet, View, useColorScheme, TouchableOpacity, Animated, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { STORAGE_KEY } from '@/constants/StorageKey';

interface Habit {
  id: string;
  name: string;
  completed: { [date: string]: boolean };
}

const calculateStats = (completed: { [date: string]: boolean }) => {
  const today = moment().startOf('day');
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const totalCompletions = Object.values(completed).filter(Boolean).length;

  // Calculate current streak
  let currentDate = moment(today);
  if (!completed[currentDate.format('YYYY-MM-DD')]) {
    currentDate.subtract(1, 'days');
  }

  while (completed[currentDate.format('YYYY-MM-DD')]) {
    currentStreak++;
    currentDate.subtract(1, 'days');
  }

  // Calculate longest streak
  const dates = Object.keys(completed).sort();
  dates.forEach((date) => {
    if (completed[date]) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  });

  // Calculate completion rate (last 30 days)
  const thirtyDaysAgo = moment().subtract(29, 'days');
  let daysInRange = 0;
  let completedDays = 0;
  
  for (let m = moment(); m.isSameOrAfter(thirtyDaysAgo); m.subtract(1, 'day')) {
    const dateKey = m.format('YYYY-MM-DD');
    daysInRange++;
    if (completed[dateKey]) completedDays++;
  }
  
  const completionRate = Math.round((completedDays / daysInRange) * 100);

  // Calculate best performing day
  const dayStats: { [key: number]: number } = {
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
  };
  const dayTotals: { [key: number]: number } = {
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
  };
  
  Object.entries(completed).forEach(([date, isCompleted]) => {
    const dayOfWeek = moment(date).day();
    dayTotals[dayOfWeek]++;
    if (isCompleted) dayStats[dayOfWeek]++;
  });
  
  const bestDay = Object.entries(dayStats).reduce((best, [day, count]) => {
    const rate = count / (dayTotals[Number(day)] || 1);
    return rate > best.rate ? { day: Number(day), rate } : best;
  }, { day: 0, rate: 0 });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Calculate 21-day habit formation progress
  let consecutiveDays = 0;
  currentDate = moment(today);

  while (consecutiveDays < 21 && completed[currentDate.format('YYYY-MM-DD')]) {
    consecutiveDays++;
    currentDate.subtract(1, 'days');
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completionRate,
    lastThirtyDays: {
      total: daysInRange,
      completed: completedDays
    },
    bestDay: {
      name: dayNames[bestDay.day],
      rate: Math.round(bestDay.rate * 100)
    },
    habitFormation: {
      progress: consecutiveDays,
      remaining: Math.max(0, 21 - consecutiveDays),
      percentage: Math.min(100, (consecutiveDays / 21) * 100)
    }
  };
};

export default function HabitDetailsScreen() {
  const params = useLocalSearchParams<{ habit: string, habits: string }>();
  const router = useRouter();

  if (!params.habit || !params.habits) {
    return (
      <SafeAreaView>
        <ThemedText>Error: Invalid habit data</ThemedText>
      </SafeAreaView>
    );
  }

  try {
    const habit: Habit = JSON.parse(params.habit);
    const habits: Habit[] = JSON.parse(params.habits);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const stats = calculateStats(habit.completed);

    const currentIndex = habits.findIndex(h => h.id === habit.id);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < habits.length - 1;

    const navigateToHabit = (direction: 'next' | 'previous') => {
      const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (newIndex >= 0 && newIndex < habits.length) {
        router.replace({
          pathname: '/HabitDetailsScreen',
          params: { 
            habit: JSON.stringify(habits[newIndex]),
            habits: params.habits
          }
        });
      }
    };

    return (
      <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => router.replace('/')}
          >
            <ThemedText style={styles.doneText}>Done</ThemedText>
          </TouchableOpacity>

          <View style={styles.navigationContainer}>
            <TouchableOpacity 
              style={[styles.navButton, !hasPrevious && styles.navButtonDisabled]} 
              onPress={() => hasPrevious && navigateToHabit('previous')}
              disabled={!hasPrevious}
            >
              <Ionicons 
                name="chevron-back" 
                size={24} 
                color={hasPrevious ? (isDark ? '#fff' : '#000') : '#666'} 
              />
            </TouchableOpacity>
            
            <ThemedText style={styles.headerTitle}>{habit.name}</ThemedText>
            
            <TouchableOpacity 
              style={[styles.navButton, !hasNext && styles.navButtonDisabled]} 
              onPress={() => hasNext && navigateToHabit('next')}
              disabled={!hasNext}
            >
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={hasNext ? (isDark ? '#fff' : '#000') : '#666'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.statsContainer}>
          <ThemedView style={[styles.statCard, styles.habitFormationCard]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="fitness" size={24} color="#FF6B6B" />
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <Animated.View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${stats.habitFormation.percentage}%` }
                  ]} 
                />
              </View>
              <ThemedText style={styles.progressText}>
                {stats.habitFormation.remaining === 0 
                  ? "Habit Formed! 🎉" 
                  : `${stats.habitFormation.remaining} days to form habit`}
              </ThemedText>
              <ThemedText style={styles.progressSubtext}>
                {stats.habitFormation.progress}/21 days completed
              </ThemedText>
            </View>
          </ThemedView>

          <View style={styles.streaksRow}>
            <ThemedView style={[styles.statCard, styles.halfWidth]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="flame" size={24} color="#FF4500" />
              </View>
              <ThemedText style={styles.statValue}>{stats.currentStreak}</ThemedText>
              <ThemedText style={styles.statLabel}>Current Streak</ThemedText>
            </ThemedView>

            <ThemedView style={[styles.statCard, styles.halfWidth]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
              </View>
              <ThemedText style={styles.statValue}>{stats.longestStreak}</ThemedText>
              <ThemedText style={styles.statLabel}>Longest Streak</ThemedText>
            </ThemedView>
          </View>

          <View style={styles.streaksRow}>
            <ThemedView style={[styles.statCard, styles.halfWidth]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="analytics" size={24} color="#4A90E2" />
              </View>
              <ThemedText style={styles.statValue}>{stats.completionRate}%</ThemedText>
              <ThemedText style={styles.statLabel}>Monthly Success Rate</ThemedText>
              <ThemedText style={styles.statSubtext}>
                {stats.lastThirtyDays.completed} of {stats.lastThirtyDays.total} days
              </ThemedText>
            </ThemedView>

            <ThemedView style={[styles.statCard, styles.halfWidth]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar" size={24} color="#9B59B6" />
              </View>
              <ThemedText style={styles.statValue}>{stats.bestDay.rate === 0 ? '-' : `${stats.bestDay.name.slice(0, 3)}.`}</ThemedText>
              <ThemedText style={styles.statLabel}>Best Day</ThemedText>
              <ThemedText style={styles.statSubtext}>
                {stats.bestDay.rate}% success rate
              </ThemedText>
            </ThemedView>
          </View>

          <ThemedView style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
            <ThemedText style={styles.statValue}>{stats.totalCompletions}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Completions</ThemedText>
          </ThemedView>

          <View style={styles.deleteContainer}>
            <TouchableOpacity 
              onPress={() => {
                Alert.alert(
                  'Delete Habit',
                  'Are you sure you want to delete this habit? This action cannot be undone.',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        const allHabits: Habit[] = JSON.parse(params.habits);
                        const updatedHabits = allHabits.filter(h => h.id !== habit.id);
                        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHabits))
                          .then(() => {
                            router.replace('/');
                          })
                          .catch(error => {
                            console.error('Error deleting habit:', error);
                          });
                      },
                    },
                  ],
                  { cancelable: true }
                );
              }}
            >
              <ThemedText style={styles.deleteText}>Delete Habit</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  } catch (error) {
    console.error('Error parsing habit data:', error);
    return (
      <SafeAreaView>
        <ThemedText>Error: Could not parse habit data</ThemedText>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkSafeArea: {
    backgroundColor: '#000',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  doneButton: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  statsContainer: {
    padding: 16,
  },
  streaksRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  statCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statIconContainer: {
    marginBottom: 8,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 38,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  statSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  habitFormationCard: {
    marginBottom: 16,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 14,
    color: '#666',
  },
  deleteContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },
});
