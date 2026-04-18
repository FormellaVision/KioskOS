'use client';

import { useState } from 'react';
import { NavPage } from '@/lib/kiosk-types';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Products from './Products';
import Orders from './Orders';
import Customers from './Customers';
import Suppliers from './Suppliers';
import ShopSettings from './ShopSettings';
import Inventory from './Inventory';
import { useProducts } from '@/hooks/use-products';

export type ProductViewMode = 'table' | 'grid';

export default function KioskApp() {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [viewMode, setViewMode] = useState<ProductViewMode>('table');
  const { categories, addCategory, deleteCategory } = useProducts();

  const handleNavigate = (page: NavPage) => setActivePage(page);

  return (
    <div className="min-h-screen bg-[#DEDEDE] text-black">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      <main className="md:pl-64 min-h-screen">
        <div className="w-full px-4 pt-6 pb-20 md:pb-8 md:px-6 max-w-7xl mx-auto">
          <div className={`${activePage === 'dashboard' ? 'block' : 'hidden'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <Dashboard onNavigate={(page) => handleNavigate(page as NavPage)} />
          </div>
          <div className={`${activePage === 'products' ? 'block' : 'hidden'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <Products
              categories={categories}
              viewMode={viewMode}
            />
          </div>
          <div className={`${activePage === 'orders' ? 'block' : 'hidden'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <Orders />
          </div>
          <div className={`${activePage === 'customers' ? 'block' : 'hidden'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <Customers />
          </div>
          <div className={`${activePage === 'suppliers' ? 'block' : 'hidden'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <Suppliers />
          </div>
          <div className={`${activePage === 'settings' ? 'block' : 'hidden'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <ShopSettings
              categories={categories}
              onAddCategory={addCategory}
              onDeleteCategory={deleteCategory}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
          <div className={`${activePage === 'inventory' ? 'block' : 'hidden'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <Inventory />
          </div>
        </div>
      </main>

      <BottomNav activePage={activePage} onNavigate={handleNavigate} />
    </div>
  );
}
