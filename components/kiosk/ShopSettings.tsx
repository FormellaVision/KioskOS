'use client';

import { useState } from 'react';
import { LayoutList, LayoutGrid, Trash2, Plus, Store, MapPin, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import type { ProductViewMode } from './KioskApp';
import { useProducts } from '@/hooks/use-products';

interface ShopSettingsProps {
  viewMode: ProductViewMode;
  onViewModeChange: (mode: ProductViewMode) => void;
}

export default function ShopSettings({ viewMode, onViewModeChange }: ShopSettingsProps) {
  const { categories, products, addCategory, archiveProduct } = useProducts();
  const [newCat, setNewCat] = useState('');

  const getProductCount = (categoryId: string) =>
    products.filter((p) => p.category_id === categoryId).length;

  const handleAddCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    if (categories.some((c) => c.name === name)) {
      toast.error('Kategorie existiert bereits');
      return;
    }
    try {
      await addCategory(name);
      setNewCat('');
      toast.success(`Kategorie "${name}" hinzugefügt`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Hinzufügen');
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    const count = getProductCount(categoryId);
    const confirmMsg = count > 0
      ? `Kategorie "${categoryName}" löschen? ${count} Produkt(e) verlieren ihre Kategorie.`
      : `Kategorie "${categoryName}" löschen?`;

    if (!window.confirm(confirmMsg)) return;

    // Archive all products in this category
    const productsInCat = products.filter((p) => p.category_id === categoryId);
    try {
      await Promise.all(productsInCat.map((p) => archiveProduct(p.id)));
      toast.success(`Kategorie "${categoryName}" und ${productsInCat.length} Produkte archiviert`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-black">Shop Optionen</h1>
        <p className="text-gray-600 text-sm mt-0.5">Einstellungen und Konfiguration</p>
      </div>

      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
          Darstellung
        </p>
        <div className="bg-white rounded-xl border border-border shadow-sm p-5 space-y-4">
          <div>
            <p className="text-black font-semibold text-sm mb-1">Produktliste — Ansicht</p>
            <p className="text-gray-500 text-xs mb-3">Wähle wie Produkte auf der Produktseite angezeigt werden</p>
            <div className="flex gap-3">
              <button
                onClick={() => onViewModeChange('table')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-all ${
                  viewMode === 'table'
                    ? 'bg-red-500 text-white border-red-500 shadow-sm'
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                Liste
              </button>
              <button
                onClick={() => onViewModeChange('grid')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-all ${
                  viewMode === 'grid'
                    ? 'bg-red-500 text-white border-red-500 shadow-sm'
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Kacheln
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
          Kategorien
        </p>
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-black font-semibold text-sm">Kategorien verwalten</p>
            <p className="text-gray-500 text-xs mt-0.5">
              Kategorien erscheinen als Filter in der Produktliste und im Produkt-Formular
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              Keine Kategorien vorhanden
            </div>
          ) : (
            <div className="divide-y divide-border">
              {categories.map((cat) => {
                const count = getProductCount(cat.id);
                return (
                  <div key={cat.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                      <span className="text-black text-sm font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 text-xs">
                        {count} {count === 1 ? 'Produkt' : 'Produkte'}
                      </span>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        aria-label={`${cat.name} löschen`}
                        title="Kategorie löschen"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-5 py-4 border-t border-border bg-gray-50">
            <div className="flex gap-2">
              <input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                placeholder="Neue Kategorie..."
                className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors bg-white"
              />
              <button
                onClick={handleAddCategory}
                disabled={!newCat.trim()}
                className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
          Shop-Informationen
        </p>
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-black font-semibold text-sm">Shop-Daten</p>
            <p className="text-gray-500 text-xs mt-0.5">
              Diese Daten erscheinen auf Belegen und der Storefront
            </p>
          </div>
          <div className="divide-y divide-border">
            {[
              { icon: Store, label: 'Shop-Name', value: "Ali's Kiosk" },
              { icon: MapPin, label: 'Adresse', value: 'Altona, Hamburg' },
              { icon: Mail, label: 'E-Mail', value: 'ali@kiosk.de' },
              { icon: Phone, label: 'Telefon', value: '+49 40 12345678' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-3.5">
                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  <input
                    value={value}
                    readOnly
                    className="w-full text-sm text-gray-500 bg-transparent cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-border bg-gray-50">
            <p className="text-xs text-gray-400">
              Bearbeitung in Einstellungen verfügbar (Phase 2)
            </p>
          </div>
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
          Über KioskOS
        </p>
        <div className="bg-white rounded-xl border border-border shadow-sm px-5 py-4">
          <p className="text-sm font-semibold text-black">KioskOS Version 0.1 — MVP Prototyp</p>
          <p className="text-xs text-gray-500 mt-1">Stack: Next.js · Supabase · Tailwind CSS · Stripe</p>
        </div>
      </section>
    </div>
  );
}
