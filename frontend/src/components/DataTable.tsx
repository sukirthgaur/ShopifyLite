import { type ReactNode } from 'react';
import Loader from './Loader';

/**
 * Data Table Column Definition Interface
 */
interface Column<T> {
  // Label printed inside table header `<th>` cell
  header: string;
  
  // Either a property key matching keys in row entity `T`,
  // or a custom mapper callback returning a custom node layout (e.g. badges, buttons)
  accessor: keyof T | ((row: T) => ReactNode);
  
  // Optional style selectors
  className?: string;
}

/**
 * Data Table Properties Interface
 */
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * Shared Generic Reusable Data Table Component
 * Renders lists of entities in a clean, responsive layout.
 * Supports loading states and custom placeholders.
 */
function DataTable<T extends { id?: string }>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  // 1. Show spinner placeholder if data is loading
  if (isLoading) return <Loader />;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.length === 0 ? (
            // 2. Render centered text message if no items are returned
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            // 3. Render table rows
            data.map((row, rowIndex) => (
              <tr
                key={(row as Record<string, unknown>).id as string || rowIndex}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-6 py-4 text-sm text-gray-700 ${col.className || ''}`}
                  >
                    {/* Evaluate if accessor is a rendering callback or directly targets property key */}
                    {typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : (row[col.accessor] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
