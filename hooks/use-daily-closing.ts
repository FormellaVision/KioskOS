'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { DEMO_STORE_ID } from '@/lib/constants'

export type DailyClosingSummary = {
  date: string
  totalRevenue: number
  orderCount: number
  onlineRevenue: number
  expectedCash: number
  // GoBD-Erweiterungen:
  cancelledCount: number
  cancelledAmount: number
  grossRevenue: number
  zBonNumber: number
}

export type ClosingHistory = {
  id: string
  closing_date: string
  total_revenue: number
  order_count: number
  actual_cash: number | null
  expected_cash: number | null
  cash_difference: number | null
  notes: string | null
  closed_at: string
}

export function useDailyClosing() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<ClosingHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Berechnet Tagesstatistiken live aus orders Tabelle
  const fetchTodaySummary = useCallback(async (): Promise<DailyClosingSummary> => {
    setLoading(true)
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      // Alle heutigen Orders inkl. stornierte
      const { data: allOrders } = await supabase
        .from('orders')
        .select('total, status, payment_status, fulfillment_type')
        .eq('store_id', DEMO_STORE_ID)
        .gte('created_at', todayStart.toISOString())

      const orders = allOrders ?? []

      const validOrders = orders.filter(
        (o: any) => !['cancelled', 'refunded'].includes(o.status)
      )
      const cancelledOrders = orders.filter(
        (o: any) => ['cancelled', 'refunded'].includes(o.status)
      )

      const totalRevenue = validOrders.reduce((sum: number, o: any) => sum + (o.total ?? 0), 0)
      const onlineRevenue = validOrders
        .filter((o: any) => o.payment_status === 'paid')
        .reduce((sum: number, o: any) => sum + (o.total ?? 0), 0)
      const cancelledAmount = cancelledOrders.reduce((sum: number, o: any) => sum + (o.total ?? 0), 0)
      const grossRevenue = totalRevenue + cancelledAmount
      const expectedCash = totalRevenue - onlineRevenue

      // Z-Bon-Nummer: Anzahl bisheriger Abschlüsse + 1
      const { count: closingCount } = await supabase
        .from('daily_closings')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', DEMO_STORE_ID)

      return {
        date: todayStart.toISOString().split('T')[0],
        totalRevenue,
        orderCount: validOrders.length,
        onlineRevenue,
        expectedCash,
        cancelledCount: cancelledOrders.length,
        cancelledAmount,
        grossRevenue,
        zBonNumber: (closingCount ?? 0) + 1,
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Speichert den Tagesabschluss
  const saveClosing = async (params: {
    summary: DailyClosingSummary
    actualCash: number
    notes: string
  }) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('daily_closings')
        .upsert({
          store_id: DEMO_STORE_ID,
          closing_date: params.summary.date,
          z_bon_number: params.summary.zBonNumber,
          total_revenue: params.summary.totalRevenue,
          online_revenue: params.summary.onlineRevenue,
          pos_revenue: params.summary.expectedCash,
          // cash_revenue entfernt — nicht im Schema
          order_count: params.summary.orderCount,
          expected_cash: params.summary.expectedCash,
          actual_cash: params.actualCash,
          notes: params.notes || null,
          // closed_by = null bis Auth implementiert ist (kein FK-Conflict)
          closed_by: null,
          closed_at: new Date().toISOString(),
        }, {
          onConflict: 'store_id,closing_date'
        })

      if (error) {
        // Supabase-Error vollständig ausgeben
        console.error('Supabase Fehler:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw new Error(error.message ?? 'Unbekannter Supabase-Fehler')
      }
      return true
    } catch (err) {
      console.error('Abschluss speichern fehlgeschlagen:', err)
      throw err
    } finally {
      setSaving(false)
    }
  }

  // Lädt historische Abschlüsse (letzte 30 Tage)
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const { data } = await supabase
        .from('daily_closings')
        .select('*')
        .eq('store_id', DEMO_STORE_ID)
        .order('closing_date', { ascending: false })
        .limit(30)

      setHistory(data ?? [])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const generateXReport = useCallback(async (): Promise<DailyClosingSummary> => {
    return fetchTodaySummary()
  }, [fetchTodaySummary])

  return {
    loading,
    saving,
    history,
    historyLoading,
    fetchTodaySummary,
    saveClosing,
    fetchHistory,
    generateXReport,
  }
}
