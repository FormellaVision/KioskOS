'use client';

import { useState, useEffect } from 'react';
import { LayoutList, LayoutGrid, Trash2, Plus, Store, MapPin, Mail, Phone, Pencil, Download, Loader2 } from 'lucide-react';
import { generateDatevExport, downloadCsv, getDatevPeriodDates, DatevPeriod } from '@/lib/datev-export';
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
  const { store, loading: storeLoading, saving, updateStore, settings, savingSettings, updateSettings } = useStore();
  const [editingStore, setEditingStore] = useState(false);
  const [storeForm, setStoreForm] = useState({ name: '', address: '', email: '', phone: '' });
  const [datevPeriod, setDatevPeriod] = useState<DatevPeriod>('current_month');
  const [datevExporting, setDatevExporting] = useState(false);

  const handleDatevExport = async () => {
    setDatevExporting(true);
    try {
      const { from, to } = getDatevPeriodDates(datevPeriod);
      const csv = await generateDatevExport({
        from,
        to,
        storeName: store?.name ?? 'KioskOS',
      });
      const filename = `DATEV_KioskOS_${from.getFullYear()}${String(from.getMonth() + 1).padStart(2, '0')}.csv`;
      downloadCsv(csv, filename);
      toast.success('DATEV-Export heruntergeladen');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Export fehlgeschlagen');
    } finally {
      setDatevExporting(false);
    }
  };

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
          Verkaufskanäle
        </p>
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-black font-semibold text-sm">Fulfillment-Optionen</p>
            <p className="text-gray-500 text-xs mt-0.5">
              Welche Abholungs- und Lieferoptionen bietet dein Shop an?
            </p>
          </div>

          <div className="divide-y divide-border">
            {/* Abholung */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-black text-sm font-medium">🏪 Abholung (Click & Collect)</p>
                <p className="text-gray-500 text-xs mt-0.5">Kunden bestellen online, holen im Laden ab</p>
              </div>
              <button
                onClick={async () => {
                  const newVal = !settings.pickup_enabled
                  try {
                    await updateSettings({ pickup_enabled: newVal })
                    toast.success(newVal ? 'Abholung aktiviert' : 'Abholung deaktiviert')
                  } catch {
                    toast.error('Fehler beim Speichern')
                  }
                }}
                disabled={savingSettings}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 disabled:opacity-60 ${
                  settings.pickup_enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  settings.pickup_enabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Versand */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-black text-sm font-medium">📦 Versand (deutschlandweit)</p>
                <p className="text-gray-500 text-xs mt-0.5">Bestellungen werden per Post/Paket versendet</p>
              </div>
              <button
                onClick={async () => {
                  const newVal = !settings.shipping_enabled
                  try {
                    await updateSettings({ shipping_enabled: newVal })
                    toast.success(newVal ? 'Versand aktiviert' : 'Versand deaktiviert')
                  } catch {
                    toast.error('Fehler beim Speichern')
                  }
                }}
                disabled={savingSettings}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 disabled:opacity-60 ${
                  settings.shipping_enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  settings.shipping_enabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Lokale Lieferung */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-black text-sm font-medium">🛵 Lokale Lieferung</p>
                  <p className="text-gray-500 text-xs mt-0.5">Lieferservice im Umkreis (wie Lieferando)</p>
                </div>
                <button
                  onClick={async () => {
                    const newVal = !settings.local_delivery_enabled
                    try {
                      await updateSettings({ local_delivery_enabled: newVal })
                      toast.success(newVal ? 'Lokale Lieferung aktiviert' : 'Lokale Lieferung deaktiviert')
                    } catch {
                      toast.error('Fehler beim Speichern')
                    }
                  }}
                  disabled={savingSettings}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 disabled:opacity-60 ${
                    settings.local_delivery_enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    settings.local_delivery_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Lieferoptions-Felder — nur wenn aktiv */}
              {settings.local_delivery_enabled && (
                <div className="mt-3 space-y-3 pl-4 border-l-2 border-green-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                        Umkreis (km)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={settings.local_delivery_radius_km ?? ''}
                        onChange={async (e) => {
                          const val = e.target.value ? parseInt(e.target.value) : null
                          try {
                            await updateSettings({ local_delivery_radius_km: val })
                          } catch {
                            toast.error('Fehler beim Speichern')
                          }
                        }}
                        placeholder="z. B. 5"
                        className="w-full border border-border rounded-xl px-3 py-2 text-sm text-black font-mono placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                        Liefergebühr (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.50"
                        value={settings.local_delivery_fee ?? ''}
                        onChange={async (e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : null
                          try {
                            await updateSettings({ local_delivery_fee: val })
                          } catch {
                            toast.error('Fehler beim Speichern')
                          }
                        }}
                        placeholder="0,00"
                        className="w-full border border-border rounded-xl px-3 py-2 text-sm text-black font-mono placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs">
                    Änderungen werden automatisch gespeichert
                  </p>
                </div>
              )}
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

      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
          Export & Buchhaltung
        </p>
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-black font-semibold text-sm">DATEV-Export</p>
            <p className="text-gray-500 text-xs mt-0.5">
              Buchungsdaten für deinen Steuerberater — DATEV Buchungsstapel CSV
            </p>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Zeitraum-Auswahl */}
            <div className="space-y-1.5">
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Zeitraum
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'current_month', label: 'Akt. Monat' },
                  { value: 'last_month', label: 'Letzter Monat' },
                  { value: 'current_quarter', label: 'Quartal' },
                ] as { value: DatevPeriod; label: string }[]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setDatevPeriod(value)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                      datevPeriod === value
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hinweis */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-amber-700 text-xs font-medium mb-0.5">Hinweis für deinen Steuerberater</p>
              <p className="text-amber-600 text-xs leading-relaxed">
                Konten: Forderungen (1200) → Erlöse 19% (8400). 
                Prüfe die Konten mit deinem Steuerberater — je nach SKR abweichend.
              </p>
            </div>

            {/* Export-Button */}
            <button
              onClick={handleDatevExport}
              disabled={datevExporting}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-sm transition-colors min-h-[56px]"
            >
              {datevExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird exportiert...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  DATEV-CSV herunterladen
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
