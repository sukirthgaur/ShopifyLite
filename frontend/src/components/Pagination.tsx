import type { PaginationMeta } from '../types';

/**
 * Pagination Component Properties Interface
 */
interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

/**
 * Shared Pagination Controls Component
 * Provides "Next" and "Previous" buttons alongside state labels.
 */
const Pagination = ({ pagination, onPageChange }: PaginationProps) => {
  const { page, totalPages, total } = pagination;

  // Render nothing if there is only 1 page
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4">
      {/* Total count display */}
      <p className="text-sm text-gray-600">
        Showing <span className="font-medium">{total}</span> total results
      </p>
      
      {/* Control buttons */}
      <div className="flex items-center gap-3">
        {/* Previous page trigger */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
        >
          Previous
        </button>
        
        {/* Active page indices info */}
        <span className="text-sm text-gray-600">
          Page <span className="font-medium">{page}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
        </span>
        
        {/* Next page trigger */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
