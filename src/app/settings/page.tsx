'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/lib/hooks';
import { saveProfile } from '@/lib/actions';

export default function SettingsPage() {
  const router = useRouter();
  const profile = useProfile();

  const [heightCm, setHeightCm] = useState('170');
  const [weightKg, setWeightKg] = useState('70');
  const [goal, setGoal] = useState<'cut' | 'recomp' | 'bulk'>('cut');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active'>('moderate');
  const [triglycerides, setTriglycerides] = useState('');
  const [ldl, setLdl] = useState('');
  const [hdl, setHdl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setHeightCm(String(profile.heightCm));
      setWeightKg(String(profile.weightKg));
      setGoal(profile.goal);
      setActivityLevel(profile.activityLevel);
      if (profile.triglycerides) setTriglycerides(String(profile.triglycerides));
      if (profile.ldl) setLdl(String(profile.ldl));
      if (profile.hdl) setHdl(String(profile.hdl));
    }
  }, [profile]);

  const handleSave = async () => {
    await saveProfile({
      heightCm: parseFloat(heightCm),
      weightKg: parseFloat(weightKg),
      goal,
      activityLevel,
      triglycerides: triglycerides ? parseFloat(triglycerides) : undefined,
      ldl: ldl ? parseFloat(ldl) : undefined,
      hdl: hdl ? parseFloat(hdl) : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (!profile) {
      router.push('/today');
    }
  };

  const goalOptions = [
    { value: 'cut', label: '減量', desc: '体脂肪を落とす' },
    { value: 'recomp', label: '体組成改善', desc: '脂肪↓筋肉↑' },
    { value: 'bulk', label: '増量', desc: '筋肉を増やす' },
  ] as const;

  const activityOptions = [
    { value: 'sedentary', label: 'デスクワーク', desc: 'ほぼ座り' },
    { value: 'light', label: '軽い活動', desc: '通勤+軽い家事' },
    { value: 'moderate', label: '中程度', desc: '定期的に運動' },
    { value: 'active', label: '活発', desc: '毎日運動/体を動かす仕事' },
  ] as const;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-lg font-bold text-gray-900">設定</h1>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        <h2 className="text-sm font-bold text-gray-700">基本情報</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">身長 (cm)</label>
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">体重 (kg)</label>
            <input
              type="number"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Goal */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-700">目標</h2>
        <div className="grid grid-cols-3 gap-2">
          {goalOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGoal(opt.value)}
              className={`p-3 rounded-xl text-center transition-colors border ${
                goal === opt.value
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="text-sm font-medium">{opt.label}</div>
              <div className="text-xs mt-0.5 opacity-70">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Activity Level */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-700">活動量</h2>
        <div className="grid grid-cols-2 gap-2">
          {activityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActivityLevel(opt.value)}
              className={`p-3 rounded-xl text-center transition-colors border ${
                activityLevel === opt.value
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="text-sm font-medium">{opt.label}</div>
              <div className="text-xs mt-0.5 opacity-70">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Lab Values (Optional) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        <h2 className="text-sm font-bold text-gray-700">採血値（任意）</h2>
        <p className="text-xs text-gray-500">最新の健康診断結果があれば入力してください</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">中性脂肪</label>
            <input
              type="number"
              value={triglycerides}
              onChange={(e) => setTriglycerides(e.target.value)}
              placeholder="150"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">LDL</label>
            <input
              type="number"
              value={ldl}
              onChange={(e) => setLdl(e.target.value)}
              placeholder="120"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">HDL</label>
            <input
              type="number"
              value={hdl}
              onChange={(e) => setHdl(e.target.value)}
              placeholder="55"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`w-full py-3 rounded-xl font-medium text-sm transition-colors ${
          saved
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {saved ? '保存しました ✓' : profile ? '更新する' : 'はじめる'}
      </button>
    </div>
  );
}
