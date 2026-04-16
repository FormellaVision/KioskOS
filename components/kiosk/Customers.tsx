'use client';

import { useState } from 'react';
import { Search, Users, Mail, ShoppingBag, ChevronRight } from 'lucide-react';
import { Customer } from '@/lib/kiosk-types';
import { CUSTOMERS } from '@/lib/kiosk-data';

export default function Customers() {
  const [search, setSearch] = useState('');

  const filtered = CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h1 className="text-xl font-bold text-black">Kunden</h1>
        <p className="text-gray-600 text-sm">{CUSTOMERS.length} registrierte Kunden</p>
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
          <p className="text-2xl font-bold text-black font-mono">{CUSTOMERS.length}</p>
          <p className="text-gray-600 text-xs mt-1">Kunden gesamt</p>
        </div>
        <div className="bg-white shadow-sm rounded-xl p-4 border border-border">
          <p className="text-2xl font-bold text-green-500 font-mono">
            {CUSTOMERS.filter((c) => c.newsletter).length}
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
            <CustomerRow key={customer.id} customer={customer} />
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerRow({ customer }: { customer: Customer }) {
  const initials = customer.name
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
          <p className="text-black font-bold text-sm">{customer.name}</p>
          {customer.newsletter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-500 border border-green-500/30 rounded text-[10px] font-bold">
              <Mail className="w-2.5 h-2.5" />
              Newsletter
            </span>
          )}
        </div>
        <p className="text-gray-600 text-xs mt-0.5 truncate">{customer.email}</p>
        <div className="flex items-center gap-1 mt-1">
          <ShoppingBag className="w-3 h-3 text-gray-600" />
          <span className="text-gray-600 text-xs">{customer.orders} Bestellungen</span>
        </div>
      </div>

      <button className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-100 rounded-lg text-gray-600 text-sm font-medium transition-colors min-h-[44px] flex-shrink-0">
        Details
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
