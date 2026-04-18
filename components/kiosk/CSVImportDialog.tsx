'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, X, Download } from 'lucide-react'
import { useCSVImport } from '@/hooks/use-csv-import'
import { toast } from 'sonner'

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

const CSV_TEMPLATE = `name,price,sale_price,category,ean,supplier,available
Red Bull 250ml,1.99,,Getränke,9002490100070,Metro,1
Marlboro Gold 20er,8.50,7.99,Tabak,,Lekkerland,1
Lays Paprika 150g,1.79,,Snacks,,Metro,1
`

export function CSVImportDialog({ open, onOpenChange, onImportComplete }: CSVImportDialogProps) {
  const { importCSV, importing, result, reset } = useCSVImport()
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleClose = () => {
    reset()
    setSelectedFile(null)
    onOpenChange(false)
  }

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Nur CSV-Dateien erlaubt')
      return
    }
    setSelectedFile(file)
    reset()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    if (!selectedFile) return
    const importResult = await importCSV(selectedFile)
    if (importResult.success > 0) {
      toast.success(`${importResult.success} Produkte importiert`)
      onImportComplete()
    }
    if (importResult.errors.length > 0) {
      toast.error(`${importResult.errors.length} Fehler beim Import`)
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'kioskos-produkte-vorlage.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border rounded-t-2xl md:left-64"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-border z-10">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-black font-bold text-base">CSV-Import</h2>
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4 pb-8">
          {/* Template Download */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-border">
            <div>
              <p className="text-black text-sm font-medium">Vorlage herunterladen</p>
              <p className="text-gray-500 text-xs mt-0.5">CSV-Vorlage mit allen Spalten</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              Vorlage
            </button>
          </div>

          {/* Spalten-Info */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-blue-800 text-xs font-semibold mb-2">Unterstützte Spalten</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                ['name / produktname', 'Pflicht'],
                ['price / preis', 'Pflicht'],
                ['sale_price / sonderpreis', 'Optional'],
                ['category / kategorie', 'Optional'],
                ['ean / barcode', 'Optional'],
                ['supplier / lieferant', 'Optional'],
                ['available / verfuegbar', 'Optional (1/0)'],
              ].map(([col, type]) => (
                <div key={col} className="flex items-center gap-1">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      type === 'Pflicht' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {type}
                  </span>
                  <span className="text-blue-700 text-xs font-mono">{col}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-red-400 bg-red-50'
                : selectedFile
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-green-500" />
                <p className="text-green-700 font-medium text-sm">{selectedFile.name}</p>
                <p className="text-green-600 text-xs">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-gray-600 text-sm font-medium">CSV-Datei hier ablegen</p>
                <p className="text-gray-400 text-xs">oder klicken zum Auswählen</p>
              </div>
            )}
          </div>

          {/* Import-Ergebnis */}
          {result && (
            <div className="space-y-3">
              {result.success > 0 && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-green-800 font-medium text-sm">
                      {result.success} Produkte erfolgreich importiert
                    </p>
                  </div>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-red-800 font-medium text-sm">{result.errors.length} Fehler</p>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-red-600 text-xs font-mono">
                        Zeile {err.row}: {err.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Button */}
          {!result && (
            <button
              onClick={handleImport}
              disabled={!selectedFile || importing}
              className="w-full h-14 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors"
            >
              {importing ? 'Wird importiert...' : 'Jetzt importieren'}
            </button>
          )}

          {result && result.success > 0 && (
            <button
              onClick={handleClose}
              className="w-full h-14 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm transition-colors"
            >
              ✓ Fertig
            </button>
          )}

          {result && result.success === 0 && (
            <button
              onClick={() => {
                reset()
                setSelectedFile(null)
              }}
              className="w-full h-14 bg-gray-100 hover:bg-gray-200 text-black font-bold rounded-xl text-sm transition-colors"
            >
              Nochmal versuchen
            </button>
          )}
        </div>
      </div>
    </>
  )
}
