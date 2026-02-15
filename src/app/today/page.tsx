'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProfile, useTodayMeals, useTodayWorkout, useDailySummary, useFavorites, useDailyTargets, useTodayTotals, useWorkoutPlans } from '@/lib/hooks';
import { computeScores, generateStrategyCard, suggestNextActions, getTodayWorkoutPlan } from '@/lib/engine';
import { addMealLog, logWorkout, updateSteps } from '@/lib/actions';
import ScoreBadge from '@/components/ScoreBadge';
import type { FoodItem, MealLogItem } from '@/lib/db';

export default function TodayPage() {
  const profile = useProfile();
  const meals = useTodayMeals();
  const workout = useTodayWorkout();
  const summary = useDailySummary();
  const favorites = useFavorites();
  const plans = useWorkoutPlans();
  const targets = useDailyTargets(profile);
  const totals = useTodayTotals(meals, workout, summary);

  const [expandedReason, setExpandedReason] = useState<string | null>(null);
  const [stepsInput, setStepsInput] = useState('');

  if (!profile) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-xl font-bold text-gray-800">ヘルスナビへようこそ</h1>
        <p className="text-gray-600 text-center text-sm">まず基本情報を設定しましょう</p>
        <Link
          href="/settings"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          プロフィールを設定する
        </Link>
      </div>
    );
  }

  if (!targets) return null;

  const scores = computeScores(totals, targets);
  const dayOfWeek = new Date().getDay();
  const todayPlan = getTodayWorkoutPlan(dayOfWeek);
  const matchingPlan = plans.find(p => p.name === todayPlan.planName);
  const card = generateStrategyCard(totals, targets, todayPlan.isRestDay ? undefined : todayPlan.planName);
  const suggestions = suggestNextActions(totals, targets, favorites);

  const handleQuickAdd = async (food: FoodItem, quantityG: number) => {
    const ratio = quantityG / 100;
    const item: MealLogItem = {
      foodId: food.id!,
      foodName: food.name,
      quantityG,
      calories: Math.round(food.calories * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      fiber: Math.round(food.fiber * ratio * 10) / 10,
      satFat: Math.round(food.satFat * ratio * 10) / 10,
    };
    await addMealLog('snack', [item]);
  };

  const handleWorkoutToggle = async () => {
    if (!matchingPlan) return;
    await logWorkout(matchingPlan.id!, matchingPlan.name, !workout?.completed);
  };

  const handleStepsSubmit = async () => {
    const steps = parseInt(stepsInput);
    if (steps > 0) {
      await updateSteps(steps);
      setStepsInput('');
    }
  };

  const toggleReason = (key: string) => {
    setExpandedReason(expandedReason === key ? null : key);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-bold text-gray-900">
          今日の作戦
        </h1>
        <span className="text-xs text-gray-500">
          {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
        </span>
      </div>

      {/* Strategy Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 space-y-3">
          {/* Lipid */}
          <button
            onClick={() => toggleReason('lipid')}
            className="w-full text-left"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">脂</span>
              <span className="text-sm text-gray-800 font-medium">{card.lipidLine}</span>
            </div>
            {expandedReason === 'lipid' && (
              <p className="mt-1 ml-8 text-xs text-gray-500">{card.reasons.lipid}</p>
            )}
          </button>

          <div className="border-t border-gray-50" />

          {/* Fatloss */}
          <button
            onClick={() => toggleReason('fatloss')}
            className="w-full text-left"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">減</span>
              <span className="text-sm text-gray-800 font-medium">{card.fatlossLine}</span>
            </div>
            {expandedReason === 'fatloss' && (
              <p className="mt-1 ml-8 text-xs text-gray-500">{card.reasons.fatloss}</p>
            )}
          </button>

          <div className="border-t border-gray-50" />

          {/* Muscle */}
          <button
            onClick={() => toggleReason('muscle')}
            className="w-full text-left"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">筋</span>
              <span className="text-sm text-gray-800 font-medium">{card.muscleLine}</span>
            </div>
            {expandedReason === 'muscle' && (
              <p className="mt-1 ml-8 text-xs text-gray-500">{card.reasons.muscle}</p>
            )}
          </button>
        </div>
        <div className="px-4 py-2 bg-gray-50 text-center">
          <span className="text-xs text-gray-400">タップで理由を表示</span>
        </div>
      </div>

      {/* Next Action Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-700">次に何を食べる？</h2>
          {suggestions.map((sugg, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  sugg.type === 'add' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {sugg.type === 'add' ? '+ 足す' : '↔ 置換'}
                </span>
                <span className="text-sm font-medium text-gray-800">{sugg.message}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{sugg.reason}</p>
              <div className="flex gap-2">
                {sugg.foodCandidates.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => handleQuickAdd(food, 100)}
                    className="flex-1 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-2 transition-colors text-center"
                  >
                    <div className="text-sm font-medium text-gray-800">{food.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      100g / {food.calories}kcal
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && meals.length > 0 && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 text-center">
          <span className="text-sm text-emerald-700 font-medium">今日のバランスは良好です</span>
        </div>
      )}

      {/* Quick meal log link */}
      <Link
        href="/log/meal"
        className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-blue-600">食事を記録する →</span>
      </Link>

      {/* Today's Workout */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-sm font-bold text-gray-700 mb-3">今日の運動</h2>
        {todayPlan.isRestDay ? (
          <div className="text-center py-2">
            <span className="text-sm text-gray-500">休息日 — 回復も大事です</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-800">
                  筋トレ {matchingPlan?.name}: {matchingPlan?.label}
                </span>
              </div>
              <button
                onClick={handleWorkoutToggle}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  workout?.completed
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {workout?.completed ? '完了 ✓' : '開始'}
              </button>
            </div>
            {matchingPlan && (
              <div className="text-xs text-gray-500 space-y-0.5">
                {matchingPlan.exercises.map((ex, i) => (
                  <div key={i}>• {ex}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Steps */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">歩数:</span>
            {summary?.totals.steps ? (
              <span className="text-sm font-medium text-gray-700">{summary.totals.steps.toLocaleString()} 歩</span>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={stepsInput}
                  onChange={(e) => setStepsInput(e.target.value)}
                  placeholder="8000"
                  className="w-20 text-sm border border-gray-200 rounded-lg px-2 py-1"
                />
                <button
                  onClick={handleStepsSubmit}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors"
                >
                  記録
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="flex gap-3">
        <ScoreBadge label="脂質" score={scores.lipid} color="blue" />
        <ScoreBadge label="減量" score={scores.fatloss} color="green" />
        <ScoreBadge label="筋肉" score={scores.muscle} color="orange" />
      </div>

      {/* Today's intake summary */}
      {meals.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-2">今日の摂取</h2>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-gray-800">{Math.round(totals.calories)}</div>
              <div className="text-xs text-gray-500">kcal</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">{Math.round(totals.protein)}g</div>
              <div className="text-xs text-gray-500">たんぱく質</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{Math.round(totals.fiber)}g</div>
              <div className="text-xs text-gray-500">食物繊維</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-500">{Math.round(totals.satFat * 10) / 10}g</div>
              <div className="text-xs text-gray-500">飽和脂肪</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
