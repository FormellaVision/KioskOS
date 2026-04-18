'use client';

import { useState, useEffect } from 'react';
import { LayoutList, LayoutGrid, Trash2, Plus, Store, MapPin, Mail, Phone, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { ProductViewMode } from './KioskApp';
import { Category } from '@/lib/supabase/types';
import { useStore } from '@/hooks/use-store';

interface ShopSettingsProps {
  categories: Category[];
  onAddCategory: (name: string) => Promise<Category>;
  onDeleteCategory: (id: string) => Promise<void>;
  viewMode: ProductViewMode;
  onViewModeChange: (mode: ProductViewMode) => void;
}

export default function ShopSettings({
  categories,
  onAddCategory,
  onDeleteCategory,
  viewMode,
  onViewModeChange
}: ShopSettingsProps) {
  const [newCat, setNewCat] = useState('');
  const { store, loading: storeLoading, saving, updateStore } = useStore();
  const [editingStore, setEditingStore] = useState(false);
  const [storeForm, setStoreForm] = useState({ name: '', address: '', email: '', phone: '' });

  useEffect(() => {
    if (store) {
      setStoreForm({
        name: store.name ?? '',
        address: store.address ?? '',
        email: store.email ?? '',
        phone: store.phone ?? '',
      });
    }
  }, [store]);

  const handleAddCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    if (categories.some((c) => c.name === name)) {
      toast.error('Kategorie existiert bereits');
      return;
    }
    try {
      await onAddCategory(name);
      setNewCat('');
      toast.success(`Kategorie "${name}" hinzugefügt`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Hinzufügen');
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
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                    <span className="text-black text-sm font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Kategorie "${cat.name}" wirklich löschen?`)) return
                        try {
                          await onDeleteCategory(cat.id)
                          toast.success(`Kategorie "${cat.name}" gelöscht`)
                        } catch (err: unknown) {
                          toast.error(err instanceof Error ? err.message : 'Löschen fehlgeschlagen')
                        }
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Kategorie löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
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
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-black font-semibold text-sm">Shop-Daten</p>
              <p className="text-gray-500 text-xs mt-0.5">Erscheinen auf Belegen und der Storefront</p>
            </div>
            {!editingStore && (
              <button
                onClick={() => setEditingStore(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors min-h-[44px]"
              >
                <Pencil className="w-3.5 h-3.5" />
                Bearbeiten
              </button>
            )}
          </div>

          {storeLoading ? (
            <div className="px-5 py-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {([
                { icon: Store, label: 'Shop-Name', key: 'name' as const },
                { icon: MapPin, label: 'Adresse', key: 'address' as const },
                { icon: Mail, label: 'E-Mail', key: 'email' as const },
                { icon: Phone, label: 'Telefon', key: 'phone' as const },
              ]).map(({ icon: Icon, label, key }) => (
                <div key={key} className="flex items-center gap-4 px-5 py-3.5">
                  <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    {editingStore ? (
                      <input
                        value={storeForm[key]}
                        onChange={(e) => setStoreForm((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-full text-sm text-black bg-gray-50 border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    ) : (
                      <p className="text-sm text-black truncate">{storeForm[key] || '—'}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {editingStore && (
            <div className="px-5 py-4 border-t border-border flex gap-3">
              <button
                onClick={async () => {
                  try {
                    await updateStore(storeForm)
                    toast.success('Shop-Daten gespeichert')
                    setEditingStore(false)
                  } catch {
                    toast.error('Speichern fehlgeschlagen')
                  }
                }}
                disabled={saving}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors"
              >
                {saving ? 'Wird gespeichert...' : 'Speichern'}
              </button>
              <button
                onClick={() => {
                  setEditingStore(false)
                  if (store) setStoreForm({ name: store.name, address: store.address ?? '', email: store.email ?? '', phone: store.phone ?? '' })
                }}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-black font-medium rounded-xl text-sm transition-colors"
              >
                Abbrechen
              </button>
            </div>
          )}
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
