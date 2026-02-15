import { db, getToday, type MealLog, type MealLogItem, type WorkoutLog, type DailySummary, type UserProfile, type FoodItem } from './db';
import { computeDailyTargets, computeScores } from './engine';

// ===== Meal Actions =====

export async function addMealLog(
  mealType: MealLog['mealType'],
  items: MealLogItem[]
): Promise<number | undefined> {
  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      fiber: acc.fiber + item.fiber,
      satFat: acc.satFat + item.satFat,
    }),
    { calories: 0, protein: 0, fiber: 0, satFat: 0 }
  );

  const id = await db.mealLogs.add({
    datetime: new Date().toISOString(),
    mealType,
    items,
    totals,
  });

  await updateDailySummary();
  return id;
}

export async function deleteMealLog(id: number): Promise<void> {
  await db.mealLogs.delete(id);
  await updateDailySummary();
}

// ===== Workout Actions =====

export async function logWorkout(
  planId: number,
  planName: string,
  completed: boolean,
  rpe?: number
): Promise<number | undefined> {
  const today = getToday();
  // Check if already logged today
  const existing = await db.workoutLogs.where('datetime').startsWith(today).first();
  if (existing) {
    await db.workoutLogs.update(existing.id!, { completed, rpe });
    await updateDailySummary();
    return existing.id!;
  }

  const id = await db.workoutLogs.add({
    datetime: new Date().toISOString(),
    planId,
    planName,
    completed,
    rpe,
  });

  await updateDailySummary();
  return id;
}

// ===== Daily Summary =====

export async function updateDailySummary(): Promise<void> {
  const today = getToday();
  const profile = await db.userProfiles.toCollection().first();
  if (!profile) return;

  const meals = await db.mealLogs.where('datetime').startsWith(today).toArray();
  const workout = await db.workoutLogs.where('datetime').startsWith(today).first();

  const mealTotals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totals.calories,
      protein: acc.protein + meal.totals.protein,
      fiber: acc.fiber + meal.totals.fiber,
      satFat: acc.satFat + meal.totals.satFat,
    }),
    { calories: 0, protein: 0, fiber: 0, satFat: 0 }
  );

  const existing = await db.dailySummaries.where('date').equals(today).first();
  const steps = existing?.totals.steps ?? 0;

  const targets = computeDailyTargets(profile);
  const totals = {
    ...mealTotals,
    steps,
    workoutDone: workout?.completed ?? false,
  };
  const scores = computeScores(totals, targets);

  const summaryData: DailySummary = {
    date: today,
    totals: { ...mealTotals, steps },
    scores,
    workoutCompleted: workout?.completed ?? false,
    workoutPlanName: workout?.planName,
  };

  if (existing) {
    await db.dailySummaries.update(existing.id!, summaryData);
  } else {
    await db.dailySummaries.add(summaryData);
  }
}

export async function updateSteps(steps: number): Promise<void> {
  const today = getToday();
  const existing = await db.dailySummaries.where('date').equals(today).first();
  if (existing) {
    await db.dailySummaries.update(existing.id!, {
      'totals.steps': steps,
    });
    // Recalculate scores
    await updateDailySummary();
  } else {
    await db.dailySummaries.add({
      date: today,
      totals: { calories: 0, protein: 0, fiber: 0, satFat: 0, steps },
      scores: { lipid: 0, fatloss: 0, muscle: 0 },
      workoutCompleted: false,
    });
    await updateDailySummary();
  }
}

// ===== Profile Actions =====

export async function saveProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<number | undefined> {
  const existing = await db.userProfiles.toCollection().first();
  const now = new Date().toISOString();

  if (existing) {
    await db.userProfiles.update(existing.id!, {
      ...profile,
      updatedAt: now,
    });
    return existing.id!;
  }

  return db.userProfiles.add({
    ...profile,
    createdAt: now,
    updatedAt: now,
  });
}

// ===== Food Item Actions =====

export async function addFoodItem(food: Omit<FoodItem, 'id'>): Promise<number | undefined> {
  return db.foodItems.add(food);
}

export async function updateFoodItem(id: number, updates: Partial<FoodItem>): Promise<void> {
  await db.foodItems.update(id, updates);
}

export async function toggleFavorite(id: number): Promise<void> {
  const food = await db.foodItems.get(id);
  if (food) {
    await db.foodItems.update(id, { isFavorite: !food.isFavorite });
  }
}

export async function deleteFoodItem(id: number): Promise<void> {
  await db.foodItems.delete(id);
}
