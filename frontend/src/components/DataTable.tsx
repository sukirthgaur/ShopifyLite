import { ReactNode } from 'react';
import Loader from './Loader';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}

function DataTable<T extends { id?: string }>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
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
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
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
