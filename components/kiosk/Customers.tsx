'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Mail, ShoppingBag, ChevronRight, AlertCircle, X } from 'lucide-react';
import { useCustomers, CustomerWithStats } from '@/hooks/use-customers';

export default function Customers() {
  const { customers, loading, error } = useCustomers();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Kunden werden geladen...</p>
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

  const filtered = customers.filter(
    (c) =>
      (c.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h1 className="text-xl font-bold text-black">Kunden</h1>
        <p className="text-gray-600 text-sm">{customers.length} registrierte Kunden</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input
          type="text"
          placeholder="Kunde suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white shadow-sm border border-border rounded-xl pl-10 pr-4 py-3 text-black placeholder-gray-600 text-sm focus:outline-none focus:border-red-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white shadow-sm rounded-xl p-4 border border-border">
          <p className="text-2xl font-bold text-black font-mono">{customers.length}</p>
          <p className="text-gray-600 text-xs mt-1">Kunden gesamt</p>
        </div>
        <div className="bg-white shadow-sm rounded-xl p-4 border border-border">
          <p className="text-2xl font-bold text-green-500 font-mono">
            {customers.filter((c) => c.newsletter_opt_in).length}
          </p>
          <p className="text-gray-600 text-xs mt-1">Newsletter</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <Users className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Kein Kunde gefunden</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((customer) => (
            <CustomerRow
              key={customer.id}
              customer={customer}
              onSelect={setSelectedCustomer}
            />
          ))}
        </div>
      )}

      <CustomerDetailSheet
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  );
}

function CustomerRow({
  customer,
  onSelect,
}: {
  customer: CustomerWithStats;
  onSelect: (c: CustomerWithStats) => void;
}) {
  const initials = (customer.name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="bg-white shadow-sm rounded-xl border border-border p-4 flex items-center gap-4">
      <div className="w-11 h-11 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-black font-bold text-sm">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-black font-bold text-sm">{customer.name ?? 'Unbekannt'}</p>
          {customer.newsletter_opt_in === true && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-500 border border-green-500/30 rounded text-[10px] font-bold">
              <Mail className="w-2.5 h-2.5" />
              Newsletter
            </span>
          )}
        </div>
        <p className="text-gray-600 text-xs mt-0.5 truncate">{customer.email}</p>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
            <ShoppingBag className="w-3 h-3 text-gray-600" />
            <span className="text-gray-600 text-xs">{customer.order_count} Bestellungen</span>
          </div>
          <span className="text-gray-600 text-xs">€ {customer.total_spent.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={() => onSelect(customer)}
        className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 text-sm font-medium transition-colors min-h-[44px] flex-shrink-0"
      >
        Details
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function CustomerDetailSheet({
  customer,
  onClose,
}: {
  customer: CustomerWithStats | null;
  onClose: () => void;
}) {
  const open = customer !== null;

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!customer) return null;

  const initials = (customer.name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const memberSince = customer.created_at
    ? new Date(customer.created_at).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Unbekannt';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border rounded-t-2xl transition-transform duration-300 ease-out md:left-64 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-border z-10">
          <div className="w-10 h-1 bg-gray-200 rounded-full absolute top-2 left-1/2 -translate-x-1/2" />
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-black font-bold text-base">Kundendetails</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5 pb-8">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-black font-bold text-xl flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-black font-bold text-lg">{customer.name ?? 'Unbekannt'}</p>
              <p className="text-gray-500 text-sm">{customer.email}</p>
              {customer.newsletter_opt_in && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-600 border border-green-500/30 rounded text-[10px] font-bold mt-1">
                  <Mail className="w-2.5 h-2.5" />
                  Newsletter aktiv
                </span>
              )}
            </div>
          </div>

          {/* Statistik-Karten */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-4 border border-border">
              <p className="text-2xl font-bold text-black font-mono">{customer.order_count}</p>
              <p className="text-gray-500 text-xs mt-0.5">Bestellungen</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-border">
              <p className="text-2xl font-bold text-black font-mono">
                € {customer.total_spent.toFixed(2)}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">Gesamtumsatz</p>
            </div>
          </div>

          {/* Details-Liste */}
          <div className="space-y-0 border border-border rounded-xl overflow-hidden">
            {customer.phone && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-gray-500 text-sm">Telefon</span>
                <span className="text-black text-sm font-medium">{customer.phone}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-gray-500 text-sm">E-Mail</span>
              <span className="text-black text-sm font-medium truncate max-w-[60%] text-right">
                {customer.email}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-gray-500 text-sm">Newsletter</span>
              <span className={`text-sm font-medium ${customer.newsletter_opt_in ? 'text-green-600' : 'text-gray-400'}`}>
                {customer.newsletter_opt_in ? 'Angemeldet' : 'Nicht angemeldet'}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-gray-500 text-sm">Kunde seit</span>
              <span className="text-black text-sm font-medium">{memberSince}</span>
            </div>
          </div>

          {/* Durchschnittlicher Warenkorbwert */}
          {customer.order_count > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 border border-border flex items-center justify-between">
              <span className="text-gray-600 text-sm">Ø Warenkorbwert</span>
              <span className="text-black font-bold font-mono text-lg">
                € {(customer.total_spent / customer.order_count).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
