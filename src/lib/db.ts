import Dexie, { type EntityTable } from 'dexie';

// ===== Data Models =====

export interface UserProfile {
  id?: number;
  heightCm: number;
  weightKg: number;
  goal: 'cut' | 'recomp' | 'bulk';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  // Optional lab values
  triglycerides?: number;
  ldl?: number;
  hdl?: number;
  nonHdl?: number;
  hbA1c?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FoodItem {
  id?: number;
  name: string;
  calories: number;    // per 100g
  protein: number;     // per 100g
  fiber: number;       // per 100g
  satFat: number;      // per 100g
  isFavorite: boolean;
  category?: string;   // e.g., 'protein', 'vegetable', 'grain', 'dairy', 'fat', 'other'
}

export interface MealLogItem {
  foodId: number;
  foodName: string;
  quantityG: number;
  calories: number;
  protein: number;
  fiber: number;
  satFat: number;
}

export interface MealLog {
  id?: number;
  datetime: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: MealLogItem[];
  totals: {
    calories: number;
    protein: number;
    fiber: number;
    satFat: number;
  };
}

export interface WorkoutPlan {
  id?: number;
  name: string;       // "A" or "B"
  label: string;      // e.g., "上半身" or "下半身"
  exercises: string[];
}

export interface WorkoutLog {
  id?: number;
  datetime: string;
  planId: number;
  planName: string;
  completed: boolean;
  rpe?: number;        // 1-10
}

export interface DailySummary {
  id?: number;
  date: string;        // YYYY-MM-DD
  totals: {
    calories: number;
    protein: number;
    fiber: number;
    satFat: number;
    steps: number;
  };
  scores: {
    lipid: number;     // 0-100
    fatloss: number;   // 0-100
    muscle: number;    // 0-100
  };
  workoutCompleted: boolean;
  workoutPlanName?: string;
}

export interface WeeklySummary {
  id?: number;
  weekStart: string;   // YYYY-MM-DD (Monday)
  avgScores: {
    lipid: number;
    fatloss: number;
    muscle: number;
  };
  avgTotals: {
    calories: number;
    protein: number;
    fiber: number;
    satFat: number;
  };
  highlight: string;
  improvement: string;
  weightStart?: number;
  weightEnd?: number;
}

// ===== Database =====

class HealthDB extends Dexie {
  userProfiles!: EntityTable<UserProfile, 'id'>;
  foodItems!: EntityTable<FoodItem, 'id'>;
  mealLogs!: EntityTable<MealLog, 'id'>;
  workoutPlans!: EntityTable<WorkoutPlan, 'id'>;
  workoutLogs!: EntityTable<WorkoutLog, 'id'>;
  dailySummaries!: EntityTable<DailySummary, 'id'>;
  weeklySummaries!: EntityTable<WeeklySummary, 'id'>;

  constructor() {
    super('HealthManagementDB');
    this.version(1).stores({
      userProfiles: '++id',
      foodItems: '++id, name, isFavorite, category',
      mealLogs: '++id, datetime, mealType',
      workoutPlans: '++id, name',
      workoutLogs: '++id, datetime, planId',
      dailySummaries: '++id, &date',
      weeklySummaries: '++id, &weekStart',
    });
  }
}

export const db = new HealthDB();

// ===== Seed Data =====

export async function seedDefaultData() {
  // Seed workout plans if empty
  const planCount = await db.workoutPlans.count();
  if (planCount === 0) {
    await db.workoutPlans.bulkAdd([
      {
        name: 'A',
        label: '上半身（押す＋引く）',
        exercises: [
          'ベンチプレス 3×8-10',
          'ダンベルロウ 3×10-12',
          'ショルダープレス 3×10',
          'ラットプルダウン 3×10-12',
          'アームカール 2×12',
          'トライセプス 2×12',
        ],
      },
      {
        name: 'B',
        label: '下半身＋コア',
        exercises: [
          'スクワット 3×8-10',
          'レッグプレス 3×10-12',
          'ルーマニアンDL 3×10',
          'レッグカール 3×12',
          'カーフレイズ 3×15',
          'プランク 3×30秒',
        ],
      },
    ]);
  }

  // Seed common food items if empty
  const foodCount = await db.foodItems.count();
  if (foodCount === 0) {
    await db.foodItems.bulkAdd([
      // Proteins
      { name: '鶏むね肉（皮なし）', calories: 108, protein: 22.3, fiber: 0, satFat: 0.3, isFavorite: true, category: 'protein' },
      { name: '鶏もも肉（皮なし）', calories: 116, protein: 18.8, fiber: 0, satFat: 1.2, isFavorite: false, category: 'protein' },
      { name: '豚ロース（赤身）', calories: 150, protein: 22.7, fiber: 0, satFat: 2.0, isFavorite: false, category: 'protein' },
      { name: '牛もも肉（赤身）', calories: 182, protein: 21.2, fiber: 0, satFat: 3.5, isFavorite: false, category: 'protein' },
      { name: 'サーモン', calories: 208, protein: 20.1, fiber: 0, satFat: 1.5, isFavorite: true, category: 'protein' },
      { name: 'サバ', calories: 202, protein: 20.7, fiber: 0, satFat: 3.2, isFavorite: true, category: 'protein' },
      { name: 'マグロ（赤身）', calories: 125, protein: 26.4, fiber: 0, satFat: 0.2, isFavorite: false, category: 'protein' },
      { name: '卵（1個60g）', calories: 151, protein: 12.3, fiber: 0, satFat: 3.1, isFavorite: true, category: 'protein' },
      { name: '木綿豆腐', calories: 72, protein: 6.6, fiber: 0.4, satFat: 0.7, isFavorite: true, category: 'protein' },
      { name: '納豆（1パック45g）', calories: 200, protein: 16.5, fiber: 6.7, satFat: 1.4, isFavorite: true, category: 'protein' },
      { name: 'プロテインパウダー', calories: 380, protein: 75.0, fiber: 0, satFat: 0.5, isFavorite: true, category: 'protein' },
      // Grains
      { name: '白米（炊飯後）', calories: 168, protein: 2.5, fiber: 0.3, satFat: 0.1, isFavorite: true, category: 'grain' },
      { name: '玄米（炊飯後）', calories: 165, protein: 2.8, fiber: 1.4, satFat: 0.2, isFavorite: false, category: 'grain' },
      { name: 'オートミール', calories: 380, protein: 13.7, fiber: 9.4, satFat: 1.2, isFavorite: true, category: 'grain' },
      { name: '食パン（6枚切り1枚）', calories: 264, protein: 9.3, fiber: 2.3, satFat: 1.6, isFavorite: false, category: 'grain' },
      { name: 'そば（茹で）', calories: 132, protein: 4.8, fiber: 2.0, satFat: 0.2, isFavorite: false, category: 'grain' },
      // Vegetables
      { name: 'ブロッコリー', calories: 33, protein: 4.3, fiber: 4.4, satFat: 0.1, isFavorite: true, category: 'vegetable' },
      { name: 'ほうれん草', calories: 20, protein: 2.2, fiber: 2.8, satFat: 0, isFavorite: false, category: 'vegetable' },
      { name: 'トマト', calories: 19, protein: 0.7, fiber: 1.0, satFat: 0, isFavorite: false, category: 'vegetable' },
      { name: 'キャベツ', calories: 23, protein: 1.3, fiber: 1.8, satFat: 0, isFavorite: false, category: 'vegetable' },
      { name: 'アボカド', calories: 187, protein: 2.5, fiber: 5.3, satFat: 2.5, isFavorite: false, category: 'vegetable' },
      { name: 'わかめ（水戻し）', calories: 16, protein: 1.9, fiber: 3.6, satFat: 0, isFavorite: true, category: 'vegetable' },
      { name: 'きのこ（しめじ）', calories: 18, protein: 2.7, fiber: 3.7, satFat: 0, isFavorite: false, category: 'vegetable' },
      // Dairy / Fats
      { name: 'ギリシャヨーグルト（無糖）', calories: 59, protein: 10.0, fiber: 0, satFat: 0.3, isFavorite: true, category: 'dairy' },
      { name: '牛乳', calories: 67, protein: 3.3, fiber: 0, satFat: 2.3, isFavorite: false, category: 'dairy' },
      { name: 'チーズ（スライス1枚）', calories: 339, protein: 22.7, fiber: 0, satFat: 12.0, isFavorite: false, category: 'dairy' },
      { name: 'オリーブオイル（大さじ1=13g）', calories: 921, protein: 0, fiber: 0, satFat: 13.3, isFavorite: false, category: 'fat' },
      // Others
      { name: 'バナナ', calories: 86, protein: 1.1, fiber: 1.1, satFat: 0.1, isFavorite: false, category: 'other' },
      { name: 'りんご', calories: 54, protein: 0.2, fiber: 1.5, satFat: 0, isFavorite: false, category: 'other' },
      { name: 'アーモンド', calories: 587, protein: 18.6, fiber: 10.4, satFat: 3.9, isFavorite: false, category: 'other' },
    ]);
  }
}

// ===== Helper Functions =====

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export async function getProfile(): Promise<UserProfile | undefined> {
  const profiles = await db.userProfiles.toArray();
  return profiles[0];
}

export async function getTodayMeals(): Promise<MealLog[]> {
  const today = getToday();
  return db.mealLogs.where('datetime').startsWith(today).toArray();
}

export async function getTodayWorkout(): Promise<WorkoutLog | undefined> {
  const today = getToday();
  const logs = await db.workoutLogs.where('datetime').startsWith(today).toArray();
  return logs[0];
}

export async function getDailySummaryForDate(date: string): Promise<DailySummary | undefined> {
  return db.dailySummaries.where('date').equals(date).first();
}

export async function getFavorites(): Promise<FoodItem[]> {
  return db.foodItems.where('isFavorite').equals(1).toArray();
}
