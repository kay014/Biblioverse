import { FiSearch } from 'react-icons/fi';

function EmptyState({ query, onReset }) {
  if (query) {
    return (
      <div className="discover-state-wrap empty-state">
        <div className="empty-icon" aria-hidden="true">
          <FiSearch size={32} />
        </div>
        <h3>No Stories Found</h3>
        <p>We couldn't find books matching "{query}".</p>
        <p className="empty-hint">Try another title, author, or keyword.</p>
        {onReset && (
          <button type="button" className="button button-secondary" onClick={onReset}>
            Clear search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="discover-state-wrap initial-state">
      <div className="initial-icon" aria-hidden="true">
        📚
      </div>
      <h3>Discover Your Next Story</h3>
      <p>Search for books by title, author, or keyword to get started.</p>
      <p className="initial-hint">Explore thousands of titles from around the world.</p>
    </div>
  );
}

export default EmptyState;
