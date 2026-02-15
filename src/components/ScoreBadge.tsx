'use client';

interface ScoreBadgeProps {
  label: string;
  score: number;
  color: 'blue' | 'green' | 'orange';
}

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', bar: 'bg-blue-500' },
  green: { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-200', bar: 'bg-green-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', bar: 'bg-orange-500' },
};

export default function ScoreBadge({ label, score, color }: ScoreBadgeProps) {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} rounded-xl p-3 ring-1 ${c.ring} flex-1 min-w-0`}>
      <div className={`text-xs ${c.text} font-medium mb-1`}>{label}</div>
      <div className={`text-2xl font-bold ${c.text}`}>{score}</div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
        <div
          className={`${c.bar} h-1.5 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}
