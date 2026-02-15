'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, getToday, type UserProfile, type MealLog, type WorkoutLog, type DailySummary, type FoodItem, type WorkoutPlan } from './db';
import { computeDailyTargets, computeScores, type DailyTargets, type DailyTotals } from './engine';

export function useProfile(): UserProfile | undefined {
  return useLiveQuery(() => db.userProfiles.toCollection().first());
}

export function useTodayMeals(): MealLog[] {
  const today = getToday();
  return useLiveQuery(() => db.mealLogs.where('datetime').startsWith(today).toArray(), [today]) ?? [];
}

export function useTodayWorkout(): WorkoutLog | undefined {
  const today = getToday();
  return useLiveQuery(() =>
    db.workoutLogs.where('datetime').startsWith(today).first(), [today]);
}

export function useDailySummary(date?: string): DailySummary | undefined {
  const d = date ?? getToday();
  return useLiveQuery(() => db.dailySummaries.where('date').equals(d).first(), [d]);
}

export function useFavorites(): FoodItem[] {
  return useLiveQuery(() => db.foodItems.where('isFavorite').equals(1).toArray()) ?? [];
}

export function useAllFoods(): FoodItem[] {
  return useLiveQuery(() => db.foodItems.toArray()) ?? [];
}

export function useWorkoutPlans(): WorkoutPlan[] {
  return useLiveQuery(() => db.workoutPlans.toArray()) ?? [];
}

export function useDailyTargets(profile?: UserProfile): DailyTargets | null {
  if (!profile) return null;
  return computeDailyTargets(profile);
}

export function useTodayTotals(meals: MealLog[], workout?: WorkoutLog, summary?: DailySummary): DailyTotals {
  const mealTotals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totals.calories,
      protein: acc.protein + meal.totals.protein,
      fiber: acc.fiber + meal.totals.fiber,
      satFat: acc.satFat + meal.totals.satFat,
    }),
    { calories: 0, protein: 0, fiber: 0, satFat: 0 }
  );

  return {
    ...mealTotals,
    steps: summary?.totals.steps ?? 0,
    workoutDone: workout?.completed ?? false,
  };
}

export function useRecentSummaries(days: number = 7): DailySummary[] {
  return useLiveQuery(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - days);
    const startStr = start.toISOString().split('T')[0];
    return db.dailySummaries.where('date').aboveOrEqual(startStr).toArray();
  }, [days]) ?? [];
}
