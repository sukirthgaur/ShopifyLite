import type { PaginationMeta } from '../types';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

const Pagination = ({ pagination, onPageChange }: PaginationProps) => {
  const { page, totalPages, total } = pagination;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <p className="text-sm text-gray-600">
        Showing <span className="font-medium">{total}</span> total results
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page <span className="font-medium">{page}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
