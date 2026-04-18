'use client'

import { useEffect, useState } from 'react'
import { Package, Plus, TrendingDown, AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react'
import { toast } from 'sonner'
import { useInventory, MovementType, ProductStock } from '@/hooks/use-inventory'
import { useProducts } from '@/hooks/use-products'

// Bewegungstyp Labels
const MOVEMENT_LABELS: Record<MovementType, { label: string; color: string; sign: string }> = {
  purchase:     { label: 'Wareneingang',   color: 'text-green-600',  sign: '+' },
  sale:         { label: 'Verkauf',         color: 'text-blue-600',   sign: '-' },
  return:       { label: 'Retoure',         color: 'text-purple-600', sign: '+' },
  adjustment:   { label: 'Korrektur',       color: 'text-amber-600',  sign: '±' },
  loss:         { label: 'Schwund',         color: 'text-red-600',    sign: '-' },
  transfer_in:  { label: 'Umbuchung rein',  color: 'text-teal-600',   sign: '+' },
  transfer_out: { label: 'Umbuchung raus',  color: 'text-orange-600', sign: '-' },
}

export default function Inventory() {
  const {
    movements, productStocks, loading, error,
    fetchMovements, fetchProductStocks,
    bookPurchase, bookAdjustment, enableStockTracking,
  } = useInventory()

  const { categories } = useProducts()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'purchase' | 'adjustment' | 'loss'>('purchase')
  const [selectedProduct, setSelectedProduct] = useState<ProductStock | null>(null)
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [filterLow, setFilterLow] = useState(false)

  useEffect(() => {
    fetchProductStocks()
    fetchMovements()
  }, [fetchProductStocks, fetchMovements])

  const openDrawer = (mode: 'purchase' | 'adjustment' | 'loss', product?: ProductStock) => {
    setDrawerMode(mode)
    setSelectedProduct(product ?? null)
    setQuantity('')
    setUnitCost('')
    setNote('')
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) return
    setSaving(true)
    try {
      if (drawerMode === 'purchase') {
        await bookPurchase({
          product_id: selectedProduct.id,
          quantity: parseInt(quantity),
          unit_cost: unitCost ? parseFloat(unitCost) : undefined,
          note: note || undefined,
        })
        toast.success(`+${quantity} ${selectedProduct.name} eingebucht`)
      } else {
        const qty = drawerMode === 'loss'
          ? -Math.abs(parseInt(quantity))
          : parseInt(quantity) // adjustment kann + oder - sein
        await bookAdjustment({
          product_id: selectedProduct.id,
          quantity: qty,
          movement_type: drawerMode,
          note: note || undefined,
        })
        toast.success(`Buchung für ${selectedProduct.name} gespeichert`)
      }
      setDrawerOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  // Produkte mit niedrigem Bestand (unter 5 Stück, aber Bestand wird geführt)
  const lowStockProducts = productStocks.filter(
    p => p.stock_count !== null && p.stock_count < 5
  )

  const displayedProducts = filterLow
    ? lowStockProducts
    : productStocks

  const getCategoryName = (cat_id: string | null) => {
    if (!cat_id) return '—'
    return categories.find(c => c.id === cat_id)?.name ?? '—'
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-black">Bestand</h1>
          <p className="text-gray-600 text-sm">
            {productStocks.filter(p => p.stock_count !== null).length} Produkte mit Bestandsführung
          </p>
        </div>
        <button
          onClick={() => openDrawer('purchase')}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Wareneingang</span>
          <span className="sm:hidden">Neu</span>
        </button>
      </div>

      {/* Low-Stock Warning */}
      {lowStockProducts.length > 0 && (
        <button
          onClick={() => setFilterLow(!filterLow)}
          className={`w-full flex items-center gap-2 text-xs font-medium px-3 py-2.5 rounded-xl transition-colors ${
            filterLow
              ? 'bg-amber-500 text-white'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {lowStockProducts.length} Produkte mit niedrigem Bestand
          {filterLow ? ' — Alle anzeigen' : ' — Nur diese anzeigen'}
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-400 text-sm">Wird geladen…</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Produktliste */}
      {!loading && (
        <div className="space-y-2">
          {displayedProducts.map(product => {
            const isTracked = product.stock_count !== null
            const isLow = isTracked && product.stock_count! < 5
            const isEmpty = isTracked && product.stock_count === 0

            return (
              <div
                key={product.id}
                className={`bg-white border rounded-xl p-4 shadow-sm ${
                  isEmpty ? 'border-red-200 bg-red-50/30' :
                  isLow ? 'border-amber-200 bg-amber-50/30' :
                  'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-black font-semibold text-sm truncate">{product.name}</p>
                    <p className="text-gray-500 text-xs">{getCategoryName(product.category_id)}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Bestandsanzeige */}
                    {isTracked ? (
                      <div className={`text-right ${isEmpty ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-black'}`}>
                        <p className="text-lg font-bold font-mono leading-none">
                          {product.stock_count}
                        </p>
                        <p className="text-xs text-gray-500">Stück</p>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-lg font-mono text-gray-400 leading-none">∞</p>
                        <p className="text-xs text-gray-400">kein Limit</p>
                      </div>
                    )}

                    {/* Aktions-Buttons */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => openDrawer('purchase', product)}
                        className="w-8 h-8 flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                        title="Wareneingang"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {isTracked && (
                        <button
                          onClick={() => openDrawer('loss', product)}
                          className="w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                          title="Schwund / Abgang"
                        >
                          <TrendingDown className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bestandsführung aktivieren */}
                {!isTracked && (
                  <button
                    onClick={async () => {
                      await enableStockTracking(product.id)
                      toast.success(`Bestandsführung für ${product.name} aktiviert`)
                    }}
                    className="mt-2 text-xs text-gray-400 hover:text-black underline underline-offset-2 transition-colors"
                  >
                    Bestandsführung aktivieren
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && displayedProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <Package className="w-10 h-10 text-gray-400 mb-3 opacity-50" />
          <p className="text-gray-500 text-sm">Keine Produkte gefunden</p>
        </div>
      )}

      {/* Bewegungshistorie */}
      <div className="border border-border rounded-xl overflow-hidden mt-4 bg-white shadow-sm">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-semibold text-black">Letzte Bewegungen</span>
          {showHistory ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {showHistory && (
          <div className="divide-y divide-border border-t border-border">
            {movements.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-6">
                Noch keine Bewegungen
              </p>
            )}
            {movements.map(mov => {
              const meta = MOVEMENT_LABELS[mov.movement_type]
              const isPositive = mov.quantity > 0
              return (
                <div key={mov.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">
                        {mov.products?.name ?? '—'}
                      </p>
                      <p className={`text-xs ${meta.color}`}>{meta.label}</p>
                      {mov.note && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">{mov.note}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-base font-bold font-mono ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? '+' : ''}{mov.quantity}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(mov.created_at)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Buchungs-Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border rounded-t-2xl transition-transform duration-300 ease-out md:left-64 ${
          drawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-border z-10">
          <div className="w-10 h-1 bg-gray-200 rounded-full absolute top-2 left-1/2 -translate-x-1/2" />
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-black font-bold text-base">
              {drawerMode === 'purchase' ? '📦 Wareneingang' :
               drawerMode === 'loss' ? '📉 Schwund / Abgang' :
               '✏️ Bestandskorrektur'}
            </h2>
            <button
              onClick={() => setDrawerOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4 pb-8">
          {/* Produktauswahl */}
          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Produkt
            </label>
            <select
              value={selectedProduct?.id ?? ''}
              onChange={(e) => {
                const p = productStocks.find(ps => ps.id === e.target.value) ?? null
                setSelectedProduct(p)
              }}
              className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black text-sm focus:outline-none focus:border-red-500 transition-colors appearance-none"
            >
              <option value="">Produkt auswählen…</option>
              {productStocks.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Modus-Auswahl */}
          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Art der Buchung
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['purchase', 'adjustment', 'loss'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDrawerMode(mode)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
                    drawerMode === mode
                      ? mode === 'purchase' ? 'bg-green-500 text-white'
                        : mode === 'loss' ? 'bg-red-500 text-white'
                        : 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {mode === 'purchase' ? 'Eingang' :
                   mode === 'loss' ? 'Schwund' : 'Korrektur'}
                </button>
              ))}
            </div>
          </div>

          {/* Menge */}
          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Menge {drawerMode === 'loss' ? '(wird als Abgang gebucht)' : ''}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              min="1"
              className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black placeholder-gray-400 text-sm font-mono focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Einkaufspreis (nur bei Wareneingang) */}
          {drawerMode === 'purchase' && (
            <div className="space-y-1.5">
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Einkaufspreis pro Stück (€) <span className="text-gray-400 normal-case font-normal">optional</span>
              </label>
              <input
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="0,00"
                step="0.01"
                min="0"
                className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black placeholder-gray-400 text-sm font-mono focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          )}

          {/* Notiz */}
          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Notiz <span className="text-gray-400 normal-case font-normal">optional</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                drawerMode === 'purchase' ? 'z. B. Metro-Lieferung KW17' :
                drawerMode === 'loss' ? 'z. B. MHD abgelaufen' :
                'z. B. Zählfehler korrigiert'
              }
              className="w-full bg-white border border-border rounded-xl px-4 py-3 text-black placeholder-gray-400 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={handleSave}
              disabled={!selectedProduct || !quantity || parseInt(quantity) <= 0 || saving}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-sm transition-colors min-h-[56px]"
            >
              {saving ? 'Wird gespeichert…' :
               drawerMode === 'purchase' ? `+${quantity || '0'} Stück einbuchen` :
               drawerMode === 'loss' ? `${quantity || '0'} Stück als Schwund buchen` :
               'Korrektur speichern'}
            </button>
            <button
              onClick={() => setDrawerOpen(false)}
              className="w-full text-gray-500 hover:text-black text-sm py-2 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
