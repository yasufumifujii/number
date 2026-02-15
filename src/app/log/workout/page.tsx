'use client';

import { useState } from 'react';
import { useWorkoutPlans, useTodayWorkout } from '@/lib/hooks';
import { logWorkout, updateSteps } from '@/lib/actions';
import { getTodayWorkoutPlan } from '@/lib/engine';

export default function WorkoutLogPage() {
  const plans = useWorkoutPlans();
  const todayWorkout = useTodayWorkout();

  const [rpe, setRpe] = useState(7);
  const [stepsInput, setStepsInput] = useState('');
  const [saved, setSaved] = useState(false);

  const dayOfWeek = new Date().getDay();
  const todayPlan = getTodayWorkoutPlan(dayOfWeek);
  const scheduledPlan = plans.find(p => p.name === todayPlan.planName);

  const handleLogWorkout = async (plan: typeof plans[0], completed: boolean) => {
    await logWorkout(plan.id!, plan.name, completed, completed ? rpe : undefined);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSteps = async () => {
    const steps = parseInt(stepsInput);
    if (steps > 0) {
      await updateSteps(steps);
      setStepsInput('');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold text-gray-900">運動を記録</h1>

      {/* Today's scheduled workout */}
      {todayPlan.isRestDay ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-2xl mb-2">😌</div>
          <h2 className="text-sm font-bold text-gray-700">今日は休息日</h2>
          <p className="text-xs text-gray-500 mt-1">回復も筋肥大の重要なプロセスです</p>
        </div>
      ) : (
        scheduledPlan && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-700">
                  今日のメニュー: {scheduledPlan.name}
                </h2>
                <p className="text-xs text-gray-500">{scheduledPlan.label}</p>
              </div>
              {todayWorkout?.completed && (
                <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-medium">
                  完了
                </span>
              )}
            </div>

            <div className="space-y-2">
              {scheduledPlan.exercises.map((ex, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs">
                    {i + 1}
                  </span>
                  {ex}
                </div>
              ))}
            </div>

            {/* RPE Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-500">きつさ (RPE)</label>
                <span className="text-sm font-bold text-gray-700">{rpe}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>楽</span>
                <span>限界</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleLogWorkout(scheduledPlan, true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  todayWorkout?.completed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {todayWorkout?.completed ? '完了済み ✓' : '完了として記録'}
              </button>
              {todayWorkout?.completed && (
                <button
                  onClick={() => handleLogWorkout(scheduledPlan, false)}
                  className="px-4 py-2.5 rounded-xl text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              )}
            </div>
          </div>
        )
      )}

      {/* All Plans */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-700">メニュー一覧</h2>
        {plans.map((plan) => (
          <div key={plan.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-medium text-gray-800">メニュー {plan.name}</span>
                <span className="text-xs text-gray-500 ml-2">{plan.label}</span>
              </div>
              {!todayPlan.isRestDay || true ? (
                <button
                  onClick={() => handleLogWorkout(plan, true)}
                  className="text-xs bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 px-3 py-1 rounded-lg transition-colors"
                >
                  記録
                </button>
              ) : null}
            </div>
            <div className="text-xs text-gray-500 space-y-0.5 ml-2">
              {plan.exercises.map((ex, i) => (
                <div key={i}>• {ex}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-700">歩数</h2>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={stepsInput}
            onChange={(e) => setStepsInput(e.target.value)}
            placeholder="例: 8000"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSteps}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            記録
          </button>
        </div>
      </div>

      {saved && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-sm px-4 py-2 rounded-xl shadow-lg z-50">
          記録しました ✓
        </div>
      )}
    </div>
  );
}
