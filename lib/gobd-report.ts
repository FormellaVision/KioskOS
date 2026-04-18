import { DailyClosingSummary } from '@/hooks/use-daily-closing'

const LINE = '─'.repeat(40)
const DLINE = '═'.repeat(40)

function pad(label: string, value: string, width = 40): string {
  const gap = width - label.length - value.length
  return label + ' '.repeat(Math.max(1, gap)) + value
}

function eur(val: number): string {
  return `€ ${val.toFixed(2).replace('.', ',')}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

function formatTime(): string {
  return new Date().toLocaleTimeString('de-DE', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

export function generateXBericht(summary: DailyClosingSummary, storeName: string): string {
  const lines = [
    DLINE,
    '         X-BERICHT (ZWISCHENBERICHT)',
    DLINE,
    pad('Datum:', formatDate(summary.date)),
    pad('Uhrzeit:', formatTime()),
    pad('Betrieb:', storeName),
    LINE,
    'UMSATZ',
    pad('Brutto-Umsatz:', eur(summary.grossRevenue)),
    pad('Stornos:', `- ${eur(summary.cancelledAmount)}`),
    pad('Netto-Umsatz:', eur(summary.totalRevenue)),
    LINE,
    'BUCHUNGEN',
    pad('Bestellungen (gültig):', String(summary.orderCount)),
    pad('Stornierungen:', String(summary.cancelledCount)),
    pad('Online bezahlt:', eur(summary.onlineRevenue)),
    pad('Erwartete Kasse:', eur(summary.expectedCash)),
    LINE,
    '* KEIN ABSCHLUSS — NUR ZWISCHENSTAND *',
    '* Dieser Bericht ist kein Z-Bericht *',
    DLINE,
    '',
  ]
  return lines.join('\n')
}

export function generateZBericht(
  summary: DailyClosingSummary,
  actualCash: number,
  storeName: string,
  notes: string
): string {
  const cashDiff = actualCash - summary.expectedCash
  const diffLabel = Math.abs(cashDiff) < 0.01
    ? 'KASSE STIMMT'
    : cashDiff > 0
    ? 'ÜBERSCHUSS'
    : 'FEHLBETRAG'

  const lines = [
    DLINE,
    '           Z-BERICHT (TAGESABSCHLUSS)',
    DLINE,
    pad('Z-Bon-Nr.:', `Z-${String(summary.zBonNumber).padStart(4, '0')}`),
    pad('Datum:', formatDate(summary.date)),
    pad('Uhrzeit:', formatTime()),
    pad('Betrieb:', storeName),
    LINE,
    'UMSATZ',
    pad('Brutto-Umsatz:', eur(summary.grossRevenue)),
    pad('Stornos:', `- ${eur(summary.cancelledAmount)}`),
    pad('Netto-Umsatz:', eur(summary.totalRevenue)),
    LINE,
    'BUCHUNGEN',
    pad('Bestellungen (gültig):', String(summary.orderCount)),
    pad('Stornierungen:', String(summary.cancelledCount)),
    LINE,
    'ZAHLUNGSARTEN',
    pad('Online (bereits bezahlt):', eur(summary.onlineRevenue)),
    pad('Bar / EC (erwartet):', eur(summary.expectedCash)),
    LINE,
    'KASSENSTURZ',
    pad('Erwarteter Bestand:', eur(summary.expectedCash)),
    pad('Gezählter Bestand:', eur(actualCash)),
    pad(`DIFFERENZ (${diffLabel}):`, `${cashDiff >= 0 ? '+' : ''}${eur(cashDiff)}`),
    LINE,
    notes ? `Notiz: ${notes}` : '',
    LINE,
    'Dieser Abschluss ist GoBD-konform erstellt.',
    'Aufbewahrungspflicht: 10 Jahre.',
    DLINE,
    '',
  ].filter(l => l !== undefined)

  return lines.join('\n')
}

export function printReport(content: string, title: string) {
  const win = window.open('', '_blank', 'width=600,height=700')
  if (!win) return
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          white-space: pre;
          margin: 20px;
          color: #000;
          background: #fff;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>${content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body>
    </html>
  `)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 300)
}

export function downloadReport(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
