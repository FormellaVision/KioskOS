'use client';

import { useState } from 'react';
import { Check, Clock, Truck, ShoppingBag } from 'lucide-react';
import { Order, OrderStatus } from '@/lib/kiosk-types';
import { ORDERS } from '@/lib/kiosk-data';
import OrderStatusBadge from './OrderStatusBadge';

type FilterTab = 'all' | 'new' | 'confirmed' | 'ready' | 'picked_up';

const FILTER_TABS: { key: FilterTab; label: string; count?: (orders: Order[]) => number }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'new', label: 'Neu', count: (orders) => orders.filter((o) => o.status === 'new').length },
  { key: 'confirmed', label: 'Bestätigt' },
  { key: 'ready', label: 'Bereit' },
  { key: 'picked_up', label: 'Abgeholt' },
];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const advanceStatus = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next: Record<OrderStatus, OrderStatus> = {
          new: 'confirmed',
          confirmed: 'ready',
          ready: 'picked_up',
          picked_up: 'picked_up',
          cancelled: 'cancelled',
        };
        return { ...o, status: next[o.status] };
      })
    );
  };

  const filtered = orders.filter((o) => {
    if (activeFilter === 'all') return true;
    return o.status === activeFilter;
  });

  const newCount = orders.filter((o) => o.status === 'new').length;

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h1 className="text-xl font-bold text-black">Bestellungen</h1>
        <p className="text-gray-600 text-sm">{orders.length} Bestellungen heute</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_TABS.map(({ key, label, count }) => {
          const cnt = count ? count(orders) : null;
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[36px] ${
                isActive
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 border border-border hover:text-black'
              }`}
            >
              {label}
              {cnt !== null && cnt > 0 && (
                <span
                  className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isActive ? 'bg-white text-red-500' : 'bg-red-500 text-white'
                  }`}
                >
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Keine Bestellungen in dieser Kategorie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} onAdvance={() => advanceStatus(order.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  onAdvance: () => void;
}

function OrderCard({ order, onAdvance }: OrderCardProps) {
  return (
    <div className={`bg-white rounded-xl border overflow-hidden shadow-sm ${
      order.status === 'new' ? 'border-red-200' : 'border-border'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-black font-bold font-mono">{order.id}</span>
              <span className="flex items-center gap-1 text-gray-600 text-xs">
                <Clock className="w-3 h-3" />
                {order.time}
              </span>
              {order.type === 'delivery' && (
                <span className="flex items-center gap-1 text-gray-600 text-xs">
                  <Truck className="w-3 h-3" />
                  Lieferung
                </span>
              )}
            </div>
            <p className="text-black text-sm font-medium mt-0.5">{order.customer}</p>
          </div>
          <OrderStatusBadge status={order.status} large />
        </div>

        <p className="text-gray-600 text-sm leading-relaxed bg-gray-100 rounded-lg px-3 py-2">
          {order.items}
        </p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-black font-bold text-lg font-mono">€ {order.total.toFixed(2)}</span>
          <ActionButton status={order.status} onAction={onAdvance} />
        </div>
      </div>
    </div>
  );
}

function ActionButton({ status, onAction }: { status: OrderStatus; onAction: () => void }) {
  if (status === 'new') {
    return (
      <button
        onClick={onAction}
        className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg text-sm transition-colors min-h-[44px]"
      >
        <Check className="w-4 h-4" />
        Bestätigen
      </button>
    );
  }
  if (status === 'confirmed') {
    return (
      <button
        onClick={onAction}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-lg text-sm transition-colors min-h-[44px]"
      >
        <Check className="w-4 h-4" />
        Bereit melden
      </button>
    );
  }
  if (status === 'ready') {
    return (
      <button
        onClick={onAction}
        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-100 text-black font-bold rounded-lg text-sm transition-colors min-h-[44px]"
      >
        <Check className="w-4 h-4" />
        Abgeholt
      </button>
    );
  }
  return null;
}
