'use client';

import { LayoutDashboard, Package, ShoppingBag, Users, Settings } from 'lucide-react';
import { NavPage } from '@/lib/kiosk-types';

interface BottomNavProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
}

const navItems: { page: NavPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { page: 'dashboard', label: 'Übersicht', icon: LayoutDashboard },
  { page: 'products', label: 'Produkte', icon: Package },
  { page: 'orders', label: 'Bestellungen', icon: ShoppingBag },
  { page: 'customers', label: 'Kunden', icon: Users },
  { page: 'settings', label: 'Optionen', icon: Settings },
];

export default function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border md:hidden">
      <div className="flex items-stretch h-16">
        {navItems.map(({ page, label, icon: Icon }) => {
          const isActive = activePage === page;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[48px] transition-colors ${
                isActive ? 'text-red-500' : 'text-gray-600 hover:text-black'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-red-500' : ''}`} />
              <span className="text-[9px] font-medium leading-tight">{label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-red-500 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
