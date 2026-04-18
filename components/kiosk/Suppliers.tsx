'use client'

import { useEffect, useState } from 'react'
import { Truck, ChevronDown, ChevronUp, Phone, Package, Pencil, Check, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useSuppliers, Supplier } from '@/hooks/use-suppliers'

export default function Suppliers() {
  const { suppliers, loading, error, fetchSuppliers, updateSupplierContact, renameSupplier } = useSuppliers()
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null)

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Lieferanten werden geladen...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-red-500">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-10 px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">Lieferanten</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {suppliers.length} Lieferanten · {suppliers.reduce((s, l) => s + l.productCount, 0)} Produkte
        </p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {suppliers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Truck className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">Noch keine Lieferanten</p>
            <p className="text-muted-foreground text-xs mt-1">
              Trage bei Produkten einen Lieferantennamen ein
            </p>
          </div>
        )}

        {suppliers.map(supplier => (
          <SupplierCard
            key={supplier.name}
            supplier={supplier}
            expanded={expandedSupplier === supplier.name}
            onToggle={() => setExpandedSupplier(
              expandedSupplier === supplier.name ? null : supplier.name
            )}
            onUpdateContact={updateSupplierContact}
            onRename={renameSupplier}
          />
        ))}
      </div>
    </div>
  )
}

function SupplierCard({
  supplier,
  expanded,
  onToggle,
  onUpdateContact,
  onRename,
}: {
  supplier: Supplier
  expanded: boolean
  onToggle: () => void
  onUpdateContact: (name: string, contact: string) => Promise<void>
  onRename: (old: string, next: string) => Promise<void>
}) {
  const [editingContact, setEditingContact] = useState(false)
  const [contactDraft, setContactDraft] = useState(supplier.contact ?? '')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(supplier.name)
  const [saving, setSaving] = useState(false)

  const handleSaveContact = async () => {
    setSaving(true)
    try {
      await onUpdateContact(supplier.name, contactDraft)
      setEditingContact(false)
      toast.success('Kontakt gespeichert')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveName = async () => {
    if (!nameDraft.trim() || nameDraft === supplier.name) {
      setEditingName(false)
      setNameDraft(supplier.name)
      return
    }
    setSaving(true)
    try {
      await onRename(supplier.name, nameDraft)
      setEditingName(false)
      toast.success('Lieferant umbenannt')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Kopfzeile */}
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') { setEditingName(false); setNameDraft(supplier.name) }
                  }}
                  autoFocus
                  className="flex-1 text-sm font-bold text-foreground bg-transparent border-b border-red-500 focus:outline-none pb-0.5"
                />
                <button onClick={handleSaveName} disabled={saving}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setEditingName(false); setNameDraft(supplier.name) }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-foreground font-bold text-sm">{supplier.name}</p>
                <button
                  onClick={() => setEditingName(true)}
                  className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Kontakt-Zeile */}
            <div className="mt-1.5">
              {editingContact ? (
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <input
                    value={contactDraft}
                    onChange={e => setContactDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveContact()
                      if (e.key === 'Escape') { setEditingContact(false); setContactDraft(supplier.contact ?? '') }
                    }}
                    autoFocus
                    placeholder="Tel / E-Mail / Notiz"
                    className="flex-1 text-xs text-foreground bg-transparent border-b border-red-500 focus:outline-none pb-0.5 placeholder-muted-foreground"
                  />
                  <button onClick={handleSaveContact} disabled={saving}
                    className="w-6 h-6 flex items-center justify-center rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => { setEditingContact(false); setContactDraft(supplier.contact ?? '') }}
                    className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 text-gray-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingContact(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                >
                  <Phone className="w-3 h-3" />
                  {supplier.contact ? (
                    <span>{supplier.contact}</span>
                  ) : (
                    <span className="italic">Kontakt hinzufügen…</span>
                  )}
                  <Pencil className="w-2.5 h-2.5 opacity-50" />
                </button>
              )}
            </div>
          </div>

          {/* Rechte Seite: Stats + Toggle */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <Package className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-bold font-mono text-foreground">{supplier.productCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Produkte</p>
            </div>
            <button
              onClick={onToggle}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent hover:bg-accent/80 text-muted-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Produktliste (ausgeklappt) */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {supplier.products.map(p => (
            <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.is_available ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm text-foreground truncate">{p.name}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 text-right">
                {p.stock_count !== null && (
                  <span className={`text-xs font-mono ${p.stock_count < 5 ? 'text-amber-600 font-bold' : 'text-muted-foreground'}`}>
                    {p.stock_count} Stk
                  </span>
                )}
                <span className="text-sm font-mono font-bold text-foreground">
                  € {p.price.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
          <div className="px-4 py-3 bg-accent/30 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Gesamtwert (Verkaufspreise)</span>
            <span className="text-sm font-bold font-mono text-foreground">
              € {supplier.totalValue.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
