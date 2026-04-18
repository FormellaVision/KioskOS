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
  // Neu:
  weekRevenue: number
  weekOrderCount: number
  topProducts: {
    product_name: string
    total_sold: number
    total_revenue: number
  }[]
  revenueByCategory: {
    category_name: string
    revenue: number
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
    weekRevenue: 0,
    weekOrderCount: 0,
    topProducts: [],
    revenueByCategory: [],
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

      // Wochenumsatz (letzte 7 Tage)
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - 7)
      weekStart.setHours(0, 0, 0, 0)

      const { data: weekOrders } = await supabase
        .from('orders')
        .select('total, status')
        .eq('store_id', DEMO_STORE_ID)
        .gte('created_at', weekStart.toISOString())

      const validWeekOrders = (weekOrders ?? []).filter(
        (o: any) => !['cancelled', 'refunded'].includes(o.status)
      )
      const weekRevenue = validWeekOrders.reduce((sum: number, o: any) => sum + (o.total ?? 0), 0)
      const weekOrderCount = validWeekOrders.length

      // Topprodukte (letzte 30 Tage, nach Menge)
      const monthStart = new Date()
      monthStart.setDate(monthStart.getDate() - 30)

      const { data: itemsRaw } = await supabase
        .from('order_items')
        .select('product_name, quantity, line_total, orders!inner(store_id, created_at, status)')
        .eq('orders.store_id', DEMO_STORE_ID)
        .gte('orders.created_at', monthStart.toISOString())
        .not('orders.status', 'in', '(cancelled,refunded)')

      // Aggregieren nach product_name
      const productMap: Record<string, { total_sold: number; total_revenue: number }> = {}
      for (const item of (itemsRaw ?? []) as any[]) {
        const name = item.product_name ?? 'Unbekannt'
        if (!productMap[name]) productMap[name] = { total_sold: 0, total_revenue: 0 }
        productMap[name].total_sold += item.quantity ?? 0
        productMap[name].total_revenue += item.line_total ?? 0
      }
      const topProducts = Object.entries(productMap)
        .map(([product_name, v]) => ({ product_name, ...v }))
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, 5)

      // Umsatz nach Kategorie (letzte 30 Tage)
      const { data: productsWithCat } = await supabase
        .from('products')
        .select('name, categories(name)')
        .eq('store_id', DEMO_STORE_ID)
        .eq('is_archived', false)

      const productCatMap: Record<string, string> = {}
      for (const p of (productsWithCat ?? []) as any[]) {
        productCatMap[p.name] = p.categories?.name ?? 'Sonstiges'
      }

      const catRevenueMap: Record<string, number> = {}
      for (const item of (itemsRaw ?? []) as any[]) {
        const cat = productCatMap[item.product_name] ?? 'Sonstiges'
        catRevenueMap[cat] = (catRevenueMap[cat] ?? 0) + (item.line_total ?? 0)
      }
      const revenueByCategory = Object.entries(catRevenueMap)
        .map(([category_name, revenue]) => ({ category_name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6)

      setStats({
        todayRevenue,
        todayOrderCount,
        newOrderCount,
        openAmount,
        productCount: productCount ?? 0,
        recentOrders,
        weekRevenue,
        weekOrderCount,
        topProducts,
        revenueByCategory,
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
