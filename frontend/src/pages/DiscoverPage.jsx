import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/discover/SearchBar';
import BookGrid from '../components/discover/BookGrid';
import LoadingState from '../components/discover/LoadingState';
import EmptyState from '../components/discover/EmptyState';
import ErrorState from '../components/discover/ErrorState';
import Pagination from '../components/discover/Pagination';

function DiscoverPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedBookIds, setSavedBookIds] = useState(new Set());
  const [savingBookId, setSavingBookId] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const query = searchParams.get('q') || '';
  const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  // Update currentPage when URL changes
  useEffect(() => {
    setCurrentPage(page);
  }, [page]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError(null);

        const endpoint = query.trim() ? '/api/books/search' : '/api/books/discover';
        const params = query.trim()
          ? { q: query.trim() }
          : { page, limit: 12, sort: 'rating' };
        const response = await api.get(endpoint, { params });

        const data = response?.data?.data || [];
        setBooks(Array.isArray(data) ? data : []);
        setTotalPages(response?.data?.pagination?.totalPages || 1);
      } catch (err) {
        setBooks([]);
        
        console.error('Search error:', err);
        
        if (err.response?.status === 400) {
          setError('Please enter a search term');
        } else if (err.response?.status === 502) {
          setError('Unable to fetch books from external source. Please try again.');
        } else if (err.response?.status === 401) {
          setError('You must be logged in to search');
        } else if (err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND') {
          setError('Cannot connect to the server. Please check your connection.');
        } else if (err.message?.includes('Network')) {
          setError('Network error. Please check your connection.');
        } else {
          setError('Unable to load books. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [query, page, refreshKey]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedBookIds(new Set());
      return;
    }

    let active = true;
    api.get('/api/books/saved')
      .then((response) => {
        if (active) {
          const savedBooks = Array.isArray(response?.data?.data) ? response.data.data : [];
          setSavedBookIds(new Set(savedBooks.map((book) => book?._id).filter(Boolean)));
        }
      })
      .catch(() => {
        if (active) setSavedBookIds(new Set());
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const handleSearch = (searchQuery) => {
    setCurrentPage(1);
    setSearchParams({ q: searchQuery });
  };

  const handleClearSearch = () => {
    setError(null);
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleNextPage = () => {
    if (query) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    setSearchParams({ page: String(nextPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (query) return;
    const prevPage = Math.max(1, currentPage - 1);
    setCurrentPage(prevPage);
    setSearchParams(prevPage === 1 ? {} : { page: String(prevPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    setRefreshKey((key) => key + 1);
  };

  const handleSave = async (book) => {
    const bookId = book?._id;
    if (!bookId || savingBookId) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const isSaved = savedBookIds.has(bookId);
    setSavingBookId(bookId);
    setSaveError(null);
    try {
      if (isSaved) {
        await api.delete(`/api/books/${bookId}/save`);
        setSavedBookIds((ids) => {
          const nextIds = new Set(ids);
          nextIds.delete(bookId);
          return nextIds;
        });
      } else {
        await api.post(`/api/books/${bookId}/save`);
        setSavedBookIds((ids) => new Set(ids).add(bookId));
      }
    } catch (err) {
      console.error('Book save update failed:', err);
      setSaveError('Your library could not be updated. Please try again.');
    } finally {
      setSavingBookId(null);
    }
  };

  return (
    <div className="page-shell">
      <section className="discover-hero container">
        <div className="discover-header">
          <p className="eyebrow">Discover Stories</p>
          <h1>Find Your Next Story</h1>
          <p className="discover-lede">
            Search by title, author, or keyword to discover new worlds and unforgettable characters.
          </p>
        </div>

        <SearchBar initialQuery={query} onSearch={handleSearch} onClear={handleClearSearch} isLoading={loading} />
      </section>

      <section className="discover-results container">
        {saveError && <p className="save-error" role="alert">{saveError}</p>}
        {loading && <LoadingState />}
        {error && !loading && <ErrorState error={error} onRetry={handleRetry} />}
        {!loading && !error && books.length === 0 && (
          <EmptyState query={query} onReset={query ? handleClearSearch : null} />
        )}
        {!loading && !error && books.length > 0 && (
          <>
            <div className="results-meta">
              <p>
                {query ? <>Found <strong>{books.length}</strong> book{books.length !== 1 ? 's' : ''} for "{query}"</> : <>A shelf of <strong>{books.length}</strong> books to explore</>}
              </p>
            </div>
            <BookGrid books={books} savedBookIds={savedBookIds} savingBookId={savingBookId} onSave={handleSave} />
            {!query && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onNextPage={handleNextPage}
                onPreviousPage={handlePreviousPage}
                isLoading={loading}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default DiscoverPage;
