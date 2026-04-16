'use client';

import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Product } from '@/lib/kiosk-types';

interface ProductDrawerProps {
  open: boolean;
  product: Product | null;
  categories: string[];
  onClose: () => void;
  onSave: (data: Omit<Product, 'id'>) => void;
  onDelete?: () => void;
}

const emptyForm = {
  name: '',
  sku: '',
  price: '',
  salePrice: '',
  stockCount: '',
  category: 'Getränke',
  supplier: '',
  available: true,
};

export default function ProductDrawer({ open, product, categories, onClose, onSave, onDelete }: ProductDrawerProps) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      if (product) {
        setForm({
          name: product.name,
          sku: product.sku,
          price: product.price.toString(),
          salePrice: product.sale_price != null ? product.sale_price.toString() : '',
          stockCount: product.stock_count != null ? product.stock_count.toString() : '',
          category: product.category,
          supplier: product.supplier ?? '',
          available: product.available,
        });
      } else {
        setForm({ ...emptyForm, category: categories.filter((c) => c !== 'Alle')[0] ?? 'Getränke' });
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open, product, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.price) return;
    onSave({
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: parseFloat(form.price) || 0,
      sale_price: form.salePrice ? parseFloat(form.salePrice) : null,
      stock_count: form.stockCount !== '' ? parseInt(form.stockCount) : null,
      category: form.category,
      supplier: form.supplier.trim() || undefined,
      available: form.available,
      image: null,
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
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4 pb-8">
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

          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              SKU / Artikelnummer
            </label>
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="z. B. RB-250"
              className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black placeholder-gray-400 text-sm font-mono focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

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
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Sonderpreis (€)
              </label>
              <input
                name="salePrice"
                type="number"
                value={form.salePrice}
                onChange={handleChange}
                placeholder="leer = kein Angebot"
                step="0.01"
                min="0"
                className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black placeholder-gray-400 text-sm font-mono focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Stückzahl
            </label>
            <input
              name="stockCount"
              type="number"
              value={form.stockCount}
              onChange={handleChange}
              placeholder="leer lassen = unbegrenzt ∞"
              min="0"
              className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black placeholder-gray-400 text-sm font-mono focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Kategorie *
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black text-sm focus:outline-none focus:border-red-500 transition-colors appearance-none"
            >
              {categories.filter((c) => c !== 'Alle').map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Lieferant (optional)
            </label>
            <input
              name="supplier"
              value={form.supplier}
              onChange={handleChange}
              placeholder="z. B. Metro Cash & Carry"
              className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black placeholder-gray-400 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-border">
            <div>
              <p className="text-black text-sm font-medium">Verfügbar</p>
              <p className="text-gray-500 text-xs">Produkt im Shop anzeigen</p>
            </div>
            <button
              onClick={() => setForm((prev) => ({ ...prev, available: !prev.available }))}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                form.available ? 'bg-green-500' : 'bg-gray-300'
              }`}
              aria-label="Verfügbarkeit umschalten"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.available ? 'translate-x-6' : 'translate-x-0'
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
                Produkt löschen
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
