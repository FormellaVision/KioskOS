'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Order, OrderItem } from '@/lib/supabase/types'
import { DEMO_STORE_ID } from '@/lib/constants'

export type OrderWithItems = Order & {
  items: OrderItem[]
  customer_name: string | null
}

export function useOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Orders mit Customer-Name via Join
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customers (name),
          order_items (*)
        `)
        .eq('store_id', DEMO_STORE_ID)
        .order('created_at', { ascending: false })
        .limit(50)

      if (ordersError) throw ordersError

      // any: Supabase join returns untyped nested objects
      const mapped: OrderWithItems[] = (ordersData ?? []).map((o: any) => ({
        ...o,
        customer_name: o.customers?.name ?? null,
        items: o.order_items ?? [],
      }))

      setOrders(mapped)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const advanceStatus = async (orderId: string, currentStatus: Order['status']) => {
    const nextStatus: Record<string, Order['status']> = {
      new: 'confirmed',
      confirmed: 'ready',
      ready: 'picked_up',
    }
    const next = nextStatus[currentStatus]
    if (!next) return

    // Optimistic update
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: next } : o)
    )

    const timestampField: Record<string, string> = {
      confirmed: 'confirmed_at',
      ready: 'ready_at',
      picked_up: 'completed_at',
    }

    const updates: Record<string, unknown> = { status: next }
    if (timestampField[next]) {
      updates[timestampField[next]] = new Date().toISOString()
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)

    if (error) {
      // Rollback
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: currentStatus } : o)
      )
      console.error('Status-Update fehlgeschlagen:', error)
    }
  }

  const revertStatus = async (orderId: string, currentStatus: Order['status']) => {
    const prevStatus: Record<string, Order['status']> = {
      confirmed: 'new',
      ready: 'confirmed',
      picked_up: 'ready',
    }
    const prev = prevStatus[currentStatus]
    if (!prev) return

    // Optimistic update
    setOrders(p =>
      p.map(o => (o.id === orderId ? { ...o, status: prev } : o))
    )

    const timestampToClear: Record<string, string> = {
      confirmed: 'confirmed_at',
      ready: 'ready_at',
      picked_up: 'completed_at',
    }

    const updates: Record<string, unknown> = { status: prev }
    if (timestampToClear[currentStatus]) {
      updates[timestampToClear[currentStatus]] = null
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)

    if (error) {
      // Rollback
      setOrders(p =>
        p.map(o => (o.id === orderId ? { ...o, status: currentStatus } : o))
      )
      console.error('Revert fehlgeschlagen:', error)
    }
  }

  const cancelOrder = async (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
    )
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) {
      console.error('Stornierung fehlgeschlagen:', error)
      fetchOrders() // Full refetch bei Fehler
    }
  }

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    advanceStatus,
    revertStatus,
    cancelOrder,
  }
}
