'use client';

import { useMemo } from 'react';
import { useRecentSummaries, useProfile } from '@/lib/hooks';
import { generateWeeklyHighlight } from '@/lib/engine';
import ScoreBadge from '@/components/ScoreBadge';

export default function WeeklyPage() {
  const summaries = useRecentSummaries(7);
  const profile = useProfile();

  const { highlight, improvement } = useMemo(
    () => generateWeeklyHighlight(summaries),
    [summaries]
  );

  const avgScores = useMemo(() => {
    if (summaries.length === 0) return { lipid: 0, fatloss: 0, muscle: 0 };
    return {
      lipid: Math.round(summaries.reduce((s, d) => s + d.scores.lipid, 0) / summaries.length),
      fatloss: Math.round(summaries.reduce((s, d) => s + d.scores.fatloss, 0) / summaries.length),
      muscle: Math.round(summaries.reduce((s, d) => s + d.scores.muscle, 0) / summaries.length),
    };
  }, [summaries]);

  const avgTotals = useMemo(() => {
    if (summaries.length === 0) return { calories: 0, protein: 0, fiber: 0, satFat: 0 };
    const len = summaries.length;
    return {
      calories: Math.round(summaries.reduce((s, d) => s + d.totals.calories, 0) / len),
      protein: Math.round(summaries.reduce((s, d) => s + d.totals.protein, 0) / len),
      fiber: Math.round(summaries.reduce((s, d) => s + d.totals.fiber, 0) / len),
      satFat: Math.round(summaries.reduce((s, d) => s + d.totals.satFat, 0) / len * 10) / 10,
    };
  }, [summaries]);

  const workoutDays = summaries.filter(s => s.workoutCompleted).length;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold text-gray-900">週次レビュー</h1>
      <p className="text-xs text-gray-500">過去7日間のまとめ（{summaries.length}日分のデータ）</p>

      {summaries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-2xl mb-2">📝</div>
          <p className="text-sm text-gray-600">まだデータがありません</p>
          <p className="text-xs text-gray-400 mt-1">食事や運動を記録すると、ここに週次レビューが表示されます</p>
        </div>
      ) : (
        <>
          {/* Average Scores */}
          <div className="flex gap-3">
            <ScoreBadge label="脂質" score={avgScores.lipid} color="blue" />
            <ScoreBadge label="減量" score={avgScores.fatloss} color="green" />
            <ScoreBadge label="筋肉" score={avgScores.muscle} color="orange" />
          </div>

          {/* Highlight & Improvement */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">◎</span>
                <span className="text-sm font-bold text-gray-700">良かった点</span>
              </div>
              <p className="text-sm text-gray-600 ml-7">{highlight}</p>
            </div>
            <div className="border-t border-gray-100" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">△</span>
                <span className="text-sm font-bold text-gray-700">改善ポイント</span>
              </div>
              <p className="text-sm text-gray-600 ml-7">{improvement}</p>
            </div>
          </div>

          {/* Score Chart (simple bar representation) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-bold text-gray-700 mb-3">日別スコア推移</h2>
            <div className="space-y-2">
              {summaries.sort((a, b) => a.date.localeCompare(b.date)).map((s) => {
                const dateLabel = new Date(s.date + 'T00:00:00').toLocaleDateString('ja-JP', {
                  month: 'short',
                  day: 'numeric',
                  weekday: 'short',
                });
                const avgScore = Math.round((s.scores.lipid + s.scores.fatloss + s.scores.muscle) / 3);
                return (
                  <div key={s.date} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20 shrink-0">{dateLabel}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-200 rounded-full"
                        style={{ width: `${s.scores.lipid}%` }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 bg-green-300 rounded-full opacity-60"
                        style={{ width: `${s.scores.fatloss}%` }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 bg-orange-300 rounded-full opacity-40"
                        style={{ width: `${s.scores.muscle}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-8 text-right">{avgScore}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-300 rounded-full" /> 脂質</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full" /> 減量</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-400 rounded-full" /> 筋肉</span>
            </div>
          </div>

          {/* Average Intake */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-bold text-gray-700 mb-3">平均摂取量</h2>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-gray-800">{avgTotals.calories}</div>
                <div className="text-xs text-gray-500">kcal</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">{avgTotals.protein}g</div>
                <div className="text-xs text-gray-500">たんぱく質</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">{avgTotals.fiber}g</div>
                <div className="text-xs text-gray-500">食物繊維</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-500">{avgTotals.satFat}g</div>
                <div className="text-xs text-gray-500">飽和脂肪</div>
              </div>
            </div>
          </div>

          {/* Workout Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-bold text-gray-700 mb-2">筋トレ実施</h2>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-orange-600">{workoutDays}</span>
              <span className="text-sm text-gray-500">/ 7日中</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div
                  className="bg-orange-400 h-3 rounded-full transition-all"
                  style={{ width: `${(workoutDays / 4) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">目標: 週4回</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
