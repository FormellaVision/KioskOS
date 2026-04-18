'use client'

import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { DEMO_STORE_ID } from '@/lib/constants'

export interface SupplierProduct {
  id: string
  name: string
  price: number
  is_available: boolean
  stock_count: number | null
}

export interface Supplier {
  name: string
  contact: string | null
  productCount: number
  products: SupplierProduct[]
  totalValue: number  // Summe aller Produktpreise
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, is_available, stock_count, supplier_name, supplier_contact')
        .eq('store_id', DEMO_STORE_ID)
        .eq('is_archived', false)
        .not('supplier_name', 'is', null)
        .order('supplier_name', { ascending: true })

      if (error) throw error

      // Gruppieren nach supplier_name
      const map = new Map<string, Supplier>()
      for (const p of (data ?? [])) {
        const sName = p.supplier_name as string
        if (!map.has(sName)) {
          map.set(sName, {
            name: sName,
            contact: p.supplier_contact ?? null,
            productCount: 0,
            products: [],
            totalValue: 0,
          })
        }
        const s = map.get(sName)!
        s.products.push({
          id: p.id,
          name: p.name,
          price: p.price,
          is_available: p.is_available,
          stock_count: p.stock_count,
        })
        s.productCount++
        s.totalValue += p.price
      }

      setSuppliers(Array.from(map.values()))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }, [])

  // Kontakt für alle Produkte eines Lieferanten updaten
  const updateSupplierContact = async (supplierName: string, contact: string) => {
    const { error } = await supabase
      .from('products')
      .update({ supplier_contact: contact || null })
      .eq('store_id', DEMO_STORE_ID)
      .eq('supplier_name', supplierName)

    if (error) throw error

    setSuppliers(prev =>
      prev.map(s => s.name === supplierName ? { ...s, contact: contact || null } : s)
    )
  }

  // Lieferantennamen für alle Produkte umbenennen
  const renameSupplier = async (oldName: string, newName: string) => {
    if (!newName.trim()) throw new Error('Name darf nicht leer sein')

    const { error } = await supabase
      .from('products')
      .update({ supplier_name: newName.trim() })
      .eq('store_id', DEMO_STORE_ID)
      .eq('supplier_name', oldName)

    if (error) throw error
    await fetchSuppliers()
  }

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    updateSupplierContact,
    renameSupplier,
  }
}
