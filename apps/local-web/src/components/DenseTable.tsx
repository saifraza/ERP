import React from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  width?: string
  sortable?: boolean
  render?: (item: T, index: number) => React.ReactNode
  className?: string
}

interface DenseTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T, index: number) => void
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  selectedRows?: string[]
  onSelectRow?: (id: string) => void
  onSelectAll?: (selected: boolean) => void
  loading?: boolean
  emptyMessage?: string
  rowKey: (item: T) => string
  stickyHeader?: boolean
  className?: string
  rowActions?: (item: T) => React.ReactNode
}

export default function DenseTable<T>({
  data,
  columns,
  onRowClick,
  onSort,
  sortKey,
  sortDirection,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  loading,
  emptyMessage = 'No data found',
  rowKey,
  stickyHeader = true,
  className = '',
  rowActions
}: DenseTableProps<T>) {
  const allSelected = data.length > 0 && data.every(item => selectedRows.includes(rowKey(item)))
  const someSelected = data.some(item => selectedRows.includes(rowKey(item)))

  const handleSort = (key: string) => {
    if (!onSort) return
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(key, newDirection)
  }

  const renderSortIcon = (columnKey: string) => {
    if (!onSort) return null
    
    if (sortKey === columnKey) {
      return sortDirection === 'asc' ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )
    }
    return <ChevronsUpDown className="h-3 w-3 opacity-30" />
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full dense-table">
          <thead className={`bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 ${stickyHeader ? 'sticky-header' : ''}`}>
            <tr>
              {onSelectRow && (
                <th className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
                  } ${column.className || ''}`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {rowActions && (
                <th className="w-20 text-center">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (onSelectRow ? 1 : 0) + (rowActions ? 1 : 0)} 
                  className="text-center py-8 text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const key = rowKey(item)
                const isSelected = selectedRows.includes(key)
                
                return (
                  <tr
                    key={key}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(item, index)}
                  >
                    {onSelectRow && (
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectRow(key)}
                          className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className={column.className || ''}>
                        {column.render ? column.render(item, index) : (item as any)[column.key]}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="row-actions flex items-center justify-center gap-1">
                          {rowActions(item)}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}