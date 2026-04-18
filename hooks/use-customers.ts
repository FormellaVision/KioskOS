'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Customer } from '@/lib/supabase/types'
import { DEMO_STORE_ID } from '@/lib/constants'

export type CustomerWithStats = Customer & {
  order_count: number
  total_spent: number
}

export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          orders (id, total, status)
        `)
        .eq('store_id', DEMO_STORE_ID)
        .order('created_at', { ascending: false })

      if (error) throw error

      // any: Supabase join returns untyped nested objects for orders relation
      const mapped: CustomerWithStats[] = (data ?? []).map((c: any) => {
        const validOrders = (c.orders ?? []).filter(
          (o: any) => !['cancelled', 'refunded'].includes(o.status)
        )
        return {
          ...c,
          order_count: validOrders.length,
          total_spent: validOrders.reduce((sum: number, o: any) => sum + (o.total ?? 0), 0),
        }
      })

      setCustomers(mapped)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
  }
}
