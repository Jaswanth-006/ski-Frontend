import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  /** Numeric columns are right-aligned and use tabular display figures. */
  numeric?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  getRowKey: (row: T, index: number) => string | number
  /** One cell per column; rendered as a bold totals row. */
  footer?: ReactNode[]
  className?: string
}

export function DataTable<T>({ columns, data, getRowKey, footer, className }: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'text-[11px] uppercase tracking-[.05em] text-muted font-semibold bg-surface border-b border-line px-[18px] py-3',
                  col.numeric ? 'text-right' : 'text-left',
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={getRowKey(row, i)} className="hover:bg-surface/60">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'text-[13px] px-[18px] py-3 border-b border-line',
                    col.numeric ? 'text-right num font-display font-semibold' : 'text-left',
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer ? (
          <tfoot>
            <tr>
              {footer.map((cell, i) => (
                <td
                  key={columns[i]?.key ?? i}
                  className={cn(
                    'font-display font-extrabold text-ink bg-surface border-t border-line px-[18px] py-3',
                    columns[i]?.numeric ? 'text-right num' : 'text-left',
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  )
}
