'use client';

import { useState } from 'react';
import { NavPage } from '@/lib/kiosk-types';
import { CATEGORIES } from '@/lib/kiosk-data';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Products from './Products';
import Orders from './Orders';
import Customers from './Customers';
import ShopSettings from './ShopSettings';

export type ProductViewMode = 'table' | 'grid';

export default function KioskApp() {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  const [viewMode, setViewMode] = useState<ProductViewMode>('table');

  const handleNavigate = (page: NavPage) => setActivePage(page);

  return (
    <div className="min-h-screen bg-[#DEDEDE] text-black">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      <main className="md:pl-64 min-h-screen">
        <div className="w-full px-4 pt-6 pb-20 md:pb-8 md:px-6">
          {activePage === 'dashboard' && (
            <Dashboard onNavigate={(page) => handleNavigate(page as NavPage)} />
          )}
          {activePage === 'products' && (
            <Products
              categories={categories}
              onCategoriesChange={setCategories}
              viewMode={viewMode}
            />
          )}
          {activePage === 'orders' && <Orders />}
          {activePage === 'customers' && <Customers />}
          {activePage === 'settings' && (
            <ShopSettings
              categories={categories}
              onCategoriesChange={setCategories}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          )}
        </div>
      </main>

      <BottomNav activePage={activePage} onNavigate={handleNavigate} />
    </div>
  );
}
