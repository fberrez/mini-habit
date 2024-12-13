import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Modal, TextInput, View, useColorScheme, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity, ScrollView } from 'react-native';
import { STORAGE_KEY } from '@/constants/StorageKey';

interface Habit {
  id: string;
  name: string;
  completed: { [date: string]: boolean }; // Change to use date strings as keys
}

const formatDate = (date: moment.Moment) => {
  return date.format('YYYY-MM-DD');
};

const calculateCurrentStreak = (completed: { [date: string]: boolean }): number => {
  const today = moment().startOf('day');
  let streak = 0;
  const currentDate = moment(today);

  // If today isn't completed, start checking from yesterday
  if (!completed[formatDate(today)]) {
    currentDate.subtract(1, 'days');
  }

  while (true) {
    const dateKey = formatDate(currentDate);
    
    // Break if we find a day that wasn't completed
    if (!completed[dateKey]) {
      break;
    }
    
    streak++;
    currentDate.subtract(1, 'days');
  }

  return streak;
};

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addHabitVisible, setAddHabitVisible] = useState(false);
  const [animatedCircles, setAnimatedCircles] = useState<{ [key: string]: Animated.Value }>({});
  const [newHabitName, setNewHabitName] = useState('');
  const fadeAnims = useRef<Animated.Value[]>([]).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadHabits();
  }, []);
 
  useEffect(() => {
    if (!isLoading) {  // Only save when not in initial loading
      saveHabits();
    }
  }, [habits]);

  useEffect(() => {
    // Reset animation values
    fadeAnims.length = 0;
    
    // Create new animation values for each habit
    habits.forEach(() => {
      fadeAnims.push(new Animated.Value(0));
    });
    
    if (!isLoading) {
      Animated.stagger(100, 
        fadeAnims.map(anim => 
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        )
      ).start();
    }
  }, [isLoading, habits.length]);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  const saveHabits = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  };

  const loadHabits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const savedHabits = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      }
    } catch (error) {
      setError('Failed to load habits');
      console.error('Error loading habits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText>{error}</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Helper function to get unique key for each circle
  const getCircleKey = (habitId: string, dateKey: string) => `${habitId}-${dateKey}`;

  // Initialize animation value for new circles
  const getAnimatedValue = (habitId: string, dayIndex: string) => {
    const key = getCircleKey(habitId, dayIndex);
    if (!animatedCircles[key]) {
      setAnimatedCircles(prev => ({
        ...prev,
        [key]: new Animated.Value(1)
      }));
    }
    return animatedCircles[key] || new Animated.Value(1);
  };

  const toggleHabit = async (habitId: string, dateKey: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const isCompleting = !habit.completed[dateKey];
    const circleKey = getCircleKey(habitId, dateKey);
    const scaleValue = animatedCircles[circleKey] || new Animated.Value(1);
    if (isCompleting) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Update habits state
    const newHabits = habits.map(h => {
      if (h.id === habitId) {
        const newCompleted = { ...h.completed };
        newCompleted[dateKey] = !newCompleted[dateKey];
        return {
          ...h,
          completed: newCompleted
        };
      }
      return h;
    });

    setHabits(newHabits);
  };

  const addHabit = async () => {
    if (newHabitName.trim()) {
      const newHabit: Habit = {
        id: Date.now().toString(),
        name: newHabitName,
        completed: {}
      };
      setHabits([...habits, newHabit]);
      setNewHabitName('');
      setAddHabitVisible(false);
    }
  };

  const showAddHabit = () => {
    setAddHabitVisible(true);
  };

  // Update the main view rendering
  const getLastFiveDays = () => {
    const dates = [];
    const today = moment().startOf('day');
    
    for (let i = 4; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days');
      dates.push({
        date: formatDate(date),
        dayName: date.format('ddd')
      });
    }
    return dates;
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      <ScrollView style={[styles.container, isDark && styles.darkContainer]}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">minihabits.</ThemedText>
          <TouchableOpacity 
            style={[styles.addButton, isDark && styles.darkAddButton]} 
            onPress={showAddHabit}
          >
            <ThemedText style={styles.addButtonText}>+</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <Animated.View style={{ opacity: fadeAnim }}>
          {habits.map((habit, index) => (
            <Animated.View
              key={habit.id}
              style={[
                {
                  opacity: fadeAnims[index] || new Animated.Value(1),
                  transform: [{
                    translateY: (fadeAnims[index] || new Animated.Value(1)).interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0]
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  const habitData = JSON.stringify(habit);
                  const habitsData = JSON.stringify(habits);
                  router.replace({
                    pathname: '/HabitDetailsScreen',
                    params: { 
                      habit: habitData,
                      habits: habitsData
                    }
                  });
                }}
              >
                <ThemedView style={styles.habitRow}>
                  <View style={styles.habitInfo}>
                    <ThemedText style={styles.habitName}>{habit.name}</ThemedText>
                    <View style={styles.streakContainer}>
                      <Ionicons name="flame" size={16} color="#FF4500" />
                      <ThemedText style={styles.streakCount}>
                        {calculateCurrentStreak(habit.completed)}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedView style={styles.daysContainer}>
                    {getLastFiveDays().map(({ date, dayName }, index) => (
                      <View key={index} style={styles.dayColumn}>
                        <ThemedText style={styles.dayLabel}>{dayName}</ThemedText>
                        <Animated.View
                          style={[
                            {
                              transform: [{
                                scale: getAnimatedValue(habit.id, date)
                              }]
                            }
                          ]}
                        >
                          <TouchableOpacity
                            onPress={() => toggleHabit(habit.id, date)}
                            style={[
                              styles.dayCircle,
                              isDark && styles.darkDayCircle,
                              habit.completed[date] && 
                                (isDark ? styles.darkDayCircleCompleted : styles.dayCircleCompleted)
                            ]}
                          />
                        </Animated.View>
                      </View>
                    ))}
                  </ThemedView>
                </ThemedView>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Add Habit Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={addHabitVisible}
          onRequestClose={() => {
            setAddHabitVisible(false);
            setNewHabitName('');
          }}
        >
          <BlurView 
            intensity={20} 
            style={styles.modalContainer}
            tint={isDark ? 'dark' : 'light'}
          >
            <TouchableOpacity 
              style={styles.modalOverlay} 
              activeOpacity={1} 
              onPress={() => setAddHabitVisible(false)}
            >
              <View style={[
                styles.modalView, 
                {
                  backgroundColor: isDark ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)'
                },
                isDark && styles.darkModalView
              ]}>
                <TextInput
                  style={[styles.input, isDark && styles.darkInput]}
                  placeholder="Enter habit name"
                  placeholderTextColor={isDark ? '#888' : '#666'}
                  value={newHabitName}
                  onChangeText={setNewHabitName}
                  autoFocus={true}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton, isDark && styles.darkCancelButton]} 
                    onPress={() => setAddHabitVisible(false)}
                  >
                    <ThemedText>Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton, isDark && styles.darkConfirmButton]} 
                    onPress={() => {
                      addHabit();
                      setAddHabitVisible(false);
                    }}
                  >
                    <ThemedText style={styles.confirmButtonText}>Add</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </BlurView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkSafeArea: {
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  darkContainer: {
    backgroundColor: '#000',
  },
  header: {
    padding: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitRow: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  habitName: {
    fontSize: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
  },
  darkDayCircle: {
    borderColor: '#fff',
  },
  dayCircleCompleted: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  darkDayCircleCompleted: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkAddButton: {
    borderColor: '#fff',
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: -2, // Fine-tune the + symbol position
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backdropFilter: 'blur(10px)',
  },
  modalView: {
    width: '80%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  darkModalView: {
    shadowColor: '#fff',
  },
  input: {
    height: 40,
    borderColor: '#000',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '100%',
    borderRadius: 8,
  },
  darkInput: {
    borderColor: '#fff',
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderColor: '#000',
  },
  darkCancelButton: {
    backgroundColor: '#1a1a1a',
    borderColor: '#fff',
  },
  confirmButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  darkConfirmButton: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  confirmButtonText: {
    color: '#fff',
  },
  darkConfirmButtonText: {
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    fontSize: 10,
    color: '#666',
  },
  habitInfo: {
    flex: 1,
    marginRight: 12,
  },
  streakCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});
