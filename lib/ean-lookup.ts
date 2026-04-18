export interface EanLookupResult {
  found: boolean
  name?: string
  brand?: string        // → supplier_name
  category?: string     // → kategorie (wird gemappt)
  imageUrl?: string
  quantity?: string     // z.B. "250ml", "25g"
}

export async function lookupEan(barcode: string): Promise<EanLookupResult> {
  if (!barcode || barcode.length < 8) {
    return { found: false }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode.trim()}.json`,
      { signal: controller.signal }
    )
    
    clearTimeout(timeoutId)

    if (!res.ok) return { found: false }

    const data = await res.json()

    if (data.status !== 1 || !data.product) {
      return { found: false }
    }

    const p = data.product

    // Produktname: bevorzuge deutschen Namen
    const name =
      p.product_name_de ||
      p.product_name ||
      p.generic_name_de ||
      p.generic_name ||
      null

    // Marke / Hersteller
    const brand = p.brands ? p.brands.split(',')[0].trim() : null

    // Kategorie aus OpenFoodFacts Tags → unsere Kategorien mappen
    const rawCats: string[] = p.categories_tags ?? []
    const category = mapOFFCategoryToKiosk(rawCats)

    // Bild
    const imageUrl = p.image_front_small_url || p.image_url || null

    // Menge
    const quantity = p.quantity || null

    return {
      found: true,
      name: name ? (quantity ? `${name} ${quantity}` : name) : undefined,
      brand: brand || undefined,
      category: category || undefined,
      imageUrl: imageUrl || undefined,
      quantity: quantity || undefined,
    }
  } catch {
    return { found: false }
  }
}

// Mappe OpenFoodFacts Kategorien auf KioskOS-Kategorien
function mapOFFCategoryToKiosk(tags: string[]): string | null {
  const tagStr = tags.join(' ').toLowerCase()

  if (tagStr.includes('beverage') || tagStr.includes('drink') ||
      tagStr.includes('water') || tagStr.includes('juice') ||
      tagStr.includes('energy') || tagStr.includes('cola') ||
      tagStr.includes('getraenk') || tagStr.includes('getränk')) {
    return 'Getränke'
  }
  if (tagStr.includes('tobacco') || tagStr.includes('tabak') ||
      tagStr.includes('cigarette') || tagStr.includes('shisha')) {
    return 'Tabak'
  }
  if (tagStr.includes('snack') || tagStr.includes('chip') ||
      tagStr.includes('candy') || tagStr.includes('chocolate') ||
      tagStr.includes('sweet') || tagStr.includes('confection')) {
    return 'Snacks'
  }
  if (tagStr.includes('dairy') || tagStr.includes('milk') ||
      tagStr.includes('cheese') || tagStr.includes('yogurt')) {
    return 'Kühlwaren'
  }

  return null
}
