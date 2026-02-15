'use client';

import { useState } from 'react';
import { useAllFoods, useTodayMeals, useProfile, useDailyTargets, useTodayTotals, useDailySummary, useTodayWorkout } from '@/lib/hooks';
import { addMealLog, deleteMealLog } from '@/lib/actions';
import type { FoodItem, MealLog, MealLogItem } from '@/lib/db';

export default function MealLogPage() {
  const allFoods = useAllFoods();
  const todayMeals = useTodayMeals();
  const profile = useProfile();
  const targets = useDailyTargets(profile);
  const workout = useTodayWorkout();
  const summary = useDailySummary();
  const totals = useTodayTotals(todayMeals, workout, summary);

  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [mealType, setMealType] = useState<MealLog['mealType']>('lunch');
  const [cart, setCart] = useState<MealLogItem[]>([]);

  const filteredFoods = search
    ? allFoods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : allFoods.filter(f => f.isFavorite);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantity('100');
  };

  const handleAddToCart = () => {
    if (!selectedFood) return;
    const q = parseFloat(quantity);
    if (isNaN(q) || q <= 0) return;

    const ratio = q / 100;
    const item: MealLogItem = {
      foodId: selectedFood.id!,
      foodName: selectedFood.name,
      quantityG: q,
      calories: Math.round(selectedFood.calories * ratio),
      protein: Math.round(selectedFood.protein * ratio * 10) / 10,
      fiber: Math.round(selectedFood.fiber * ratio * 10) / 10,
      satFat: Math.round(selectedFood.satFat * ratio * 10) / 10,
    };
    setCart([...cart, item]);
    setSelectedFood(null);
    setSearch('');
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSaveMeal = async () => {
    if (cart.length === 0) return;
    await addMealLog(mealType, cart);
    setCart([]);
  };

  const handleDeleteMeal = async (id: number) => {
    await deleteMealLog(id);
  };

  const cartTotals = cart.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      fiber: acc.fiber + item.fiber,
      satFat: acc.satFat + item.satFat,
    }),
    { calories: 0, protein: 0, fiber: 0, satFat: 0 }
  );

  const mealTypeLabels: Record<string, string> = {
    breakfast: '朝食',
    lunch: '昼食',
    dinner: '夕食',
    snack: '間食',
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold text-gray-900">食事を記録</h1>

      {/* Today's progress bar */}
      {targets && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{Math.round(totals.calories)} / {targets.calories} kcal</span>
            <span>P: {Math.round(totals.protein)}g / F: {Math.round(totals.fiber)}g</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                totals.calories > targets.calories ? 'bg-red-400' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min((totals.calories / targets.calories) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Meal Type Selector */}
      <div className="flex gap-2">
        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setMealType(type)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mealType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {mealTypeLabels[type]}
          </button>
        ))}
      </div>

      {/* Food Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="食品を検索..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Food List */}
        <div className="max-h-48 overflow-y-auto space-y-1">
          {filteredFoods.map((food) => (
            <button
              key={food.id}
              onClick={() => handleSelectFood(food)}
              className={`w-full text-left p-2 rounded-xl text-sm transition-colors flex justify-between items-center ${
                selectedFood?.id === food.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className="font-medium text-gray-800">
                {food.isFavorite && <span className="text-yellow-500 mr-1">★</span>}
                {food.name}
              </span>
              <span className="text-xs text-gray-500">{food.calories}kcal/100g</span>
            </button>
          ))}
          {filteredFoods.length === 0 && (
            <div className="text-center py-4 text-xs text-gray-400">
              {search ? '見つかりません' : '定番がありません'}
            </div>
          )}
        </div>

        {/* Quantity Input & Add */}
        {selectedFood && (
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">{selectedFood.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500">g</span>
              <div className="flex gap-1">
                {[50, 100, 150, 200].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuantity(String(q))}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                      quantity === String(q)
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {q}g
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddToCart}
                className="ml-auto bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                追加
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {Math.round(selectedFood.calories * parseFloat(quantity || '0') / 100)}kcal /{' '}
              P {Math.round(selectedFood.protein * parseFloat(quantity || '0') / 100 * 10) / 10}g /{' '}
              繊維 {Math.round(selectedFood.fiber * parseFloat(quantity || '0') / 100 * 10) / 10}g
            </div>
          </div>
        )}
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-700">追加する食品</h2>
          {cart.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-800">{item.foodName}</span>
                <span className="text-xs text-gray-500 ml-1">{item.quantityG}g</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{item.calories}kcal</span>
                <button
                  onClick={() => handleRemoveFromCart(i)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-2 flex justify-between text-xs text-gray-600">
            <span>合計: {Math.round(cartTotals.calories)}kcal</span>
            <span>P: {Math.round(cartTotals.protein)}g / 繊維: {Math.round(cartTotals.fiber)}g</span>
          </div>
          <button
            onClick={handleSaveMeal}
            className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {mealTypeLabels[mealType]}として記録
          </button>
        </div>
      )}

      {/* Today's Meals */}
      {todayMeals.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-700">今日の記録</h2>
          {todayMeals.map((meal) => (
            <div key={meal.id} className="border-b border-gray-50 pb-2 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 font-medium">{mealTypeLabels[meal.mealType]}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{meal.totals.calories}kcal</span>
                  <button
                    onClick={() => handleDeleteMeal(meal.id!)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    削除
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                {meal.items.map(item => `${item.foodName} ${item.quantityG}g`).join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
