import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function Pagination({ currentPage, totalPages, onPreviousPage, onNextPage, isLoading }) {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination-wrap">
      <button
        type="button"
        className="pagination-button"
        onClick={onPreviousPage}
        disabled={currentPage === 1 || isLoading}
        aria-label="Previous page"
      >
        <FiChevronLeft size={16} aria-hidden="true" />
        Previous
      </button>

      <span className="pagination-info" aria-live="polite">
        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
      </span>

      <button
        type="button"
        className="pagination-button"
        onClick={onNextPage}
        disabled={currentPage >= totalPages || isLoading}
        aria-label="Next page"
      >
        Next
        <FiChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export default Pagination;
