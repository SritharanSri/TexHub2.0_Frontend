import { useState } from 'react'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'
import { useSettings } from '../../hooks/useSettings'

export default function DataTable({
  columns,
  data,
  searchable = true,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No records found',
  className = '',
  onRowClick,
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [search, setSearch] = useState('')

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = data.filter(row =>
    !search || columns.some(col => {
      const val = col.accessor ? row[col.accessor] : ''
      return String(val).toLowerCase().includes(search.toLowerCase())
    })
  )

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey]
        const cmp = String(av).localeCompare(String(bv))
        return sortDir === 'asc' ? cmp : -cmp
      })
    : filtered

  const { settings } = useSettings()
  const compactClass = settings.compactView ? 'compact-table' : ''

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${compactClass} ${className}`}>
      {searchable && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            className="flex-1 text-sm text-gray-700 bg-transparent outline-none placeholder-gray-400"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-gray-400 hover:text-gray-600">
              Clear
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`table-header ${col.sortable !== false ? 'cursor-pointer select-none hover:bg-gray-100 transition-colors' : ''}`}
                  onClick={() => col.sortable !== false && col.accessor && toggleSort(col.accessor)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && col.accessor && sortKey === col.accessor && (
                      sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-16 text-gray-400 text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Search className="w-5 h-5 text-gray-300" />
                    </div>
                    {emptyMessage}
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={i}
                  className={`hover:bg-gray-50/80 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map(col => (
                    <td key={col.key} className="table-cell">
                      {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
          <span>Showing {sorted.length} of {data.length} records</span>
        </div>
      )}
    </div>
  )
}
