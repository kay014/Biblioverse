import { useEffect, useMemo, useState } from 'react';
import { FiBookOpen, FiRefreshCw } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import BookCard from '../components/books/BookCard';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'finished', label: 'Finished' },
];

const statusLabels = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  finished: 'Finished',
};

function LibrarySkeleton() {
  return (
    <div className="library-book-grid" aria-label="Loading your library" aria-busy="true">
      {[1, 2, 3].map((item) => (
        <div className="skeleton-card" key={item}>
          <div className="skeleton-image" />
          <div className="skeleton-title" />
          <div className="skeleton-author" />
          <div className="skeleton-rating" />
        </div>
      ))}
    </div>
  );
}

function LibraryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [libraryEntries, setLibraryEntries] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchLibrary = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/api/books/library');
        const entries = Array.isArray(response?.data?.data) ? response.data.data : [];

        if (active) {
          setLibraryEntries(entries);
        }
      } catch (err) {
        if (!active) return;

        if (err?.response?.status === 401) {
          navigate('/login', { replace: true, state: { from: location } });
          return;
        }

        setLibraryEntries([]);
        setError('We could not open your library right now. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchLibrary();

    return () => {
      active = false;
    };
  }, [location, navigate, retryKey]);

  const filteredEntries = useMemo(
    () => activeFilter === 'all'
      ? libraryEntries
      : libraryEntries.filter((entry) => entry?.status === activeFilter),
    [activeFilter, libraryEntries],
  );

  const handleRetry = () => setRetryKey((key) => key + 1);

  return (
    <div className="page-shell container library-page">
      <section className="library-header">
        <div>
          <p className="eyebrow">My Library</p>
          <h1>Your reading shelf</h1>
          <p className="library-lede">
            Keep track of the books you want to read, are reading, and have finished.
          </p>
        </div>
        {!loading && !error && libraryEntries.length > 0 && (
          <div className="library-count" aria-label={`${libraryEntries.length} books in your library`}>
            <FiBookOpen size={17} />
            <span>{libraryEntries.length} book{libraryEntries.length === 1 ? '' : 's'}</span>
          </div>
        )}
      </section>

      {!loading && !error && libraryEntries.length > 0 && (
        <div className="library-filters" role="tablist" aria-label="Filter your library">
          {FILTERS.map((filter) => {
            const count = filter.value === 'all'
              ? libraryEntries.length
              : libraryEntries.filter((entry) => entry?.status === filter.value).length;

            return (
              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === filter.value}
                className={`library-filter${activeFilter === filter.value ? ' active' : ''}`}
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
                <span>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {loading && <LibrarySkeleton />}

      {!loading && error && (
        <div className="library-state library-error-state" role="alert">
          <p className="eyebrow">A quiet interruption</p>
          <h2>Your shelf is temporarily unavailable.</h2>
          <p>{error}</p>
          <button type="button" className="button button-primary" onClick={handleRetry}>
            <FiRefreshCw size={15} />
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && libraryEntries.length === 0 && (
        <div className="library-state library-empty-state">
          <FiBookOpen className="library-state-icon" size={32} />
          <p className="eyebrow">A shelf waiting to be written</p>
          <h2>Your library is waiting.</h2>
          <p>Save books from Discover and they will gather here for your next reading chapter.</p>
          <Link to="/discover" className="button button-primary">Discover Books</Link>
        </div>
      )}

      {!loading && !error && libraryEntries.length > 0 && filteredEntries.length === 0 && (
        <div className="library-state library-filter-empty-state">
          <p className="eyebrow">Nothing on this shelf yet</p>
          <h2>{statusLabels[activeFilter]} is still ahead.</h2>
          <p>Move a saved book into this part of your reading journey from its details page.</p>
        </div>
      )}

      {!loading && !error && filteredEntries.length > 0 && (
        <div className="library-book-grid">
          {filteredEntries.map((entry) => {
            const bookId = entry?.book?._id || entry?.book?.id;
            if (!entry?.book || !bookId) return null;

            return (
              <BookCard
                key={bookId}
                book={entry.book}
                status={entry.status}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LibraryPage;
