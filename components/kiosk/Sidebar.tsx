'use client';

import { LayoutDashboard, Package, ShoppingBag, Users, Store, Settings } from 'lucide-react';
import { NavPage } from '@/lib/kiosk-types';

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
}

const navItems: { page: NavPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { page: 'dashboard', label: 'Übersicht', icon: LayoutDashboard },
  { page: 'products', label: 'Produkte', icon: Package },
  { page: 'orders', label: 'Bestellungen', icon: ShoppingBag },
  { page: 'customers', label: 'Kunden', icon: Users },
  { page: 'settings', label: 'Shop Optionen', icon: Settings },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border min-h-screen fixed left-0 top-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-9 h-9 bg-red-500 rounded-lg flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-black font-bold text-sm leading-none">KioskOS</p>
          <p className="text-gray-600 text-xs mt-0.5">Ali&apos;s Kiosk</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ page, label, icon: Icon }) => {
          const isActive = activePage === page;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all min-h-[48px] ${
                isActive
                  ? 'bg-red-50 text-red-500 border border-red-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-black'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500" />}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-black text-xs font-bold">
            M
          </div>
          <div>
            <p className="text-black text-sm font-medium">Ali</p>
            <p className="text-gray-600 text-xs">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
