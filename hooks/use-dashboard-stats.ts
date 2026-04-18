'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { DEMO_STORE_ID } from '@/lib/constants'

export type DashboardStats = {
  todayRevenue: number
  todayOrderCount: number
  newOrderCount: number
  openAmount: number
  productCount: number
  recentOrders: {
    id: string
    customer_name: string | null
    total: number
    status: string
    created_at: string
    items_summary: string
  }[]
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    todayOrderCount: 0,
    newOrderCount: 0,
    openAmount: 0,
    productCount: 0,
    recentOrders: [],
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayISO = todayStart.toISOString()

    try {
      // Alle heutigen Orders
      // any: Supabase join returns untyped nested objects for customers/order_items
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('id, total, status, payment_status, created_at, customers(name), order_items(product_name, quantity)')
        .eq('store_id', DEMO_STORE_ID)
        .gte('created_at', todayISO)
        .order('created_at', { ascending: false })

      const orders = todayOrders ?? []

      const validOrders = orders.filter(
        (o: any) => !['cancelled', 'refunded'].includes(o.status)
      )

      const todayRevenue = validOrders.reduce((sum: number, o: any) => sum + (o.total ?? 0), 0)
      const todayOrderCount = validOrders.length
      const newOrderCount = orders.filter((o: any) => o.status === 'new').length
      const openAmount = validOrders
        .filter((o: any) => o.payment_status !== 'paid')
        .reduce((sum: number, o: any) => sum + (o.total ?? 0), 0)

      // Produkt-Count
      const { count: productCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', DEMO_STORE_ID)
        .eq('is_archived', false)

      // Letzte 3 Orders (alle Status)
      // any: Supabase join returns untyped nested objects
      const { data: recentRaw } = await supabase
        .from('orders')
        .select('id, total, status, created_at, customers(name), order_items(product_name, quantity)')
        .eq('store_id', DEMO_STORE_ID)
        .order('created_at', { ascending: false })
        .limit(3)

      const recentOrders = (recentRaw ?? []).map((o: any) => ({
        id: o.id,
        customer_name: o.customers?.name ?? 'Unbekannt',
        total: o.total,
        status: o.status,
        created_at: o.created_at,
        items_summary: (o.order_items ?? [])
          .slice(0, 2)
          .map((i: any) => `${i.quantity}x ${i.product_name}`)
          .join(', '),
      }))

      setStats({
        todayRevenue,
        todayOrderCount,
        newOrderCount,
        openAmount,
        productCount: productCount ?? 0,
        recentOrders,
      })
    } catch (err) {
      console.error('Dashboard stats error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, refetch: fetchStats }
}
