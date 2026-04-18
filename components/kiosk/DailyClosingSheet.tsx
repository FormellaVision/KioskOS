'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDailyClosing, DailyClosingSummary } from '@/hooks/use-daily-closing'
import { toast } from 'sonner'
import { generateXBericht, generateZBericht, printReport, downloadReport } from '@/lib/gobd-report'
import { Printer, Download, FileText } from 'lucide-react'

interface DailyClosingSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DailyClosingSheet({ open, onOpenChange }: DailyClosingSheetProps) {
  const { loading, saving, history, historyLoading, fetchTodaySummary, saveClosing, fetchHistory } =
    useDailyClosing()
  const [summary, setSummary] = useState<DailyClosingSummary | null>(null)
  const [actualCash, setActualCash] = useState('')
  const [notes, setNotes] = useState('')
  const [view, setView] = useState<'closing' | 'history'>('closing')
  const [saved, setSaved] = useState(false)
  const [xReportContent, setXReportContent] = useState<string | null>(null)
  const [showXReport, setShowXReport] = useState(false)

  useEffect(() => {
    if (open) {
      fetchTodaySummary().then(setSummary)
      fetchHistory()
      setSaved(false)
      setActualCash('')
      setNotes('')
      setView('closing')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const cashDiff =
    summary && actualCash !== '' ? parseFloat(actualCash) - summary.expectedCash : null

  const handleSave = async () => {
    if (!summary || actualCash === '') return
    try {
      await saveClosing({
        summary,
        actualCash: parseFloat(actualCash),
        notes,
      })
      setSaved(true)
      toast.success('Tagesabschluss gespeichert')
      
      // Z-Bericht automatisch als Download anbieten
      const zContent = generateZBericht(
        summary,
        parseFloat(actualCash),
        'Shisha World Hamburg',
        notes
      )
      const dateStr = summary.date.replace(/-/g, '')
      downloadReport(zContent, `Z-Bericht_${dateStr}_Z${String(summary.zBonNumber).padStart(4,'0')}.txt`)

      fetchHistory()
    } catch {
      toast.error('Fehler beim Speichern')
    }
  }

  const handleXReport = async () => {
    let s = summary;
    if (!s) {
      s = await fetchTodaySummary();
      setSummary(s);
    }
    const content = generateXBericht(s, 'Shisha World Hamburg')
    setXReportContent(content)
    setShowXReport(true)
    document.body.classList.add('overflow-hidden')
  }

  const closeXReport = () => {
    setShowXReport(false)
    document.body.classList.remove('overflow-hidden')
  }

  const formatEur = (val: number) =>
    `€ ${val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-white border-t border-border text-black h-[90vh] overflow-y-auto rounded-t-3xl pb-24 md:pb-8 shadow-2xl"
      >
        <SheetHeader className="mb-6 pt-2">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
          <SheetTitle className="text-black text-2xl font-bold tracking-tight">Tagesabschluss</SheetTitle>
        </SheetHeader>

        {/* Tab Switch */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('closing')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              view === 'closing' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Heute abschließen
          </button>
          <button
            onClick={() => setView('history')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              view === 'history' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Verlauf
          </button>
        </div>

        {/* CLOSING VIEW */}
        {view === 'closing' && (
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <div className="h-20 bg-zinc-800 rounded-xl animate-pulse" />
                <div className="h-20 bg-zinc-800 rounded-xl animate-pulse" />
              </div>
            ) : summary ? (
              <>
                {/* Tagesübersicht */}
                <div className="bg-gray-50 border border-border rounded-2xl p-5 space-y-4">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Tagesübersicht</p>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Gesamtumsatz</span>
                    <span className="text-black font-bold text-xl font-mono">
                      {formatEur(summary.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Online bezahlt</span>
                    <span className="text-gray-700 text-sm font-mono">{formatEur(summary.onlineRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Bestellungen</span>
                    <span className="text-gray-700 text-sm font-mono">{summary.orderCount}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                    <span className="text-black font-bold">Erwartete Kasse</span>
                    <span className="text-red-500 font-bold text-2xl font-mono">
                      {formatEur(summary.expectedCash)}
                    </span>
                  </div>
                </div>

                {/* X-Bericht Button */}
                <button
                  onClick={handleXReport}
                  className="w-full h-14 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl text-sm font-bold transition-all border border-border shadow-sm active:scale-[0.98]"
                >
                  <FileText className="w-5 h-5 text-gray-400" />
                  X-Bericht (Zwischenstand)
                </button>

                {/* Kassensturz */}
                <div className="bg-gray-50 border border-border rounded-2xl p-5 space-y-4">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Kassensturz</p>
                  <div>
                    <label className="text-gray-600 text-sm font-medium block mb-2">
                      Tatsächlicher Kassenstand (€)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      className="bg-white border-border text-black text-xl font-bold h-14 rounded-xl focus:ring-red-500 focus:border-red-500 font-mono"
                    />
                  </div>

                  {/* Differenz-Anzeige */}
                  {cashDiff !== null && (
                    <div
                      className={`rounded-lg p-3 flex justify-between items-center ${
                        Math.abs(cashDiff) < 0.01
                          ? 'bg-green-900/30 text-green-400'
                          : cashDiff > 0
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-red-900/30 text-red-400'
                      }`}
                    >
                      <span className="text-sm font-medium">
                        {Math.abs(cashDiff) < 0.01
                          ? '✓ Kasse stimmt'
                          : cashDiff > 0
                          ? '↑ Überschuss'
                          : '↓ Fehlbetrag'}
                      </span>
                      <span className="font-bold">
                        {cashDiff > 0 ? '+' : ''}
                        {formatEur(cashDiff)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Notizen */}
                <div className="bg-gray-50 border border-border rounded-2xl p-5">
                  <label className="text-gray-500 text-xs font-bold uppercase tracking-widest block mb-2">
                    Notiz (optional)
                  </label>
                  <Input
                    placeholder="z.B. Lieferung noch nicht verbucht..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-white border-border text-black rounded-xl h-12"
                  />
                </div>

                {/* Speichern-Button */}
                {!saved ? (
                  <Button
                    onClick={handleSave}
                    disabled={saving || actualCash === ''}
                    className="w-full h-14 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base rounded-2xl shadow-lg active:scale-[0.98] transition-all"
                  >
                    {saving ? 'Wird gespeichert...' : '✓ Tagesabschluss speichern'}
                  </Button>
                ) : (
                  <div className="w-full h-14 bg-green-50 border border-green-200 text-green-600 rounded-2xl flex items-center justify-center font-bold">
                    ✓ Abschluss gespeichert
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* HISTORY VIEW */}
        {view === 'history' && (
          <div className="space-y-3">
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-zinc-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">Noch keine Abschlüsse vorhanden</div>
            ) : (
              history.map((closing) => (
                <div key={closing.id} className="bg-white border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-gray-700 font-bold">
                      {new Date(closing.closing_date).toLocaleDateString('de-DE', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                    <span className="text-black font-bold font-mono">{formatEur(closing.total_revenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{closing.order_count} Bestellungen</span>
                    {closing.cash_difference !== null && (
                      <span
                        className={`font-bold font-mono ${
                          Math.abs(closing.cash_difference) < 0.01
                            ? 'text-green-600'
                            : closing.cash_difference > 0
                            ? 'text-blue-600'
                            : 'text-red-500'
                        }`}
                      >
                        {closing.cash_difference > 0 ? '+' : ''}
                        {formatEur(closing.cash_difference)}
                      </span>
                    )}
                  </div>
                  {closing.notes && (
                    <p className="text-gray-400 text-xs mt-3 bg-gray-50 p-2 rounded-lg italic">"{closing.notes}"</p>
                  )}
                  <button
                    onClick={() => {
                      const content = [
                        `Z-BERICHT ARCHIV`,
                        `Datum: ${new Date(closing.closing_date).toLocaleDateString('de-DE')}`,
                        `Umsatz: € ${closing.total_revenue.toFixed(2)}`,
                        `Bestellungen: ${closing.order_count}`,
                        `Differenz: ${closing.cash_difference !== null ? `€ ${closing.cash_difference.toFixed(2)}` : '—'}`,
                        closing.notes ? `Notiz: ${closing.notes}` : '',
                      ].filter(Boolean).join('\n')
                      downloadReport(content, `Abschluss_${closing.closing_date}.txt`)
                    }}
                    className="mt-4 flex items-center gap-1.5 text-gray-500 hover:text-black text-xs font-bold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Bericht herunterladen
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* X-Bericht Modal */}
        {showXReport && xReportContent && (
          <div className="fixed inset-0 z-[60] bg-black/60 flex items-end justify-center p-4 backdrop-blur-sm">
            <div className="bg-white border border-border rounded-3xl w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gray-50">
                <span className="text-black font-bold text-sm">X-Bericht Vorschau</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printReport(xReportContent, 'X-Bericht')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Drucken
                  </button>
                  <button
                    onClick={closeXReport}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-200 text-gray-500 hover:text-black transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
              <pre className="flex-1 overflow-y-auto px-6 py-5 text-gray-700 text-xs font-mono leading-relaxed whitespace-pre bg-white">
                {xReportContent}
              </pre>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
