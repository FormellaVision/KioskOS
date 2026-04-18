'use client';

import { useState } from 'react';
import { Plus, PackageCheck, TrendingUp, Clock } from 'lucide-react';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import OrderStatusBadge from './OrderStatusBadge';
import { Order } from '@/lib/supabase/types';
import { DailyClosingSheet } from '@/components/kiosk/DailyClosingSheet';

interface DashboardProps {
  onNavigate: (page: 'products' | 'orders') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { stats, loading } = useDashboardStats();
  const [closingOpen, setClosingOpen] = useState(false);

  const today = new Date();
  const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const dateString = `${dayNames[today.getDay()]}, ${today.getDate()}. ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-black">Guten Morgen, Ali 👋</h1>
        <p className="text-gray-600 text-sm mt-1">{dateString}</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-red-500" />
          <span className="text-gray-600 text-sm font-medium">Heutiger Umsatz</span>
        </div>
        {loading ? (
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-4xl font-bold text-black tracking-tight font-mono">
            € {stats.todayRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-border flex flex-col items-center justify-center text-center shadow-sm">
          {loading ? (
            <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-black font-mono">{stats.todayOrderCount}</p>
          )}
          <p className="text-gray-600 text-xs mt-1 leading-tight">Bestellungen</p>
        </div>
        <div className={`rounded-xl p-4 border flex flex-col items-center justify-center text-center shadow-sm ${
          stats.newOrderCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-border'
        }`}>
          {loading ? (
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className={`text-2xl font-bold font-mono ${stats.newOrderCount > 0 ? 'text-amber-500' : 'text-black'}`}>
              {stats.newOrderCount}
            </p>
          )}
          <p className="text-gray-600 text-xs mt-1 leading-tight">Neu</p>
          {stats.newOrderCount > 0 && (
            <span className="mt-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </div>
        <div className="bg-white rounded-xl p-4 border border-border flex flex-col items-center justify-center text-center shadow-sm">
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="text-xl font-bold text-black font-mono leading-tight">{stats.productCount}</p>
          )}
          <p className="text-gray-600 text-xs mt-1 leading-tight">Produkte</p>
        </div>
      </div>

      {stats.openAmount > 0 && !loading && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 shadow-sm">
          <p className="text-amber-700 text-sm font-medium">
            € {stats.openAmount.toFixed(2)} offen (unbezahlt)
          </p>
        </div>
      )}

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
        <button
          onClick={() => setClosingOpen(true)}
          className="w-full h-14 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
        >
          🧾 Tagesabschluss
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest">Letzte Bestellungen</p>
        <div className="space-y-2">
          {loading ? (
            <>
              <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
              </div>
            </>
          ) : stats.recentOrders.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-8">Noch keine Bestellungen</div>
          ) : (
            stats.recentOrders.map((order) => (
              <RecentOrderCard key={order.id} order={order} />
            ))
          )}
        </div>
      </div>

      <DailyClosingSheet open={closingOpen} onOpenChange={setClosingOpen} />

      {/* Wochenübersicht */}
      <div className="space-y-3">
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest">
          Diese Woche
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
            <p className="text-gray-500 text-xs mb-1">Umsatz (7 Tage)</p>
            {loading ? (
              <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-xl font-bold text-black font-mono">
                {`\u20ac ${stats.weekRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`}
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
            <p className="text-gray-500 text-xs mb-1">Bestellungen (7 Tage)</p>
            {loading ? (
              <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-xl font-bold text-black font-mono">{stats.weekOrderCount}</p>
            )}
          </div>
        </div>
      </div>

      {/* Topprodukte */}
      {!loading && stats.topProducts.length > 0 && (
        <div className="space-y-3">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest">
            Top Produkte (30 Tage)
          </p>
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            {stats.topProducts.map((p, i) => {
              const maxSold = stats.topProducts[0].total_sold;
              const barWidth = maxSold > 0 ? (p.total_sold / maxSold) * 100 : 0;
              return (
                <div key={p.product_name} className={`px-4 py-3 ${i < stats.topProducts.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-400 text-xs font-mono w-4 flex-shrink-0">{i + 1}</span>
                      <span className="text-black text-sm font-medium truncate">{p.product_name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-gray-500 text-xs font-mono">{p.total_sold}&times;</span>
                      <span className="text-black text-xs font-bold font-mono">{`\u20ac ${p.total_revenue.toFixed(2)}`}</span>
                    </div>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Umsatz nach Kategorie */}
      {!loading && stats.revenueByCategory.length > 0 && (
        <div className="space-y-3">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest">
            Umsatz nach Kategorie (30 Tage)
          </p>
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            {stats.revenueByCategory.map((cat, i) => {
              const total = stats.revenueByCategory.reduce((s, c) => s + c.revenue, 0);
              const pct = total > 0 ? Math.round((cat.revenue / total) * 100) : 0;
              return (
                <div
                  key={cat.category_name}
                  className={`px-4 py-3 flex items-center justify-between gap-3 ${i < stats.revenueByCategory.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm text-black font-medium truncate">{cat.category_name}</span>
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-gray-400 text-xs">{pct}%</span>
                    <span className="text-black text-xs font-bold font-mono">{`\u20ac ${cat.revenue.toFixed(2)}`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RecentOrderCard({ order }: { order: { id: string; customer_name: string | null; total: number; status: string; created_at: string; items_summary: string } }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-border flex items-center justify-between gap-3 shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-black font-bold text-sm font-mono">#{order.id.slice(-4).toUpperCase()}</span>
          <span className="text-gray-600 text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(order.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-gray-600 text-xs truncate">
          {order.customer_name ?? 'Unbekannt'} · {order.items_summary || 'Keine Details'}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-black font-bold text-sm font-mono">€ {order.total.toFixed(2)}</span>
        <OrderStatusBadge status={order.status as Order['status']} />
      </div>
    </div>
  );
}
