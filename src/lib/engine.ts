import type { UserProfile, DailySummary, FoodItem } from './db';

// ===== Target Computation =====

export interface DailyTargets {
  calories: number;
  protein: number;      // grams
  fiber: number;        // grams
  satFatMax: number;    // grams (upper limit)
  steps: number;
}

export function computeDailyTargets(profile: UserProfile): DailyTargets {
  // BMR (Mifflin-St Jeor, simplified for male; adjust if needed)
  const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * 30 + 5; // age default 30

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };
  const tdee = bmr * (activityMultipliers[profile.activityLevel] || 1.375);

  let targetCalories: number;
  switch (profile.goal) {
    case 'cut':
      targetCalories = tdee - 300;
      break;
    case 'bulk':
      targetCalories = tdee + 200;
      break;
    case 'recomp':
    default:
      targetCalories = tdee - 100;
      break;
  }

  const proteinTarget = profile.weightKg * 1.6;
  const fiberTarget = 25; // grams/day (general recommendation)
  const satFatMax = (targetCalories * 0.07) / 9; // <7% of calories from sat fat for lipid health

  return {
    calories: Math.round(targetCalories),
    protein: Math.round(proteinTarget),
    fiber: fiberTarget,
    satFatMax: Math.round(satFatMax * 10) / 10,
    steps: 8000,
  };
}

// ===== Score Computation =====

export interface Scores {
  lipid: number;
  fatloss: number;
  muscle: number;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  fiber: number;
  satFat: number;
  steps: number;
  workoutDone: boolean;
}

export function computeScores(totals: DailyTotals, targets: DailyTargets): Scores {
  // Lipid Score (0-100)
  const fiberScore = Math.min(totals.fiber / targets.fiber, 1) * 40;
  const satFatScore = totals.satFat <= targets.satFatMax
    ? 30
    : Math.max(0, 30 - (totals.satFat - targets.satFatMax) * 3);
  const stepsScore = Math.min(totals.steps / targets.steps, 1) * 20;
  const calOverPenalty = totals.calories > targets.calories * 1.1
    ? Math.min(10, ((totals.calories - targets.calories * 1.1) / targets.calories) * 30)
    : 0;
  const lipid = Math.round(Math.max(0, Math.min(100, fiberScore + satFatScore + stepsScore + 10 - calOverPenalty)));

  // Fatloss Score (0-100)
  const calDiff = targets.calories - totals.calories;
  let calScore: number;
  if (calDiff >= 0) {
    // Under target (good for cut)
    calScore = Math.min(60, 60 - (calDiff / targets.calories) * 40);
    calScore = Math.max(40, calScore); // reasonable deficit is good
  } else {
    // Over target
    calScore = Math.max(0, 60 + (calDiff / targets.calories) * 80);
  }
  const activityScore2 = Math.min(totals.steps / targets.steps, 1) * 25;
  const workoutBonus = totals.workoutDone ? 15 : 0;
  const fatloss = Math.round(Math.max(0, Math.min(100, calScore + activityScore2 + workoutBonus)));

  // Muscle Score (0-100)
  const proteinScore = Math.min(totals.protein / targets.protein, 1) * 50;
  const workoutScore = totals.workoutDone ? 40 : 0;
  const muscleBase = proteinScore + workoutScore + 10;
  const muscle = Math.round(Math.max(0, Math.min(100, muscleBase)));

  return { lipid, fatloss, muscle };
}

// ===== Suggestion Engine =====

export type ActionType = 'add' | 'replace';

export interface Suggestion {
  type: ActionType;
  category: 'fiber' | 'protein' | 'satfat' | 'calories';
  message: string;
  reason: string;
  foodCandidates: FoodItem[];
}

export interface StrategyCard {
  lipidLine: string;
  fatlossLine: string;
  muscleLine: string;
  reasons: {
    lipid: string;
    fatloss: string;
    muscle: string;
  };
}

export function generateStrategyCard(
  totals: DailyTotals,
  targets: DailyTargets,
  workoutPlanName?: string
): StrategyCard {
  // Lipid line
  const fiberGap = targets.fiber - totals.fiber;
  const satFatOver = totals.satFat - targets.satFatMax;
  let lipidLine: string;
  let lipidReason: string;
  if (fiberGap > 10) {
    lipidLine = `食物繊維 +${Math.round(fiberGap)}g / 飽和脂肪 控えめに`;
    lipidReason = '食物繊維は中性脂肪・LDLの改善に効果的。目標25g/日に対してまだ不足しています。';
  } else if (satFatOver > 3) {
    lipidLine = `飽和脂肪を控える（あと-${Math.round(satFatOver)}g）`;
    lipidReason = '飽和脂肪の過剰はLDLを上昇させます。魚や植物性脂肪への置換が有効です。';
  } else if (fiberGap > 0) {
    lipidLine = `食物繊維 あと+${Math.round(fiberGap)}g`;
    lipidReason = '水溶性食物繊維はコレステロール吸収を抑制します。あと少しで目標達成です。';
  } else {
    lipidLine = '脂質ケア 良好 ✓';
    lipidReason = '食物繊維・飽和脂肪ともに目標範囲内です。この調子を維持しましょう。';
  }

  // Fatloss line
  const calRemaining = targets.calories - totals.calories;
  let fatlossLine: string;
  let fatlossReason: string;
  if (calRemaining > targets.calories * 0.7) {
    fatlossLine = `目安 ${Math.round(targets.calories)}kcal（残り ${Math.round(calRemaining)}kcal）`;
    fatlossReason = `減量目標のカロリーは${targets.calories}kcal/日。バランスよく摂りましょう。`;
  } else if (calRemaining > 0) {
    fatlossLine = `残り ${Math.round(calRemaining)}kcal`;
    fatlossReason = 'いい感じに進んでいます。残りのカロリーを考えて次の食事を選びましょう。';
  } else {
    fatlossLine = `目標を${Math.round(-calRemaining)}kcal超過`;
    fatlossReason = '少し超えていますが、歩数を増やすか明日調整すればOKです。';
  }

  // Muscle line
  const proteinGap = targets.protein - totals.protein;
  let muscleLine: string;
  let muscleReason: string;
  if (proteinGap > targets.protein * 0.5) {
    muscleLine = `たんぱく質 ${Math.round(targets.protein)}g目標${workoutPlanName ? ` / 筋トレ${workoutPlanName}` : ''}`;
    muscleReason = `筋肥大には体重×1.6g=${Math.round(targets.protein)}gのたんぱく質が必要です。`;
  } else if (proteinGap > 0) {
    muscleLine = `たんぱく質 あと+${Math.round(proteinGap)}g${workoutPlanName ? ` / 筋トレ${workoutPlanName}` : ''}`;
    muscleReason = 'もう少しでたんぱく質目標達成。次の食事でたんぱく源を意識しましょう。';
  } else {
    muscleLine = `たんぱく質 達成 ✓${workoutPlanName ? ` / 筋トレ${workoutPlanName}` : ''}`;
    muscleReason = 'たんぱく質は十分です。筋トレとセットで筋合成を最大化しましょう。';
  }

  return {
    lipidLine,
    fatlossLine,
    muscleLine,
    reasons: {
      lipid: lipidReason,
      fatloss: fatlossReason,
      muscle: muscleReason,
    },
  };
}

export function suggestNextActions(
  totals: DailyTotals,
  targets: DailyTargets,
  favorites: FoodItem[]
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const allFoods = favorites.length > 0 ? favorites : [];

  // Priority 1: Fiber deficit (lipid improvement)
  const fiberGap = targets.fiber - totals.fiber;
  if (fiberGap > 3) {
    const fiberFoods = allFoods
      .filter(f => f.fiber > 2)
      .sort((a, b) => b.fiber - a.fiber)
      .slice(0, 3);
    if (fiberFoods.length > 0) {
      suggestions.push({
        type: 'add',
        category: 'fiber',
        message: `食物繊維を+${Math.round(fiberGap)}g足しましょう`,
        reason: '食物繊維は中性脂肪・LDL改善の最重要レバー。海藻・豆・野菜が効果的です。',
        foodCandidates: fiberFoods,
      });
    }
  }

  // Priority 2: Saturated fat excess (lipid improvement)
  const satFatOver = totals.satFat - targets.satFatMax;
  if (satFatOver > 2 && suggestions.length < 2) {
    const goodFats = allFoods
      .filter(f => f.satFat < 2 && f.protein > 5)
      .sort((a, b) => a.satFat - b.satFat)
      .slice(0, 3);
    if (goodFats.length > 0) {
      suggestions.push({
        type: 'replace',
        category: 'satfat',
        message: '次の食事は低飽和脂肪のたんぱく源に',
        reason: '飽和脂肪が多め。魚・鶏むね・豆腐など良質なたんぱく源に置き換えましょう。',
        foodCandidates: goodFats,
      });
    }
  }

  // Priority 3: Protein deficit (muscle)
  const proteinGap = targets.protein - totals.protein;
  if (proteinGap > 15 && suggestions.length < 2) {
    const proteinFoods = allFoods
      .filter(f => f.protein > 10)
      .sort((a, b) => b.protein / Math.max(b.calories, 1) - a.protein / Math.max(a.calories, 1))
      .slice(0, 3);
    if (proteinFoods.length > 0) {
      suggestions.push({
        type: 'add',
        category: 'protein',
        message: `たんぱく質を+${Math.round(proteinGap)}g足しましょう`,
        reason: `筋肥大には体重×1.6g=${Math.round(targets.protein)}gが目安。不足分をカバーしましょう。`,
        foodCandidates: proteinFoods,
      });
    }
  }

  // Priority 4: Calorie surplus (fatloss)
  const calOver = totals.calories - targets.calories;
  if (calOver > 100 && suggestions.length < 2) {
    const lightFoods = allFoods
      .filter(f => f.calories < 100)
      .sort((a, b) => a.calories - b.calories)
      .slice(0, 3);
    if (lightFoods.length > 0) {
      suggestions.push({
        type: 'replace',
        category: 'calories',
        message: '次はカロリー控えめな食材で調整',
        reason: `目標を${Math.round(calOver)}kcal超過中。低カロリー食材でバランスを取りましょう。`,
        foodCandidates: lightFoods,
      });
    }
  }

  return suggestions.slice(0, 2);
}

// ===== Workout Schedule =====

export function getTodayWorkoutPlan(dayOfWeek: number): { planName: string; isRestDay: boolean } {
  // Mon=1, Tue=2, ... Sun=0
  // Default: Mon/Thu = A, Tue/Fri = B, rest otherwise
  switch (dayOfWeek) {
    case 1: // Monday
    case 4: // Thursday
      return { planName: 'A', isRestDay: false };
    case 2: // Tuesday
    case 5: // Friday
      return { planName: 'B', isRestDay: false };
    default:
      return { planName: '', isRestDay: true };
  }
}

// ===== Weekly Summary Generation =====

export function generateWeeklyHighlight(dailySummaries: DailySummary[]): { highlight: string; improvement: string } {
  if (dailySummaries.length === 0) {
    return { highlight: 'データが不足しています', improvement: 'まず1週間の記録を目指しましょう' };
  }

  const avgScores = {
    lipid: dailySummaries.reduce((s, d) => s + d.scores.lipid, 0) / dailySummaries.length,
    fatloss: dailySummaries.reduce((s, d) => s + d.scores.fatloss, 0) / dailySummaries.length,
    muscle: dailySummaries.reduce((s, d) => s + d.scores.muscle, 0) / dailySummaries.length,
  };

  // Find best area
  const bestArea = Object.entries(avgScores).sort(([, a], [, b]) => b - a)[0];
  const worstArea = Object.entries(avgScores).sort(([, a], [, b]) => a - b)[0];

  const areaNames: Record<string, string> = {
    lipid: '脂質ケア',
    fatloss: '減量',
    muscle: '筋肉づくり',
  };

  const highlight = `${areaNames[bestArea[0]]}が好調（平均${Math.round(bestArea[1])}点）`;

  const improvementTips: Record<string, string> = {
    lipid: '食物繊維を意識して、海藻・豆類を増やしてみましょう',
    fatloss: 'カロリー管理と歩数アップで改善できます',
    muscle: 'たんぱく質の摂取と筋トレの回数を増やしましょう',
  };

  const improvement = `${areaNames[worstArea[0]]}を強化: ${improvementTips[worstArea[0]]}`;

  return { highlight, improvement };
}
