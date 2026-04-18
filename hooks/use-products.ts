'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Product, Category } from '@/lib/supabase/types'
import { DEMO_STORE_ID } from '@/lib/constants'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', DEMO_STORE_ID)
        .eq('is_archived', false)
        .order('name', { ascending: true })

      if (error) {
        console.error('SUPABASE FETCH ERROR:', error)
        throw error
      }
      setProducts(data ?? [])

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', DEMO_STORE_ID)
      .order('sort_order', { ascending: true })
    setCategories(data ?? [])
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  const toggleAvailability = async (productId: string, currentValue: boolean) => {
    // Optimistic update
    setProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, is_available: !currentValue } : p)
    )
    const { error } = await supabase
      .from('products')
      .update({ is_available: !currentValue })
      .eq('id', productId)
    if (error) {
      // Rollback
      setProducts(prev =>
        prev.map(p => p.id === productId ? { ...p, is_available: currentValue } : p)
      )
      throw new Error('Verfügbarkeit konnte nicht geändert werden')
    }
  }

  const addProduct = async (productData: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...productData, store_id: DEMO_STORE_ID })
      .select()
      .single()
    if (error) throw error
    setProducts(prev => [data, ...prev])
    return data
  }

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single()
    if (error) throw error
    setProducts(prev => prev.map(p => p.id === productId ? data : p))
    return data
  }

  const archiveProduct = async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .update({ is_archived: true })
      .eq('id', productId)
    if (error) throw error
    setProducts(prev => prev.filter(p => p.id !== productId))
  }

  const addCategory = async (name: string) => {
    const { data, error } = await supabase
      .from('categories')
      .insert({ store_id: DEMO_STORE_ID, name, sort_order: categories.length + 1 })
      .select()
      .single()
    if (error) throw error
    setCategories(prev => [...prev, data])
    return data
  }

  const deleteCategory = async (categoryId: string) => {
    // Prüfen ob Produkte in dieser Kategorie vorhanden
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', DEMO_STORE_ID)
      .eq('category_id', categoryId)
      .eq('is_archived', false)

    if (count && count > 0) {
      throw new Error(`Kategorie hat noch ${count} aktive Produkte. Bitte zuerst Produkte einer anderen Kategorie zuweisen.`)
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('store_id', DEMO_STORE_ID)

    if (error) throw error
    setCategories(prev => prev.filter(c => c.id !== categoryId))
  }

  return {
    products,
    categories,
    loading,
    error,
    refetch: fetchProducts,
    toggleAvailability,
    addProduct,
    updateProduct,
    archiveProduct,
    addCategory,
    deleteCategory,
  }
}
