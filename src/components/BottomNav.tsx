'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/today', label: '今日', icon: '◉' },
  { href: '/log/meal', label: '食事', icon: '🍽' },
  { href: '/log/workout', label: '運動', icon: '💪' },
  { href: '/weekly', label: '週次', icon: '📊' },
  { href: '/settings', label: '設定', icon: '⚙' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto flex justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-lg mb-0.5">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
