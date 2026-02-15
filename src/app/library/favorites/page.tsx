'use client';

import { useState } from 'react';
import { useAllFoods } from '@/lib/hooks';
import { addFoodItem, toggleFavorite, deleteFoodItem } from '@/lib/actions';
import type { FoodItem } from '@/lib/db';

export default function FavoritesPage() {
  const allFoods = useAllFoods();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  // Add form state
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fiber, setFiber] = useState('');
  const [satFat, setSatFat] = useState('');
  const [category, setCategory] = useState('other');

  const filteredFoods = search
    ? allFoods.filter(f => f.name.includes(search))
    : allFoods;

  const favorites = filteredFoods.filter(f => f.isFavorite);
  const others = filteredFoods.filter(f => !f.isFavorite);

  const handleAdd = async () => {
    if (!name || !calories) return;
    await addFoodItem({
      name,
      calories: parseFloat(calories),
      protein: parseFloat(protein) || 0,
      fiber: parseFloat(fiber) || 0,
      satFat: parseFloat(satFat) || 0,
      isFavorite: true,
      category,
    });
    setName('');
    setCalories('');
    setProtein('');
    setFiber('');
    setSatFat('');
    setShowAdd(false);
  };

  const categoryLabels: Record<string, string> = {
    protein: 'たんぱく源',
    grain: '穀物',
    vegetable: '野菜・海藻',
    dairy: '乳製品',
    fat: '油脂',
    other: 'その他',
  };

  const renderFoodItem = (food: FoodItem) => (
    <div key={food.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleFavorite(food.id!)}
            className={`text-sm ${food.isFavorite ? 'text-yellow-500' : 'text-gray-300'}`}
          >
            ★
          </button>
          <span className="text-sm font-medium text-gray-800 truncate">{food.name}</span>
          {food.category && (
            <span className="text-xs text-gray-400 ml-1">
              {categoryLabels[food.category] || food.category}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 ml-5">
          {food.calories}kcal / P{food.protein}g / 繊維{food.fiber}g / 飽和脂肪{food.satFat}g (per 100g)
        </div>
      </div>
      <button
        onClick={() => deleteFoodItem(food.id!)}
        className="text-xs text-red-400 hover:text-red-600 ml-2 shrink-0"
      >
        削除
      </button>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">食品ライブラリ</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          {showAdd ? '閉じる' : '+ 追加'}
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="食品を検索..."
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-700">新しい食品を追加</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="食品名"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">カロリー (per 100g)</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="kcal"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">たんぱく質 (g)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="g"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">食物繊維 (g)</label>
              <input
                type="number"
                value={fiber}
                onChange={(e) => setFiber(e.target.value)}
                placeholder="g"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">飽和脂肪 (g)</label>
              <input
                type="number"
                value={satFat}
                onChange={(e) => setSatFat(e.target.value)}
                placeholder="g"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">カテゴリ</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAdd}
            className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            追加する
          </button>
        </div>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-2">
            ★ 定番 ({favorites.length})
          </h2>
          {favorites.map(renderFoodItem)}
        </div>
      )}

      {/* Others */}
      {others.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-2">
            その他 ({others.length})
          </h2>
          {others.map(renderFoodItem)}
        </div>
      )}
    </div>
  );
}
