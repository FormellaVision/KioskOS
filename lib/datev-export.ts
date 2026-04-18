import { supabase } from '@/lib/supabase/client'
import { DEMO_STORE_ID } from '@/lib/constants'

export type DatevPeriod = 'current_month' | 'last_month' | 'current_quarter' | 'custom'

export interface DatevExportOptions {
  from: Date
  to: Date
  storeName: string
}

interface OrderRow {
  id: string
  total: number
  subtotal: number
  shipping_cost: number
  status: string
  payment_status: string | null
  fulfillment_type: string
  created_at: string
  customers: { name: string | null; email: string } | null
  order_items: {
    product_name: string
    quantity: number
    unit_price: number
    line_total: number
  }[]
}

// DATEV Buchungsstapel CSV — vereinfachtes Format
// Spalten: Umsatz, Soll/Haben, Konto, Gegenkonto, Buchungstext, Belegdatum, Belegnummer
export async function generateDatevExport(opts: DatevExportOptions): Promise<string> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, total, subtotal, shipping_cost, status, payment_status,
      fulfillment_type, created_at,
      customers(name, email),
      order_items(product_name, quantity, unit_price, line_total)
    `)
    .eq('store_id', DEMO_STORE_ID)
    .not('status', 'in', '(cancelled,refunded)')
    .gte('created_at', opts.from.toISOString())
    .lte('created_at', opts.to.toISOString())
    .order('created_at', { ascending: true })

  if (error) throw error

  const orders = (data ?? []) as unknown as OrderRow[]

  // DATEV Header (vereinfacht — ohne Prüfziffer-Zeile)
  const lines: string[] = []

  // Metadaten-Zeile (DATEV erwartet spezifischen Header)
  lines.push([
    '"EXTF"',         // Kennzeichen
    '700',            // Versionsnummer
    '21',             // Datenkatgorie (Buchungsstapel)
    '"Buchungsstapel"',
    '9',              // Format-Version
    '',               // Erzeugt am (leer = jetzt)
    '',               // Importiert
    '',               // Herkunft
    '"KioskOS"',      // Exportiert von
    '',               // Importiert von
    '"10001"',        // Beraternummer (Platzhalter)
    '"99999"',        // Mandantennummer (Platzhalter)
    formatDatevDate(opts.from),  // WJ-Beginn
    '4',              // Sachkontonummernlänge
    formatDatevDate(opts.from),  // Datum von
    formatDatevDate(opts.to),    // Datum bis
    `"KioskOS Export ${formatDatevDate(opts.from)}-${formatDatevDate(opts.to)}"`, // Bezeichnung
    '',               // Diktatkürzel
    '1',              // Buchungstyp (1=Fibu, 2=Jahresabschluss)
    '0',              // Rechnungslegungszweck
    '0',              // Festschreibung
    '"EUR"',          // WKZ
    '',               // Derivatskennzeichen
    '',               // SKR
    '',               // Branchenlösung
    '',               // Anwendungsinformation
    '',               // Änderungskennzeichen
  ].join(';'))

  // Spaltenköpfe
  lines.push([
    'Umsatz (ohne Soll/Haben-Kz)',
    'Soll/Haben-Kennzeichen',
    'WKZ Umsatz',
    'Kurs',
    'Basis-Umsatz',
    'WKZ Basis-Umsatz',
    'Konto',
    'Gegenkonto (ohne BU-Schlüssel)',
    'BU-Schlüssel',
    'Belegdatum',
    'Belegfeld 1',
    'Belegfeld 2',
    'Skonto',
    'Buchungstext',
    'Postensperre',
    'Diverse Adressnummer',
    'Geschäftspartnerbank',
    'Sachverhalt',
    'Zinssperre',
    'Beleglink',
    'Beleginfo - Art 1',
    'Beleginfo - Inhalt 1',
    'Beleginfo - Art 2',
    'Beleginfo - Inhalt 2',
    'Beleginfo - Art 3',
    'Beleginfo - Inhalt 3',
    'Beleginfo - Art 4',
    'Beleginfo - Inhalt 4',
    'Beleginfo - Art 5',
    'Beleginfo - Inhalt 5',
    'Beleginfo - Art 6',
    'Beleginfo - Inhalt 6',
    'Beleginfo - Art 7',
    'Beleginfo - Inhalt 7',
    'Beleginfo - Art 8',
    'Beleginfo - Inhalt 8',
    'KOST1 - Kostenstelle',
    'KOST2 - Kostenstelle',
    'Kost-Menge',
    'EU-Land u. UStID',
    'EU-Steuersatz',
    'Abw. Versteuerungsart',
    'Sachverhalt L+L',
    'Funktionsergänzung L+L',
    'BU 49 Hauptfunktionstyp',
    'BU 49 Hauptfunktionsnummer',
    'BU 49 Funktionsergänzung',
    'Zusatzinformation - Art 1',
    'Zusatzinformation- Inhalt 1',
    'Zusatzinformation - Art 2',
    'Zusatzinformation- Inhalt 2',
    'Zusatzinformation - Art 3',
    'Zusatzinformation- Inhalt 3',
    'Zusatzinformation - Art 4',
    'Zusatzinformation- Inhalt 4',
    'Zusatzinformation - Art 5',
    'Zusatzinformation- Inhalt 5',
    'Zusatzinformation - Art 6',
    'Zusatzinformation- Inhalt 6',
    'Zusatzinformation - Art 7',
    'Zusatzinformation- Inhalt 7',
    'Zusatzinformation - Art 8',
    'Zusatzinformation- Inhalt 8',
    'Zusatzinformation - Art 9',
    'Zusatzinformation- Inhalt 9',
    'Zusatzinformation - Art 10',
    'Zusatzinformation- Inhalt 10',
    'Stück',
    'Gewicht',
    'Zahlweise',
    'Forderungsart',
    'Veranlagungsjahr',
    'Zugeordnete Fälligkeit',
    'Skontotyp',
    'Auftragsnummer',
    'Buchungstyp',
    'USt-Schlüssel (Anzahlungen)',
    'EU-Land (Anzahlungen)',
    'Sachverhalt L+L (Anzahlungen)',
    'EU-Steuersatz (Anzahlungen)',
    'Erlöskonto (Anzahlungen)',
    'Herkunft-Kz',
    'Buchungs GUID',
    'KOST-Datum',
    'SEPA-Mandatsreferenz',
    'Skontosperre',
    'Gesellschaftername',
    'Beteiligtennummer',
    'Identifikationsnummer',
    'Zeichnernummer',
    'Postensperre bis',
    'Bezeichnung SoBil-Sachverhalt',
    'Kennzeichen SoBil-Buchung',
    'Festschreibung',
    'Leistungsdatum',
    'Datum Zuord. Steuerperiode',
    'Fälligkeit',
    'Generalumkehr (GU)',
    'Steuersatz',
    'Land',
    'Abrechnungsreferenz',
    'BVV-Position',
    'EU-Mitgliedstaat Steuersatz',
    'EU-Steuersatz',
  ].join(';'))

  // Buchungszeilen — eine pro Order
  for (const order of orders) {
    const belegDatum = formatDatevBelegDatum(new Date(order.created_at))
    const belegnummer = `KOS-${order.id.slice(-6).toUpperCase()}`
    const kundenName = order.customers?.name ?? 'Privatkunde'
    const buchungsText = `Online-Bestellung ${belegnummer} - ${kundenName}`.substring(0, 60)

    // Umsatz-Buchung: Forderung an Erlös
    // Konto 1200 (Forderungen) Gegenkonto 8400 (Erlöse 19%)
    const umsatzFormatted = order.total.toFixed(2).replace('.', ',')

    const row = [
      umsatzFormatted,  // Umsatz
      'S',              // Soll
      'EUR',            // WKZ
      '',               // Kurs
      '',               // Basis-Umsatz
      '',               // WKZ Basis
      '1200',           // Konto (Forderungen aus LuL)
      '8400',           // Gegenkonto (Erlöse 19% USt)
      '',               // BU-Schlüssel
      belegDatum,       // Belegdatum TTMM
      belegnummer,      // Belegfeld 1
      '',               // Belegfeld 2
      '',               // Skonto
      buchungsText,     // Buchungstext
      ...Array(84).fill(''), // Restliche Felder leer
    ].join(';')

    lines.push(row)
  }

  return lines.join('\r\n')
}

function formatDatevDate(d: Date): string {
  // DATEV Format: YYYYMMDD
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function formatDatevBelegDatum(d: Date): string {
  // DATEV Belegdatum: TTMM (kein Jahr — das kommt aus dem WJ-Beginn)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}${month}`
}

export function downloadCsv(content: string, filename: string) {
  // DATEV erwartet Windows-1252 Encoding — wir nutzen UTF-8 mit BOM als Kompromiss
  // Moderner DATEV-Import akzeptiert UTF-8 mit BOM
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getDatevPeriodDates(period: DatevPeriod): { from: Date; to: Date } {
  const now = new Date()
  switch (period) {
    case 'current_month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return { from, to }
    }
    case 'last_month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return { from, to }
    }
    case 'current_quarter': {
      const q = Math.floor(now.getMonth() / 3)
      const from = new Date(now.getFullYear(), q * 3, 1)
      const to = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59)
      return { from, to }
    }
    default: {
      // Fallback: aktueller Monat
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return { from, to }
    }
  }
}
