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

export function useStore() {
  const [store, setStore] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

  useEffect(() => {
    fetchStore()
  }, [fetchStore])

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

  return { store, loading, saving, updateStore, refetch: fetchStore }
}
