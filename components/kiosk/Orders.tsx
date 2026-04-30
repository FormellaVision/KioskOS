'use client';

import { useState } from 'react';
import { Check, Clock, Truck, ShoppingBag, XCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { Order } from '@/lib/supabase/types';
import { useOrders, OrderWithItems } from '@/hooks/use-orders';
import OrderStatusBadge from './OrderStatusBadge';
import { toast } from 'sonner';

type FilterTab = 'all' | 'new' | 'confirmed' | 'ready' | 'picked_up';

const FILTER_TABS: { key: FilterTab; label: string; count?: (orders: OrderWithItems[]) => number }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'new', label: 'Neu', count: (orders) => orders.filter((o) => o.status === 'new').length },
  { key: 'confirmed', label: 'Bestätigt' },
  { key: 'ready', label: 'Bereit' },
  { key: 'picked_up', label: 'Abgeholt' },
];

function timeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (diff < 60) return 'Gerade eben'
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min`
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std`
  return `vor ${Math.floor(diff / 86400)} Tagen`
}

export default function Orders() {
  const { orders, loading, error, advanceStatus, revertStatus, cancelOrder } = useOrders();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const handleAdvance = async (orderId: string, currentStatus: Order['status']) => {
    await advanceStatus(orderId, currentStatus)
    const nextLabels: Record<string, string> = {
      new: 'Bestellung bestätigt ✓',
      confirmed: 'Bestellung bereit gemeldet ✓',
      ready: 'Bestellung als abgeholt markiert ✓',
    }
    toast.success(nextLabels[currentStatus] ?? 'Status aktualisiert')
  }

  const handleCancel = async (orderId: string) => {
    if (!window.confirm('Bestellung wirklich stornieren?')) return
    await cancelOrder(orderId)
    toast.success('Bestellung storniert')
  }

  const handleRevert = async (orderId: string, currentStatus: Order['status']) => {
    await revertStatus(orderId, currentStatus)
    toast.success('Status zurückgesetzt')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Bestellungen werden geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500 gap-2">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const filtered = orders.filter((o) => {
    if (activeFilter === 'all') return true;
    return o.status === activeFilter;
  });

  const newCount = orders.filter((o) => o.status === 'new').length;

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h1 className="text-xl font-bold text-black">Bestellungen</h1>
        <p className="text-gray-600 text-sm">{orders.length} Bestellungen</p>
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
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-black font-bold text-lg">Keine Bestellungen</h3>
          <p className="text-gray-500 text-sm max-w-[240px] mt-1">
            {activeFilter === 'all' 
              ? 'Es sind noch keine Bestellungen im System eingegangen.'
              : 'Aktuell gibt es keine Bestellungen in dieser Kategorie.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAdvance={() => handleAdvance(order.id, order.status)}
              onRevert={() => handleRevert(order.id, order.status)}
              onCancel={() => handleCancel(order.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface OrderCardProps {
  order: OrderWithItems;
  onAdvance: () => void;
  onRevert: () => void;
  onCancel: () => void;
}

function OrderCard({ order, onAdvance, onRevert, onCancel }: OrderCardProps) {
  const itemsSummary = order.items.length > 0
    ? order.items.slice(0, 3).map(i => `${i.quantity}x ${i.product_name}`).join(', ')
    : 'Keine Details';

  return (
    <div className={`bg-white rounded-xl border overflow-hidden shadow-sm ${
      order.status === 'new' ? 'border-red-200' : 'border-border'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-black font-bold font-mono">#{order.id.slice(-4).toUpperCase()}</span>
              <span className="flex items-center gap-1 text-gray-600 text-xs">
                <Clock className="w-3 h-3" />
                {timeAgo(order.created_at)}
              </span>
              {order.fulfillment_type === 'delivery' && (
                <span className="flex items-center gap-1 text-gray-600 text-xs">
                  <Truck className="w-3 h-3" />
                  Lieferung
                </span>
              )}
            </div>
            <p className="text-black text-sm font-medium mt-0.5">{order.customer_name ?? 'Unbekannt'}</p>
          </div>
          <OrderStatusBadge status={order.status} large />
        </div>

        <p className="text-gray-600 text-sm leading-relaxed bg-gray-100 rounded-lg px-3 py-2">
          {itemsSummary}
        </p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-black font-bold text-lg font-mono">€ {order.total.toFixed(2)}</span>
          <div className="flex items-center gap-2">
            {order.status !== 'cancelled' && order.status !== 'refunded' && (
              <>
                <button
                  onClick={onCancel}
                  className="flex items-center gap-1 px-3 py-2.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-lg text-sm transition-colors min-h-[44px]"
                  title="Stornieren"
                >
                  <XCircle className="w-4 h-4" />
                </button>
                {order.status !== 'new' && (
                  <button
                    onClick={onRevert}
                    className="flex items-center gap-1 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black rounded-lg text-sm transition-colors min-h-[44px]"
                    title="Zurücksetzen"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
            <ActionButton status={order.status} onAction={onAdvance} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ status, onAction }: { status: Order['status']; onAction: () => void }) {
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
