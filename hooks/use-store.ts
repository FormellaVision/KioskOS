'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { DEMO_STORE_ID } from '@/lib/constants'

export type StoreData = {
  id: string
  name: string
  address: string | null
  email: string | null
  phone: string | null
  logo_url: string | null
}

export type StoreSettings = {
  pickup_enabled: boolean
  shipping_enabled: boolean
  local_delivery_enabled: boolean
  local_delivery_radius_km: number | null
  local_delivery_fee: number | null
}

export function useStore() {
  const [store, setStore] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<StoreSettings>({
    pickup_enabled: true,
    shipping_enabled: false,
    local_delivery_enabled: false,
    local_delivery_radius_km: null,
    local_delivery_fee: null,
  })
  const [savingSettings, setSavingSettings] = useState(false)

  const fetchStore = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, address, email, phone, logo_url')
        .eq('id', DEMO_STORE_ID)
        .single()
      if (error) throw error
      setStore(data)
    } catch (err) {
      console.error('Store laden fehlgeschlagen:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from('store_settings')
      .select('pickup_enabled, shipping_enabled, local_delivery_enabled, local_delivery_radius_km, local_delivery_fee')
      .eq('store_id', DEMO_STORE_ID)
      .single()
    if (data) {
      setSettings({
        pickup_enabled: data.pickup_enabled ?? true,
        shipping_enabled: data.shipping_enabled ?? false,
        local_delivery_enabled: data.local_delivery_enabled ?? false,
        local_delivery_radius_km: data.local_delivery_radius_km ?? null,
        local_delivery_fee: data.local_delivery_fee ?? null,
      })
    }
  }, [])

  useEffect(() => {
    fetchStore()
    fetchSettings()
  }, [fetchStore, fetchSettings])

  const updateStore = async (updates: Partial<Omit<StoreData, 'id'>>) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', DEMO_STORE_ID)
      if (error) throw error
      setStore(prev => prev ? { ...prev, ...updates } : prev)
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = async (updates: Partial<StoreSettings>) => {
    setSavingSettings(true)
    try {
      const { error } = await supabase
        .from('store_settings')
        .update(updates)
        .eq('store_id', DEMO_STORE_ID)
      if (error) throw error
      setSettings(prev => ({ ...prev, ...updates }))
    } finally {
      setSavingSettings(false)
    }
  }

  return { store, loading, saving, updateStore, settings, savingSettings, updateSettings, refetch: fetchStore }
}
