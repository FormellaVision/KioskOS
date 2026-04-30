'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Scan, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Product, Category } from '@/lib/supabase/types';
import { lookupEan } from '@/lib/ean-lookup';
import { useSuppliers } from '@/hooks/use-suppliers';
import BarcodeScanner from './BarcodeScanner';

interface ProductDrawerProps {
  open: boolean;
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: Omit<Product, 'id' | 'store_id' | 'created_at' | 'updated_at'>) => void;
  onDelete?: () => void;
}

interface FormState {
  name: string;
  gtin: string;
  price: string;
  salePrice: string;
  stockCount: string;
  category_id: string;
  supplier_id: string;
  supplier_name: string;
  is_available: boolean;
  // Compliance & Regulierung
  age_restriction: number;
  requires_face_to_face: boolean;
  has_tobacco_tax: boolean;
  price_is_fixed: boolean;
  deposit_price: string;
}

export default function ProductDrawer({ open, product, categories, onClose, onSave, onDelete }: ProductDrawerProps) {
  const firstCategoryId = categories[0]?.id ?? '';

  const emptyForm: FormState = {
    name: '',
    gtin: '',
    price: '',
    salePrice: '',
    stockCount: '',
    category_id: firstCategoryId,
    supplier_id: '',
    supplier_name: '',
    is_available: true,
    age_restriction: 0,
    requires_face_to_face: false,
    has_tobacco_tax: false,
    price_is_fixed: false,
    deposit_price: '',
  };

  const [form, setForm] = useState<FormState>(emptyForm);
  const [eanLookupState, setEanLookupState] = useState<'idle' | 'loading' | 'found' | 'notfound'>('idle');
  const [showScanner, setShowScanner] = useState(false);
  
  const { suppliers, fetchSuppliers } = useSuppliers();
  const [isAddingNewSupplier, setIsAddingNewSupplier] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSuppliers();
    }
  }, [open, fetchSuppliers]);

  useEffect(() => {
    if (open) {
      if (product) {
        setForm({
          name: product.name,
          gtin: product.gtin ?? '',
          price: product.price.toString(),
          salePrice: product.sale_price != null ? product.sale_price.toString() : '',
          stockCount: product.stock_count != null ? product.stock_count.toString() : '',
          category_id: product.category_id ?? firstCategoryId,
          supplier_id: product.supplier_id ?? '',
          supplier_name: product.supplier_name ?? '',
          is_available: product.is_available,
          age_restriction: product.age_restriction ?? 0,
          requires_face_to_face: product.requires_face_to_face ?? false,
          has_tobacco_tax: product.has_tobacco_tax ?? false,
          price_is_fixed: product.price_is_fixed ?? false,
          deposit_price: product.deposit_price != null && product.deposit_price > 0
            ? product.deposit_price.toString()
            : '',
        });
      } else {
        setForm({ ...emptyForm, category_id: firstCategoryId });
      }
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
      setEanLookupState('idle');
    }
    return () => { document.body.classList.remove('overflow-hidden'); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product, firstCategoryId]);

  const handleEanLookup = async () => {
    if (!form.gtin.trim()) return;
    setEanLookupState('loading');
    try {
      const result = await lookupEan(form.gtin);
      if (result.found) {
        setEanLookupState('found');
        setForm(prev => ({
          ...prev,
          name: result.name ?? prev.name,
          supplier_name: prev.supplier_name || result.brand || prev.supplier_name,
        }));
        if (result.category) {
          const matchedCat = categories.find(
            c => c.name.toLowerCase() === result.category!.toLowerCase()
          );
          if (matchedCat) {
            setForm(prev => ({ ...prev, category_id: matchedCat.id }));
          }
        }
      } else {
        setEanLookupState('notfound');
      }
      setTimeout(() => setEanLookupState('idle'), 3000);
    } catch {
      setEanLookupState('notfound');
      setTimeout(() => setEanLookupState('idle'), 3000);
    }
  };

  const handleScan = (code: string) => {
    setForm(prev => ({ ...prev, gtin: code }));
    setShowScanner(false);
    // Auto-lookup nach Scan
    setTimeout(() => handleEanLookup(), 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.price) return;
    onSave({
      name: form.name.trim(),
      description: null,
      gtin: form.gtin.trim() || null,
      price: parseFloat(form.price) || 0,
      // Wenn Preisbindung aktiv → Sonderpreis immer null
      sale_price: form.price_is_fixed ? null : (form.salePrice ? parseFloat(form.salePrice) : null),
      stock_count: form.stockCount !== '' ? parseInt(form.stockCount) : null,
      category_id: form.category_id || null,
      supplier_id: form.supplier_id || null,
      supplier_name: form.supplier_name.trim() || null,
      supplier_contact: null,
      is_available: form.is_available,
      is_archived: false,
      image_url: null,
      // Compliance
      age_restriction: form.age_restriction,
      requires_face_to_face: form.requires_face_to_face,
      has_tobacco_tax: form.has_tobacco_tax,
      price_is_fixed: form.price_is_fixed,
      deposit_price: form.deposit_price ? parseFloat(form.deposit_price) : 0,
    });
  };

  const isEdit = !!product;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border rounded-t-2xl transition-transform duration-300 ease-out md:left-64 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-border z-10">
          <div className="w-10 h-1 bg-gray-200 rounded-full absolute top-2 left-1/2 -translate-x-1/2" />
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-black font-bold text-base">
              {isEdit ? 'Produkt bearbeiten' : 'Neues Produkt'}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5 pb-24 md:pb-8">
          {/* Produktname */}
          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Produktname *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="z. B. Red Bull 250ml"
              className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black placeholder-gray-400 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* EAN / GTIN */}
          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              EAN / Barcode
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  name="gtin"
                  value={form.gtin}
                  onChange={(e) => {
                    handleChange(e);
                    if (eanLookupState !== 'idle') setEanLookupState('idle');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && form.gtin.trim()) {
                      e.preventDefault();
                      handleEanLookup();
                    }
                  }}
                  placeholder="z. B. 9002490100070"
                  className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black placeholder-gray-400 text-sm font-mono focus:outline-none focus:border-red-500 transition-colors pr-8"
                />
                {eanLookupState === 'found' && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
                {eanLookupState === 'notfound' && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                )}
              </div>

              <button
                type="button"
                onClick={handleEanLookup}
                disabled={!form.gtin.trim() || eanLookupState === 'loading'}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-colors min-h-[48px] whitespace-nowrap"
              >
                {eanLookupState === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Scan className="w-4 h-4" />
                )}
                {eanLookupState === 'loading' ? 'Suche...' : 'Lookup'}
              </button>
            </div>

            {eanLookupState === 'found' && (
              <p className="text-green-600 text-xs flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Produkt gefunden — Felder wurden befüllt
              </p>
            )}
            {eanLookupState === 'notfound' && (
              <p className="text-amber-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Kein Produkt gefunden — Felder manuell ausfüllen
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-1.5 text-xs text-red-500 font-bold hover:text-red-700 cursor-pointer transition-colors w-fit py-1 px-2 bg-red-50 rounded-lg border border-red-100"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Barcode mit Kamera scannen</span>
            </button>
            {typeof window !== 'undefined' && !('BarcodeDetector' in window) && (
              <p className="text-[10px] text-gray-400 mt-1 italic">
                * Barcode-Erkennung wird in diesem Browser evtl. nicht unterstützt (Safari/iOS). Empfohlen: Chrome/Android.
              </p>
            )}
          </div>

          {/* Preis + Sonderpreis */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Preis (€) *
              </label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="0,00"
                step="0.01"
                min="0"
                className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black placeholder-gray-400 text-sm font-mono focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className={`text-xs font-semibold uppercase tracking-wider ${form.price_is_fixed ? 'text-gray-300' : 'text-gray-500'}`}>
                Sonderpreis (€)
              </label>
              <input
                name="salePrice"
                type="number"
                value={form.salePrice}
                onChange={handleChange}
                placeholder={form.price_is_fixed ? 'Preisbindung' : 'leer = kein Angebot'}
                step="0.01"
                min="0"
                disabled={form.price_is_fixed}
                className={`w-full border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none transition-colors ${
                  form.price_is_fixed
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-border text-black placeholder-gray-400 focus:border-red-500'
                }`}
              />
            </div>
          </div>

          {/* Stückzahl */}
          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Stückzahl
            </label>
            <div className="space-y-3">
              <input
                name="stockCount"
                type="number"
                value={form.stockCount}
                onChange={handleChange}
                placeholder="leer lassen = unbegrenzt ∞"
                min="0"
                className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black placeholder-gray-400 text-sm font-mono focus:outline-none focus:border-red-500 transition-colors"
              />
              <div className="flex flex-wrap gap-2">
                {[+1, +10, +100, -1, -10, -100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      const current = parseInt(form.stockCount || '0')
                      const next = Math.max(0, current + val)
                      setForm(prev => ({ ...prev, stockCount: next.toString() }))
                    }}
                    className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-xs font-bold transition-colors border ${
                      val > 0
                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                        : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    {val > 0 ? `+${val}` : val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Kategorie */}
          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Kategorie
            </label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black text-sm focus:outline-none focus:border-red-500 transition-colors appearance-none"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Lieferant */}
          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Lieferant (optional)
            </label>
            <div className="space-y-2">
              <select
                name="supplier_id"
                value={form.supplier_id}
                onChange={(e) => {
                  const val = e.target.value;
                  const selectedSup = suppliers.find(s => s.id === val);
                  setForm(prev => ({ 
                    ...prev, 
                    supplier_id: val,
                    supplier_name: selectedSup?.name ?? ''
                  }));
                }}
                className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black text-sm focus:outline-none focus:border-red-500 transition-colors appearance-none"
              >
                <option value="">Kein Lieferant</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ─── Compliance & Regulierung ─── */}
          <div className="border-t border-border pt-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Compliance & Regulierung
            </p>

            {/* Altersfreigabe */}
            <div className="space-y-1.5 mb-4">
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Altersfreigabe
              </label>
              <select
                name="age_restriction"
                value={form.age_restriction}
                onChange={(e) => setForm(prev => ({ ...prev, age_restriction: parseInt(e.target.value) }))}
                className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black text-sm focus:outline-none focus:border-red-500 transition-colors appearance-none"
              >
                <option value={0}>Keine (alle Altersgruppen)</option>
                <option value={16}>Ab 16 Jahren</option>
                <option value={18}>Ab 18 Jahren (AVS erforderlich)</option>
              </select>
              {form.age_restriction === 18 && (
                <p className="text-amber-600 text-xs mt-1">
                  ⚠️ Bei Online-Verkauf: Altersverifikation nach §10 JuSchG erforderlich
                </p>
              )}
            </div>

            {/* Pfandpreis */}
            <div className="space-y-1.5 mb-4">
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Pfand (€)
              </label>
              <input
                name="deposit_price"
                type="number"
                value={form.deposit_price}
                onChange={handleChange}
                placeholder="0,00 = kein Pfand"
                step="0.01"
                min="0"
                className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black placeholder-gray-400 text-sm font-mono focus:outline-none focus:border-red-500 transition-colors"
              />
              <p className="text-gray-400 text-xs">z. B. 0,25 € (Dose) · 0,15 € (Flasche)</p>
            </div>

            {/* Tabaksteuer Toggle */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-border mb-3">
              <div>
                <p className="text-black text-sm font-medium">Tabaksteuer-Pflicht</p>
                <p className="text-gray-500 text-xs">Produkt unterliegt der Tabaksteuer</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, has_tobacco_tax: !prev.has_tobacco_tax }))}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  form.has_tobacco_tax ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.has_tobacco_tax ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Preisbindung Toggle */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-border mb-3">
              <div>
                <p className="text-black text-sm font-medium">Preisbindung</p>
                <p className="text-gray-500 text-xs">Sonderpreis nicht erlaubt (z. B. Tabak)</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({
                  ...prev,
                  price_is_fixed: !prev.price_is_fixed,
                  // Sonderpreis leeren wenn Preisbindung aktiviert
                  salePrice: !prev.price_is_fixed ? '' : prev.salePrice,
                }))}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  form.price_is_fixed ? 'bg-red-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.price_is_fixed ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
            {form.price_is_fixed && (
              <p className="text-red-500 text-xs -mt-2 mb-3 px-1">
                🔒 Sonderpreis deaktiviert — gesetzliche Preisbindung aktiv
              </p>
            )}

            {/* Face-to-Face Toggle */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-border">
              <div>
                <p className="text-black text-sm font-medium">Face-to-Face Versand</p>
                <p className="text-gray-500 text-xs">DHL Ident-Check bei Lieferung</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, requires_face_to_face: !prev.requires_face_to_face }))}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  form.requires_face_to_face ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.requires_face_to_face ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* Verfügbar Toggle */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-border">
            <div>
              <p className="text-black text-sm font-medium">Verfügbar</p>
              <p className="text-gray-500 text-xs">Produkt im Shop anzeigen</p>
            </div>
            <button
              onClick={() => setForm((prev) => ({ ...prev, is_available: !prev.is_available }))}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                form.is_available ? 'bg-green-500' : 'bg-gray-300'
              }`}
              aria-label="Verfügbarkeit umschalten"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.is_available ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.price}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-sm transition-colors min-h-[56px]"
            >
              {isEdit ? 'Änderungen speichern' : 'Produkt hinzufügen'}
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-500 hover:text-black text-sm py-2 transition-colors"
            >
              Abbrechen
            </button>
          </div>

          {isEdit && onDelete && (
            <div className="pt-2 border-t border-border">
              <button
                onClick={onDelete}
                className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors py-2"
              >
                <Trash2 className="w-4 h-4" />
                Produkt archivieren
              </button>
            </div>
          )}
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
