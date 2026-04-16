'use client';

import { useState } from 'react';
import { Search, Plus, Pencil, Package, ChevronUp, ChevronDown } from 'lucide-react';
import { Product } from '@/lib/kiosk-types';
import { PRODUCTS } from '@/lib/kiosk-data';
import ProductDrawer from './ProductDrawer';
import type { ProductViewMode } from './KioskApp';

type SortKey = 'name' | 'price' | 'stock_count' | 'available';
type SortDir = 'asc' | 'desc';

let nextId = PRODUCTS.length + 1;

interface ProductsProps {
  categories: string[];
  onCategoriesChange: (cats: string[]) => void;
  viewMode: ProductViewMode;
}

export default function Products({ categories, viewMode }: ProductsProps) {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = products
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'Alle' || p.category === activeCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'price') cmp = a.price - b.price;
      else if (sortKey === 'stock_count') {
        cmp = (a.stock_count ?? Infinity) - (b.stock_count ?? Infinity);
      } else if (sortKey === 'available') {
        cmp = Number(b.available) - Number(a.available);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const toggleAvailability = (id: number) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p)));
  };

  const handleSaveProduct = (data: Omit<Product, 'id'>) => {
    if (editProduct) {
      setProducts((prev) => prev.map((p) => (p.id === editProduct.id ? { ...p, ...data } : p)));
    } else {
      const id = nextId++;
      setProducts((prev) => [{ ...data, id }, ...prev]);
      setHighlightId(id);
      setTimeout(() => setHighlightId(null), 2000);
    }
    setDrawerOpen(false);
    setEditProduct(null);
  };

  const handleDeleteProduct = (id: number) => {
    if (window.confirm('Produkt wirklich löschen?')) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDrawerOpen(false);
      setEditProduct(null);
    }
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setDrawerOpen(true);
  };

  const openAdd = () => {
    setEditProduct(null);
    setDrawerOpen(true);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-red-500" />
      : <ChevronDown className="w-3 h-3 text-red-500" />;
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-black">Produkte</h1>
          <p className="text-gray-600 text-sm">{products.length} Artikel im Sortiment</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Produkt hinzufügen</span>
          <span className="sm:hidden">Neu</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Name oder SKU suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-2.5 text-black placeholder-gray-400 text-sm focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
        <select
          value={`${sortKey}-${sortDir}`}
          onChange={(e) => {
            const parts = e.target.value.split('-');
            const d = parts.pop() as SortDir;
            const k = parts.join('-') as SortKey;
            setSortKey(k);
            setSortDir(d);
          }}
          className="bg-white border border-border rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:border-red-500 transition-colors"
        >
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="price-asc">Preis ↑</option>
          <option value="price-desc">Preis ↓</option>
          <option value="available-asc">Verfügbar zuerst</option>
          <option value="available-desc">Nicht verfügbar zuerst</option>
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[34px] ${
              activeCategory === cat
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 border border-border hover:text-black'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {viewMode === 'grid' ? (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Package className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Keine Produkte gefunden</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((product) => (
                <GridCard
                  key={product.id}
                  product={product}
                  highlight={highlightId === product.id}
                  onToggle={() => toggleAvailability(product.id)}
                  onEdit={() => openEdit(product)}
                />
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 text-center pt-2">
            {filtered.length} von {products.length} Artikeln
          </p>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="hidden md:table-cell text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort('name')}
                  >
                    <span className={`flex items-center gap-1 ${sortKey === 'name' ? 'text-red-500' : 'text-gray-500'}`}>
                      Name <SortIcon col="name" />
                    </span>
                  </th>
                  <th className="hidden sm:table-cell text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[130px]">Kategorie</th>
                  <th
                    className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none w-[90px]"
                    onClick={() => handleSort('price')}
                  >
                    <span className={`flex items-center justify-end gap-1 ${sortKey === 'price' ? 'text-red-500' : 'text-gray-500'}`}>
                      Preis <SortIcon col="price" />
                    </span>
                  </th>
                  <th className="hidden md:table-cell text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[90px]">Sonderpr.</th>
                  <th
                    className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none w-[72px]"
                    onClick={() => handleSort('stock_count')}
                  >
                    <span className={`flex items-center justify-center gap-1 ${sortKey === 'stock_count' ? 'text-red-500' : 'text-gray-500'}`}>
                      Stück <SortIcon col="stock_count" />
                    </span>
                  </th>
                  <th
                    className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none w-[72px]"
                    onClick={() => handleSort('available')}
                  >
                    <span className={`flex items-center justify-center gap-1 ${sortKey === 'available' ? 'text-red-500' : 'text-gray-500'}`}>
                      Aktiv <SortIcon col="available" />
                    </span>
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[56px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400">
                      <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Keine Produkte gefunden</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((product, idx) => (
                    <TableRow
                      key={product.id}
                      product={product}
                      index={idx + 1}
                      highlight={highlightId === product.id}
                      onToggle={() => toggleAvailability(product.id)}
                      onEdit={() => openEdit(product)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-border bg-gray-50">
            <p className="text-xs text-gray-500">
              Zeige <span className="font-semibold text-black">{filtered.length}</span> von{' '}
              <span className="font-semibold text-black">{products.length}</span> Artikeln
            </p>
          </div>
        </div>
      )}

      <ProductDrawer
        open={drawerOpen}
        product={editProduct}
        categories={categories}
        onClose={() => {
          setDrawerOpen(false);
          setEditProduct(null);
        }}
        onSave={handleSaveProduct}
        onDelete={editProduct ? () => handleDeleteProduct(editProduct.id) : undefined}
      />
    </div>
  );
}

interface TableRowProps {
  product: Product;
  index: number;
  highlight: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

function TableRow({ product, index, highlight, onToggle, onEdit }: TableRowProps) {
  const isUnavailable = !product.available;
  const stockZero = product.stock_count === 0;

  return (
    <tr
      className={`transition-colors ${
        highlight
          ? 'bg-red-50'
          : isUnavailable
          ? 'bg-gray-50 opacity-70 hover:opacity-100 hover:bg-gray-100'
          : 'bg-white hover:bg-gray-50'
      }`}
      style={{ height: '48px' }}
    >
      <td className="hidden md:table-cell px-3 py-2 text-xs text-gray-400 font-mono">{index}</td>
      <td className="px-4 py-2 min-w-0">
        <p className={`font-semibold text-sm leading-tight truncate max-w-[220px] ${isUnavailable ? 'text-gray-400' : 'text-black'}`}>
          {product.name}
        </p>
        <p className="text-xs text-gray-400 font-mono mt-0.5">{product.sku}</p>
      </td>
      <td className="hidden sm:table-cell px-3 py-2">
        <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-gray-600 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">
          {product.category}
        </span>
      </td>
      <td className="px-3 py-2 text-right">
        <span className={`font-mono font-semibold text-sm ${isUnavailable ? 'text-gray-400' : 'text-black'}`}>
          € {product.price.toFixed(2)}
        </span>
      </td>
      <td className="hidden md:table-cell px-3 py-2 text-right">
        {product.sale_price != null ? (
          <span className="font-mono font-semibold text-sm text-red-500">
            € {product.sale_price.toFixed(2)}
          </span>
        ) : (
          <span className="text-gray-300 text-sm">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        {product.stock_count === null ? (
          <span className="font-mono text-sm text-gray-400">∞</span>
        ) : stockZero ? (
          <span className="font-mono text-sm font-bold text-red-500">0</span>
        ) : (
          <span className={`font-mono text-sm ${product.stock_count <= 5 ? 'text-orange-500 font-semibold' : 'text-black'}`}>
            {product.stock_count}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        <button
          onClick={onToggle}
          aria-label={product.available ? 'Deaktivieren' : 'Aktivieren'}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px]"
        >
          <div className={`relative w-9 h-[18px] rounded-full transition-colors duration-200 ${product.available ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200 ${product.available ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
          </div>
        </button>
      </td>
      <td className="px-3 py-2 text-center">
        <button
          onClick={onEdit}
          aria-label="Bearbeiten"
          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

interface GridCardProps {
  product: Product;
  highlight: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

function GridCard({ product, highlight, onToggle, onEdit }: GridCardProps) {
  const isUnavailable = !product.available;
  return (
    <div className={`bg-white rounded-xl border transition-all shadow-sm ${highlight ? 'border-red-300 ring-2 ring-red-100' : 'border-border'} ${isUnavailable ? 'opacity-70' : ''}`}>
      <div className="p-4">
        <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
          <Package className="w-8 h-8 text-gray-300" />
        </div>
        <p className={`font-bold text-sm leading-tight ${isUnavailable ? 'text-gray-400' : 'text-black'}`}>{product.name}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-gray-600 text-[10px] font-semibold uppercase tracking-wide">
            {product.category}
          </span>
          <span className={`font-mono font-bold text-sm ${isUnavailable ? 'text-gray-400' : 'text-black'}`}>
            € {product.price.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 min-h-[36px]"
          aria-label={product.available ? 'Deaktivieren' : 'Aktivieren'}
        >
          <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${product.available ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${product.available ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <span className={`text-xs font-medium ${product.available ? 'text-green-600' : 'text-gray-400'}`}>
            {product.available ? 'Aktiv' : 'Inaktiv'}
          </span>
        </button>
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
          aria-label="Bearbeiten"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
