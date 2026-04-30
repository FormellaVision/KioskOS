'use client'

import { useEffect, useState } from 'react'
import { 
  Truck, ChevronDown, ChevronUp, Phone, Package, Pencil, 
  Check, X, AlertCircle, Mail, MapPin, Globe, Plus, Trash2, 
  Loader2, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { useSuppliers, SupplierWithStats } from '@/hooks/use-suppliers'
import { Supplier } from '@/lib/supabase/types'

export default function Suppliers() {
  const { 
    suppliers, loading, error, fetchSuppliers, 
    createSupplier, updateSupplier, deleteSupplier 
  } = useSuppliers()
  
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup)
    setIsSheetOpen(true)
  }

  const handleOpenCreate = () => {
    setEditingSupplier(null)
    setIsSheetOpen(true)
  }

  if (loading && suppliers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Lieferanten</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {suppliers.length} Lieferanten · {suppliers.reduce((s, l) => s + l.productCount, 0)} Produkte
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"
          >
            <Plus className="w-4 h-4" />
            Neuer Lieferant
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {suppliers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Truck className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">Noch keine Lieferanten</p>
            <p className="text-muted-foreground text-xs mt-1 italic">
              Klicke oben auf "Neuer Lieferant", um zu starten
            </p>
          </div>
        )}

        {suppliers.map(supplier => (
          <SupplierCard
            key={supplier.id}
            supplier={supplier}
            expanded={expandedSupplier === supplier.id}
            onToggle={() => setExpandedSupplier(
              expandedSupplier === supplier.id ? null : supplier.id
            )}
            onEdit={() => handleOpenEdit(supplier)}
          />
        ))}
      </div>

      {isSheetOpen && (
        <SupplierDetailsSheet
          supplier={editingSupplier}
          onClose={() => setIsSheetOpen(false)}
          onSave={async (data) => {
            try {
              if (editingSupplier) {
                await updateSupplier(editingSupplier.id, data)
                toast.success('Lieferant aktualisiert')
              } else {
                await createSupplier(data)
                toast.success('Lieferant angelegt')
              }
              setIsSheetOpen(false)
            } catch (err: unknown) {
              toast.error(err instanceof Error ? err.message : 'Fehler')
            }
          }}
          onDelete={editingSupplier ? async () => {
             if (confirm('Möchtest du diesen Lieferanten wirklich löschen?')) {
               try {
                 await deleteSupplier(editingSupplier.id)
                 toast.success('Lieferant gelöscht')
                 setIsSheetOpen(false)
               } catch (err: unknown) {
                 toast.error(err instanceof Error ? err.message : 'Fehler')
               }
             }
          } : undefined}
        />
      )}
    </div>
  )
}

function SupplierCard({
  supplier,
  expanded,
  onToggle,
  onEdit
}: {
  supplier: SupplierWithStats
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-muted-foreground/30 shadow-sm">
      {/* Kopfzeile */}
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0" onClick={onEdit}>
            <p className="text-foreground font-bold text-sm truncate">{supplier.name}</p>
            
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 opacity-70">
              {supplier.email && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Mail className="w-2.5 h-2.5" />
                  <span className="truncate">{supplier.email}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Phone className="w-2.5 h-2.5" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {!supplier.email && !supplier.phone && (
                <p className="text-[10px] text-muted-foreground italic">Keine Kontaktinfos</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <Package className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-bold font-mono text-foreground">{supplier.productCount}</span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Produkte</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent hover:bg-accent/80 text-muted-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Produktliste (ausgeklappt) */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border bg-accent/10">
          {(supplier.products || []).map(p => (
            <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.is_available ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm text-foreground truncate">{p.name}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 text-right">
                {p.stock_count !== null && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted/50 ${p.stock_count < 5 ? 'text-amber-600' : 'text-muted-foreground'}`}>
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
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Gesamtwert</span>
            <span className="text-sm font-bold font-mono text-foreground">
              € {supplier.totalValue.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function SupplierDetailsSheet({
  supplier,
  onClose,
  onSave,
  onDelete
}: {
  supplier: Supplier | null
  onClose: () => void
  onSave: (data: Omit<Supplier, 'id' | 'store_id' | 'created_at' | 'updated_at'>) => Promise<void>
  onDelete?: () => Promise<void>
}) {
  const [form, setForm] = useState({
    name: supplier?.name ?? '',
    email: supplier?.email ?? '',
    phone: supplier?.phone ?? '',
    address: supplier?.address ?? '',
    website: supplier?.website ?? '',
    notes: supplier?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              {supplier ? 'Lieferant bearbeiten' : 'Neuer Lieferant'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-accent rounded-full text-muted-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto pb-24 sm:pb-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Firmenname *</label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="z. B. Metro Cash & Carry"
                className="w-full bg-muted/30 border-border border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="info@beispiel.de"
                  className="w-full bg-muted/30 border-border border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-black transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Telefon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+49 000 00000"
                  className="w-full bg-muted/30 border-border border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-black transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Anschrift</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <textarea
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Straße, PLZ Ort"
                rows={2}
                className="w-full bg-muted/30 border-border border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-black transition-all resize-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Webseite</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="url"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://www.beispiel.de"
                className="w-full bg-muted/30 border-border border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-black transition-all"
              />
              {form.website && (
                <a href={form.website} target="_blank" rel="noreferrer" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notizen</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="z. B. Liefertage: Mo, Mi · Mindestbestellwert 150€"
              rows={3}
              className="w-full bg-muted/30 border-border border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-all resize-none"
            />
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold h-12 rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {supplier ? 'Änderungen speichern' : 'Lieferant anlegen'}
            </button>
            
            {supplier && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Lieferant dauerhaft löschen
              </button>
            )}
            
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
