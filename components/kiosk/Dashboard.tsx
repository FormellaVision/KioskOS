'use client';

import { Plus, PackageCheck, TrendingUp, Clock, CircleAlert as AlertCircle } from 'lucide-react';
import { ORDERS } from '@/lib/kiosk-data';
import { Order } from '@/lib/kiosk-types';
import OrderStatusBadge from './OrderStatusBadge';

interface DashboardProps {
  onNavigate: (page: 'products' | 'orders') => void;
}

const recentOrders = ORDERS.slice(0, 3);

export default function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-black">Guten Morgen, Ali 👋</h1>
        <p className="text-gray-600 text-sm mt-1">Mittwoch, 16. April 2026</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-red-500" />
          <span className="text-gray-600 text-sm font-medium">Heutiger Umsatz</span>
        </div>
        <p className="text-4xl font-bold text-black tracking-tight font-mono">€ 847,50</p>
        <p className="text-gray-600 text-xs mt-2 flex items-center gap-1">
          <span className="text-green-600 font-medium">+12%</span> gegenüber gestern
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-border flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-2xl font-bold text-black font-mono">12</p>
          <p className="text-gray-600 text-xs mt-1 leading-tight">Bestellungen</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200 flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-2xl font-bold text-red-500 font-mono">3</p>
          <p className="text-gray-600 text-xs mt-1 leading-tight">Neu</p>
          <span className="mt-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </div>
        <div className="bg-white rounded-xl p-4 border border-border flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-xl font-bold text-black font-mono leading-tight">€ 124</p>
          <p className="text-gray-600 text-xs mt-1 leading-tight">Offen</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest">Schnellzugriff</p>
        <button
          onClick={() => onNavigate('products')}
          className="w-full flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl text-sm transition-colors min-h-[56px] shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Produkt hinzufügen
        </button>
        <button
          onClick={() => onNavigate('orders')}
          className="w-full flex items-center justify-center gap-3 bg-gray-100 hover:bg-gray-200 text-black font-bold py-4 rounded-xl text-sm border border-border transition-colors min-h-[56px] shadow-sm"
        >
          <PackageCheck className="w-5 h-5" />
          Bestellung bestätigen
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest">Letzte Bestellungen</p>
        <div className="space-y-2">
          {recentOrders.map((order) => (
            <RecentOrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentOrderCard({ order }: { order: Order }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-border flex items-center justify-between gap-3 shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-black font-bold text-sm font-mono">{order.id}</span>
          <span className="text-gray-600 text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {order.time}
          </span>
        </div>
        <p className="text-gray-600 text-xs truncate">{order.customer} · {order.items}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-black font-bold text-sm font-mono">€ {order.total.toFixed(2)}</span>
        <OrderStatusBadge status={order.status} />
      </div>
    </div>
  );
}
