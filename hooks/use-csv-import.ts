'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { DEMO_STORE_ID } from '@/lib/constants'

export type CSVRow = {
  name: string
  price: number
  sale_price: number | null
  category_name: string
  ean: string | null
  supplier_name: string | null
  is_available: boolean
}

export type ImportResult = {
  success: number
  errors: { row: number; message: string }[]
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  if (lines.length < 2) throw new Error('CSV muss mindestens eine Kopfzeile und eine Datenzeile haben')

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'))
  const rows = lines.slice(1).map(l => parseCSVLine(l))

  return { headers, rows }
}

function mapRow(headers: string[], row: string[], rowIndex: number): CSVRow {
  const get = (key: string) => {
    const idx = headers.indexOf(key)
    return idx >= 0 ? row[idx] ?? '' : ''
  }

  const name = get('name') || get('produktname') || get('artikel')
  if (!name) throw new Error(`Zeile ${rowIndex + 2}: Name fehlt`)

  const priceRaw = get('price') || get('preis') || get('vk_preis')
  const price = parseFloat(priceRaw.replace(',', '.'))
  if (isNaN(price) || price < 0) throw new Error(`Zeile ${rowIndex + 2}: Ungültiger Preis "${priceRaw}"`)

  const salePriceRaw = get('sale_price') || get('sonderpreis') || get('angebotspreis')
  const sale_price = salePriceRaw ? parseFloat(salePriceRaw.replace(',', '.')) : null

  const category_name = get('category') || get('kategorie') || get('warengruppe') || 'Sonstige'
  const ean = get('ean') || get('barcode') || get('gtin') || null
  const supplier_name = get('supplier') || get('lieferant') || null

  const availableRaw = get('available') || get('verfuegbar') || get('aktiv') || '1'
  const is_available = ['1', 'true', 'ja', 'yes', 'aktiv'].includes(availableRaw.toLowerCase())

  return {
    name: name.trim(),
    price,
    sale_price: sale_price && !isNaN(sale_price) ? sale_price : null,
    category_name: category_name.trim(),
    ean: ean?.trim() || null,
    supplier_name: supplier_name?.trim() || null,
    is_available,
  }
}

export function useCSVImport() {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const importCSV = async (file: File): Promise<ImportResult> => {
    setImporting(true)
    setResult(null)

    try {
      const text = await file.text()
      // UTF-8 BOM entfernen (häufig bei Excel-Exports)
      const cleanText = text.replace(/^\uFEFF/, '')
      const { headers, rows } = parseCSV(cleanText)

      // Kategorien vorab laden oder anlegen
      const { data: existingCats } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', DEMO_STORE_ID)

      const categoryMap: Record<string, string> = {}
      for (const cat of existingCats ?? []) {
        categoryMap[cat.name.toLowerCase()] = cat.id
      }

      const importResult: ImportResult = { success: 0, errors: [] }

      // Zeilen verarbeiten, Produkte sammeln
      const BATCH_SIZE = 50
      // any: dynamisch zusammengebaute Insert-Objekte für Supabase
      const productsToInsert: any[] = []

      for (let i = 0; i < rows.length; i++) {
        try {
          const mapped = mapRow(headers, rows[i], i)

          // Kategorie anlegen falls nicht vorhanden
          const catKey = mapped.category_name.toLowerCase()
          if (!categoryMap[catKey]) {
            const { data: newCat, error: catError } = await supabase
              .from('categories')
              .insert({
                store_id: DEMO_STORE_ID,
                name: mapped.category_name,
                sort_order: Object.keys(categoryMap).length + 1,
              })
              .select('id, name')
              .single()

            if (catError) throw new Error(`Kategorie "${mapped.category_name}" konnte nicht angelegt werden`)
            categoryMap[catKey] = newCat.id
          }

          productsToInsert.push({
            store_id: DEMO_STORE_ID,
            name: mapped.name,
            price: mapped.price,
            sale_price: mapped.sale_price,
            category_id: categoryMap[catKey],
            gtin: mapped.ean,
            supplier_name: mapped.supplier_name,
            is_available: mapped.is_available,
            is_archived: false,
          })
        } catch (err: unknown) {
          importResult.errors.push({
            row: i + 2,
            message: err instanceof Error ? err.message : 'Unbekannter Fehler',
          })
        }
      }

      // Batch-Insert
      for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
        const batch = productsToInsert.slice(i, i + BATCH_SIZE)
        const { error } = await supabase.from('products').insert(batch)
        if (error) {
          importResult.errors.push({
            row: i + 2,
            message: `Batch-Fehler: ${error.message}`,
          })
        } else {
          importResult.success += batch.length
        }
      }

      setResult(importResult)
      return importResult
    } finally {
      setImporting(false)
    }
  }

  const reset = () => setResult(null)

  return { importCSV, importing, result, reset }
}
