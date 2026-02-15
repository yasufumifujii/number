import {
  computeDailyTargets,
  computeScores,
  suggestNextActions,
  generateStrategyCard,
  generateWeeklyHighlight,
  getTodayWorkoutPlan,
  type DailyTotals,
} from '../engine';
import type { UserProfile, FoodItem, DailySummary } from '../db';

// ===== Test Fixtures =====

const defaultProfile: UserProfile = {
  heightCm: 170,
  weightKg: 75,
  goal: 'cut',
  activityLevel: 'moderate',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const sampleFavorites: FoodItem[] = [
  { id: 1, name: 'オートミール', calories: 380, protein: 13.7, fiber: 9.4, satFat: 1.2, isFavorite: true, category: 'grain' },
  { id: 2, name: '鶏むね肉', calories: 108, protein: 22.3, fiber: 0, satFat: 0.3, isFavorite: true, category: 'protein' },
  { id: 3, name: 'ブロッコリー', calories: 33, protein: 4.3, fiber: 4.4, satFat: 0.1, isFavorite: true, category: 'vegetable' },
  { id: 4, name: 'サーモン', calories: 208, protein: 20.1, fiber: 0, satFat: 1.5, isFavorite: true, category: 'protein' },
  { id: 5, name: 'わかめ', calories: 16, protein: 1.9, fiber: 3.6, satFat: 0, isFavorite: true, category: 'vegetable' },
  { id: 6, name: '納豆', calories: 200, protein: 16.5, fiber: 6.7, satFat: 1.4, isFavorite: true, category: 'protein' },
  { id: 7, name: 'プロテイン', calories: 380, protein: 75, fiber: 0, satFat: 0.5, isFavorite: true, category: 'protein' },
  { id: 8, name: '木綿豆腐', calories: 72, protein: 6.6, fiber: 0.4, satFat: 0.7, isFavorite: true, category: 'protein' },
];

function makeTotals(overrides: Partial<DailyTotals> = {}): DailyTotals {
  return {
    calories: 0,
    protein: 0,
    fiber: 0,
    satFat: 0,
    steps: 0,
    workoutDone: false,
    ...overrides,
  };
}

// ===== computeDailyTargets =====

describe('computeDailyTargets', () => {
  it('returns reasonable calorie target for cut goal', () => {
    const targets = computeDailyTargets(defaultProfile);
    expect(targets.calories).toBeGreaterThan(1500);
    expect(targets.calories).toBeLessThan(2500);
  });

  it('cut has lower calories than bulk', () => {
    const cutTargets = computeDailyTargets({ ...defaultProfile, goal: 'cut' });
    const bulkTargets = computeDailyTargets({ ...defaultProfile, goal: 'bulk' });
    expect(cutTargets.calories).toBeLessThan(bulkTargets.calories);
  });

  it('protein target is weight * 1.6', () => {
    const targets = computeDailyTargets(defaultProfile);
    expect(targets.protein).toBe(Math.round(75 * 1.6));
  });

  it('fiber target is 25g', () => {
    const targets = computeDailyTargets(defaultProfile);
    expect(targets.fiber).toBe(25);
  });

  it('saturated fat limit is <7% of calories', () => {
    const targets = computeDailyTargets(defaultProfile);
    const satFatCalories = targets.satFatMax * 9;
    expect(satFatCalories / targets.calories).toBeLessThan(0.08); // slight tolerance
  });

  it('higher activity level means higher calorie target', () => {
    const sedentary = computeDailyTargets({ ...defaultProfile, activityLevel: 'sedentary' });
    const active = computeDailyTargets({ ...defaultProfile, activityLevel: 'active' });
    expect(active.calories).toBeGreaterThan(sedentary.calories);
  });
});

// ===== computeScores =====

describe('computeScores', () => {
  const targets = computeDailyTargets(defaultProfile);

  it('perfect day returns high scores', () => {
    const totals = makeTotals({
      calories: targets.calories,
      protein: targets.protein,
      fiber: targets.fiber,
      satFat: targets.satFatMax * 0.8,
      steps: 10000,
      workoutDone: true,
    });
    const scores = computeScores(totals, targets);
    expect(scores.lipid).toBeGreaterThanOrEqual(80);
    expect(scores.fatloss).toBeGreaterThanOrEqual(60);
    expect(scores.muscle).toBeGreaterThanOrEqual(80);
  });

  it('zero intake gives low scores', () => {
    const totals = makeTotals();
    const scores = computeScores(totals, targets);
    expect(scores.lipid).toBeLessThan(50);
    expect(scores.muscle).toBeLessThan(20);
  });

  it('high fiber improves lipid score', () => {
    const lowFiber = computeScores(makeTotals({ fiber: 5 }), targets);
    const highFiber = computeScores(makeTotals({ fiber: 25 }), targets);
    expect(highFiber.lipid).toBeGreaterThan(lowFiber.lipid);
  });

  it('excess saturated fat lowers lipid score', () => {
    const lowSatFat = computeScores(makeTotals({ satFat: 5, fiber: 20 }), targets);
    const highSatFat = computeScores(makeTotals({ satFat: 30, fiber: 20 }), targets);
    expect(lowSatFat.lipid).toBeGreaterThan(highSatFat.lipid);
  });

  it('workout boosts muscle score', () => {
    const noWorkout = computeScores(makeTotals({ protein: 120, workoutDone: false }), targets);
    const withWorkout = computeScores(makeTotals({ protein: 120, workoutDone: true }), targets);
    expect(withWorkout.muscle).toBeGreaterThan(noWorkout.muscle);
  });

  it('calorie overshoot lowers fatloss score', () => {
    const under = computeScores(makeTotals({ calories: targets.calories - 100 }), targets);
    const over = computeScores(makeTotals({ calories: targets.calories + 500 }), targets);
    expect(under.fatloss).toBeGreaterThan(over.fatloss);
  });

  it('scores are clamped 0-100', () => {
    const extreme = computeScores(
      makeTotals({ calories: 10000, satFat: 100, fiber: 0, protein: 0, steps: 0 }),
      targets
    );
    expect(extreme.lipid).toBeGreaterThanOrEqual(0);
    expect(extreme.lipid).toBeLessThanOrEqual(100);
    expect(extreme.fatloss).toBeGreaterThanOrEqual(0);
    expect(extreme.fatloss).toBeLessThanOrEqual(100);
    expect(extreme.muscle).toBeGreaterThanOrEqual(0);
    expect(extreme.muscle).toBeLessThanOrEqual(100);
  });
});

// ===== suggestNextActions =====

describe('suggestNextActions', () => {
  const targets = computeDailyTargets(defaultProfile);

  it('suggests fiber foods when fiber is low', () => {
    const totals = makeTotals({ fiber: 3, calories: 1000, protein: 60 });
    const suggestions = suggestNextActions(totals, targets, sampleFavorites);
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    const fiberSugg = suggestions.find(s => s.category === 'fiber');
    expect(fiberSugg).toBeDefined();
    expect(fiberSugg!.type).toBe('add');
    expect(fiberSugg!.foodCandidates.length).toBeGreaterThan(0);
    expect(fiberSugg!.foodCandidates.every(f => f.fiber > 2)).toBe(true);
  });

  it('suggests protein foods when protein is low', () => {
    const totals = makeTotals({ fiber: 25, protein: 30, calories: 1000 });
    const suggestions = suggestNextActions(totals, targets, sampleFavorites);
    const proteinSugg = suggestions.find(s => s.category === 'protein');
    expect(proteinSugg).toBeDefined();
    expect(proteinSugg!.foodCandidates.every(f => f.protein > 10)).toBe(true);
  });

  it('suggests low-satfat replacement when satfat is high', () => {
    const totals = makeTotals({ satFat: 30, fiber: 25, protein: 120, calories: 1500 });
    const suggestions = suggestNextActions(totals, targets, sampleFavorites);
    const satfatSugg = suggestions.find(s => s.category === 'satfat');
    expect(satfatSugg).toBeDefined();
    expect(satfatSugg!.type).toBe('replace');
  });

  it('returns at most 2 suggestions', () => {
    const totals = makeTotals({ fiber: 0, protein: 0, satFat: 50, calories: 3000 });
    const suggestions = suggestNextActions(totals, targets, sampleFavorites);
    expect(suggestions.length).toBeLessThanOrEqual(2);
  });

  it('each suggestion has at most 3 food candidates', () => {
    const totals = makeTotals({ fiber: 0, protein: 0 });
    const suggestions = suggestNextActions(totals, targets, sampleFavorites);
    suggestions.forEach(s => {
      expect(s.foodCandidates.length).toBeLessThanOrEqual(3);
    });
  });

  it('returns empty when all targets met', () => {
    const totals = makeTotals({
      fiber: 30,
      protein: 150,
      satFat: 5,
      calories: targets.calories - 50,
    });
    const suggestions = suggestNextActions(totals, targets, sampleFavorites);
    expect(suggestions.length).toBe(0);
  });
});

// ===== generateStrategyCard =====

describe('generateStrategyCard', () => {
  const targets = computeDailyTargets(defaultProfile);

  it('generates 3 lines at start of day', () => {
    const totals = makeTotals();
    const card = generateStrategyCard(totals, targets, 'A');
    expect(card.lipidLine).toBeTruthy();
    expect(card.fatlossLine).toBeTruthy();
    expect(card.muscleLine).toBeTruthy();
  });

  it('includes workout plan name', () => {
    const totals = makeTotals();
    const card = generateStrategyCard(totals, targets, 'A');
    expect(card.muscleLine).toContain('A');
  });

  it('shows completion when targets met', () => {
    const totals = makeTotals({
      fiber: 30,
      satFat: 5,
      calories: targets.calories - 50,
      protein: targets.protein + 10,
    });
    const card = generateStrategyCard(totals, targets);
    expect(card.lipidLine).toContain('✓');
    expect(card.muscleLine).toContain('✓');
  });

  it('has reasons for each line', () => {
    const totals = makeTotals();
    const card = generateStrategyCard(totals, targets);
    expect(card.reasons.lipid).toBeTruthy();
    expect(card.reasons.fatloss).toBeTruthy();
    expect(card.reasons.muscle).toBeTruthy();
  });
});

// ===== getTodayWorkoutPlan =====

describe('getTodayWorkoutPlan', () => {
  it('Monday is plan A', () => {
    expect(getTodayWorkoutPlan(1).planName).toBe('A');
  });

  it('Tuesday is plan B', () => {
    expect(getTodayWorkoutPlan(2).planName).toBe('B');
  });

  it('Wednesday is rest', () => {
    expect(getTodayWorkoutPlan(3).isRestDay).toBe(true);
  });

  it('Sunday is rest', () => {
    expect(getTodayWorkoutPlan(0).isRestDay).toBe(true);
  });
});

// ===== generateWeeklyHighlight =====

describe('generateWeeklyHighlight', () => {
  it('handles empty data', () => {
    const result = generateWeeklyHighlight([]);
    expect(result.highlight).toContain('データが不足');
  });

  it('generates highlight and improvement', () => {
    const summaries: DailySummary[] = [
      {
        date: '2024-01-01',
        totals: { calories: 2000, protein: 120, fiber: 20, satFat: 10, steps: 8000 },
        scores: { lipid: 80, fatloss: 60, muscle: 70 },
        workoutCompleted: true,
      },
      {
        date: '2024-01-02',
        totals: { calories: 1900, protein: 100, fiber: 22, satFat: 12, steps: 9000 },
        scores: { lipid: 85, fatloss: 55, muscle: 65 },
        workoutCompleted: false,
      },
    ];
    const result = generateWeeklyHighlight(summaries);
    expect(result.highlight).toContain('脂質ケア'); // lipid is highest
    expect(result.improvement).toBeTruthy();
  });
});
