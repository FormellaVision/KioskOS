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
  }

  const formatEur = (val: number) =>
    `€ ${val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-zinc-900 border-zinc-800 text-white h-[90vh] overflow-y-auto rounded-t-2xl"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-white text-xl font-bold">Tagesabschluss</SheetTitle>
        </SheetHeader>

        {/* Tab Switch */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('closing')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'closing' ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            Heute abschließen
          </button>
          <button
            onClick={() => setView('history')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'history' ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-400'
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
                <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
                  <p className="text-zinc-400 text-xs uppercase tracking-wider">Tagesübersicht</p>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-300">Gesamtumsatz</span>
                    <span className="text-white font-bold text-lg">
                      {formatEur(summary.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Online bezahlt</span>
                    <span className="text-zinc-300 text-sm">{formatEur(summary.onlineRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Bestellungen</span>
                    <span className="text-zinc-300 text-sm">{summary.orderCount}</span>
                  </div>
                  <div className="border-t border-zinc-700 pt-3 flex justify-between items-center">
                    <span className="text-zinc-300 font-medium">Erwartete Kasse</span>
                    <span className="text-amber-400 font-bold text-lg">
                      {formatEur(summary.expectedCash)}
                    </span>
                  </div>
                </div>

                {/* X-Bericht Button */}
                <button
                  onClick={handleXReport}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-sm font-medium transition-colors border border-zinc-700"
                >
                  <FileText className="w-4 h-4" />
                  X-Bericht (Zwischenstand)
                </button>

                {/* Kassensturz */}
                <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
                  <p className="text-zinc-400 text-xs uppercase tracking-wider">Kassensturz</p>
                  <div>
                    <label className="text-zinc-300 text-sm block mb-2">
                      Tatsächlicher Kassenstand (€)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      className="bg-zinc-700 border-zinc-600 text-white text-lg h-12"
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
                <div className="bg-zinc-800 rounded-xl p-4">
                  <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-2">
                    Notiz (optional)
                  </label>
                  <Input
                    placeholder="z.B. Lieferung noch nicht verbucht..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                </div>

                {/* Speichern-Button */}
                {!saved ? (
                  <Button
                    onClick={handleSave}
                    disabled={saving || actualCash === ''}
                    className="w-full h-14 bg-amber-400 hover:bg-amber-300 text-black font-bold text-base"
                  >
                    {saving ? 'Wird gespeichert...' : '✓ Tagesabschluss speichern'}
                  </Button>
                ) : (
                  <div className="w-full h-14 bg-green-900/30 text-green-400 rounded-lg flex items-center justify-center font-medium">
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
                <div key={closing.id} className="bg-zinc-800 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-zinc-300 font-medium">
                      {new Date(closing.closing_date).toLocaleDateString('de-DE', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                    <span className="text-white font-bold">{formatEur(closing.total_revenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">{closing.order_count} Bestellungen</span>
                    {closing.cash_difference !== null && (
                      <span
                        className={`font-medium ${
                          Math.abs(closing.cash_difference) < 0.01
                            ? 'text-green-400'
                            : closing.cash_difference > 0
                            ? 'text-blue-400'
                            : 'text-red-400'
                        }`}
                      >
                        {closing.cash_difference > 0 ? '+' : ''}
                        {formatEur(closing.cash_difference)}
                      </span>
                    )}
                  </div>
                  {closing.notes && (
                    <p className="text-zinc-500 text-xs mt-2 truncate">{closing.notes}</p>
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
                    className="mt-2 flex items-center gap-1 text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Herunterladen
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* X-Bericht Modal */}
        {showXReport && xReportContent && (
          <div className="fixed inset-0 z-[60] bg-black/80 flex items-end justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <span className="text-white font-bold text-sm">X-Bericht</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printReport(xReportContent, 'X-Bericht')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Drucken
                  </button>
                  <button
                    onClick={() => downloadReport(xReportContent, `X-Bericht_${summary?.date?.replace(/-/g,'')}.txt`)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Speichern
                  </button>
                  <button
                    onClick={() => setShowXReport(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-700 text-zinc-400 hover:text-white transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>
              <pre className="flex-1 overflow-y-auto px-4 py-3 text-zinc-300 text-xs font-mono leading-relaxed whitespace-pre">
                {xReportContent}
              </pre>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
