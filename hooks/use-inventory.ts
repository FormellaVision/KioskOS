'use client'

import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { DEMO_STORE_ID } from '@/lib/constants'

export type MovementType = 'purchase' | 'sale' | 'return' | 'adjustment' | 'loss' | 'transfer_in' | 'transfer_out'

export interface InventoryMovement {
  id: string
  store_id: string
  product_id: string
  movement_type: MovementType
  quantity: number
  unit_cost: number | null
  unit_price: number | null
  note: string | null
  created_at: string
  // Joined:
  products?: { name: string } | null
}

export interface ProductStock {
  id: string
  name: string
  stock_count: number | null
  category_id: string | null
  is_available: boolean
}

export function useInventory() {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [productStocks, setProductStocks] = useState<ProductStock[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMovements = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*, products(name)')
        .eq('store_id', DEMO_STORE_ID)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      setMovements(data ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProductStocks = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, stock_count, category_id, is_available')
      .eq('store_id', DEMO_STORE_ID)
      .eq('is_archived', false)
      .order('name', { ascending: true })
    setProductStocks(data ?? [])
  }, [])

  // Wareneingang: Bestand erhöhen
  const bookPurchase = async (opts: {
    product_id: string
    quantity: number
    unit_cost?: number
    note?: string
  }) => {
    // 1. Bewegung buchen
    const { error: movErr } = await supabase
      .from('inventory_movements')
      .insert({
        store_id: DEMO_STORE_ID,
        product_id: opts.product_id,
        movement_type: 'purchase',
        quantity: opts.quantity,
        unit_cost: opts.unit_cost ?? null,
        note: opts.note ?? null,
        reference_type: 'manual',
      })
    if (movErr) throw movErr

    // 2. Bestand auf Produkt updaten (wenn stock_count geführt wird)
    const product = productStocks.find(p => p.id === opts.product_id)
    if (product && product.stock_count !== null) {
      const newCount = product.stock_count + opts.quantity
      await supabase
        .from('products')
        .update({ stock_count: newCount, is_available: true })
        .eq('id', opts.product_id)
      setProductStocks(prev =>
        prev.map(p => p.id === opts.product_id
          ? { ...p, stock_count: newCount, is_available: true }
          : p
        )
      )
    }

    await fetchMovements()
  }

  // Korrektur / Schwund
  const bookAdjustment = async (opts: {
    product_id: string
    quantity: number  // negativ für Abgang
    movement_type: 'adjustment' | 'loss'
    note?: string
  }) => {
    const { error: movErr } = await supabase
      .from('inventory_movements')
      .insert({
        store_id: DEMO_STORE_ID,
        product_id: opts.product_id,
        movement_type: opts.movement_type,
        quantity: opts.quantity,
        note: opts.note ?? null,
        reference_type: 'manual',
      })
    if (movErr) throw movErr

    // Bestand anpassen
    const product = productStocks.find(p => p.id === opts.product_id)
    if (product && product.stock_count !== null) {
      const newCount = Math.max(0, product.stock_count + opts.quantity)
      const isAvailable = newCount > 0
      await supabase
        .from('products')
        .update({ stock_count: newCount, is_available: isAvailable })
        .eq('id', opts.product_id)
      setProductStocks(prev =>
        prev.map(p => p.id === opts.product_id
          ? { ...p, stock_count: newCount, is_available: isAvailable }
          : p
        )
      )
    }

    await fetchMovements()
  }

  // stock_count aktivieren für Produkt (von null auf 0 setzen)
  const enableStockTracking = async (product_id: string) => {
    const { error } = await supabase
      .from('products')
      .update({ stock_count: 0 })
      .eq('id', product_id)
    if (error) throw error
    setProductStocks(prev =>
      prev.map(p => p.id === product_id ? { ...p, stock_count: 0 } : p)
    )
  }

  return {
    movements,
    productStocks,
    loading,
    error,
    fetchMovements,
    fetchProductStocks,
    bookPurchase,
    bookAdjustment,
    enableStockTracking,
  }
}
