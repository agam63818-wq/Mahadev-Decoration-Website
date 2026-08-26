'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  renderRow: (row: T) => React.ReactNode[]
  sortKey?: string
  onSort?: (key: string) => void
  loading?: boolean
}

export function DataTable<T>({
  columns,
  data,
  renderRow,
  loading = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey]
      const bVal = (b as Record<string, unknown>)[sortKey]
      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      return typeof aVal === 'string'
        ? sortDir === 'asc'
          ? aVal.localeCompare(bVal as string)
          : bVal.localeCompare(aVal as string)
        : sortDir === 'asc'
        ? (Number(aVal) - Number(bVal))
        : (Number(bVal) - Number(aVal))
    })
  }, [data, sortKey, sortDir])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (loading) {
    return <Card variant="outline" className="p-8 text-center">लोड हो रहा है...</Card>
  }

  if (data.length === 0) {
    return (
      <Card variant="outline" className="p-8 text-center">
        <p className="text-text-muted text-sm font-devanagari">कोई डेटा नहीं मिला।</p>
      </Card>
    )
  }

  return (
    <Card variant="outline" className="overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gold/10 bg-bg-void/30">
        <div className="flex items-center gap-2 text-sm text-text-muted font-devanagari">
          <span>{data.length} रिकॉर्ड</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={() => {}}
          >
            <Download size={14} /> CSV
          </Button>
        </div>
        <div className="flex gap-1">
          <button className="p-1.5 rounded hover:bg-gold/10 text-text-muted hover:text-gold transition-colors">
            <ChevronUp size={14} />
          </button>
          <button className="p-1.5 rounded hover:bg-gold/10 text-text-muted hover:text-gold transition-colors">
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold/10 bg-bg-void/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left py-3 px-4 text-text-muted font-devanagari text-xs font-medium ${
                    col.className ?? ''
                  } ${col.sortable ? 'cursor-pointer hover:text-gold transition-colors' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-gold">
                        {sortDir === 'asc' ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gold/5">
            {sorted.map((row, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                {renderRow(row)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
