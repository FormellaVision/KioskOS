'use client'

import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { DEMO_STORE_ID } from '@/lib/constants'
import { Supplier as DBSupplier, Product as DBProduct } from '@/lib/supabase/types'

export interface SupplierWithStats extends DBSupplier {
  productCount: number
  totalValue: number
  products: DBProduct[]
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<SupplierWithStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch all suppliers
      const { data: sups, error: supErr } = await supabase
        .from('suppliers')
        .select('*')
        .eq('store_id', DEMO_STORE_ID)
        .order('name', { ascending: true })

      if (supErr) throw supErr

      // 2. Fetch product stats for these suppliers
      const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .eq('is_archived', false)

      if (prodErr) throw prodErr

      // 3. Aggregate stats
      const stats = (sups || []).map(s => {
        const supProducts = (products || []).filter((p: DBProduct) => p.supplier_id === s.id)
        return {
          ...s,
          productCount: supProducts.length,
          totalValue: supProducts.reduce((sum: number, p: DBProduct) => sum + (p.price || 0), 0),
          products: supProducts
        }
      })

      setSuppliers(stats)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }, [])

  const createSupplier = async (data: Omit<DBSupplier, 'id' | 'store_id' | 'created_at' | 'updated_at'>) => {
    const { data: newSup, error } = await supabase
      .from('suppliers')
      .insert({
        ...data,
        store_id: DEMO_STORE_ID
      })
      .select()
      .single()

    if (error) throw error
    await fetchSuppliers()
    return newSup
  }

  const updateSupplier = async (id: string, data: Partial<Omit<DBSupplier, 'id' | 'store_id' | 'created_at' | 'updated_at'>>) => {
    const { error } = await supabase
      .from('suppliers')
      .update(data)
      .eq('id', id)

    if (error) throw error
    await fetchSuppliers()
  }

  const deleteSupplier = async (id: string) => {
    // Check if supplier is used
    const { count, error: countErr } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', id)

    if (countErr) throw countErr
    if (count && count > 0) throw new Error('Lieferant kann nicht gelöscht werden, da er noch Produkten zugeordnet ist.')

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)

    if (error) throw error
    await fetchSuppliers()
  }

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  }
}
