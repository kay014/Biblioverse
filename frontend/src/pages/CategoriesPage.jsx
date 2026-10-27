import { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import categories from '../constants/categories';
import BookGrid from '../components/discover/BookGrid';
import LoadingState from '../components/discover/LoadingState';
import Pagination from '../components/discover/Pagination';

const DISPLAY_PAGE_SIZE = 12;
const MAX_DISCOVER_PAGES = 8;
const MAX_SEARCH_QUERIES = 4;

const normalizeText = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const getBookId = (book) => {
  if (!book || typeof book !== 'object') return '';
  return book._id || book.id || book.sourceId || `${book.title || 'book'}-${book.isbn || ''}`;
};

const getMetadataValues = (book) => {
  const values = [];

  const addValue = (value) => {
    if (typeof value === 'string' && value.trim()) {
      values.push(normalizeText(value));
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => addValue(entry));
    }
  };

  addValue(book?.category);
  addValue(book?.categories);
  addValue(book?.genre);
  addValue(book?.genres);
  addValue(book?.subjects);
  addValue(book?.tags);
  addValue(book?.keywords);
  addValue(book?.title);
  addValue(book?.description);
  addValue(book?.authors);

  return values.filter(Boolean);
};

const hasAnyMatch = (book, patterns) => {
  const metadata = getMetadataValues(book);
  return patterns.some((pattern) => metadata.some((value) => value.includes(pattern)));
};

const SCHOOL_PATTERNS = [
  'ncert', 'cbse', 'icse', 'state board', 'state-board', 'board textbook', 'school textbook',
  'textbook', 'workbook', 'question bank', 'exam preparation', 'competitive exam', 'study guide',
  'syllabus', 'reference book', 'curriculum', 'class 1', 'class 2', 'class 3', 'class 4', 'class 5', 'class 6',
  'class 7', 'class 8', 'class 9', 'class 10', 'class 11', 'class 12', 'std 1', 'std 2', 'std 3',
  'std 4', 'std 5', 'std 6', 'std 7', 'std 8', 'std 9', 'std 10', 'std 11', 'std 12'
];

const CATEGORY_RULES = {
  Fiction: {
    positive: [
      'fiction', 'literary fiction', 'general fiction', 'classic fiction', 'contemporary fiction',
      'modern fiction', 'novel', 'novella', 'short stories', 'fictional'
    ],
    negative: [
      'biography', 'autobiography', 'memoir', 'diary', 'journal', 'real life', 'non fiction',
      'history textbook', 'school textbook', 'textbook', 'workbook', 'question bank', 'exam preparation',
      'study guide', 'syllabus', 'reference book', 'curriculum', 'school book'
    ],
  },
  Fantasy: {
    positive: [
      'fantasy', 'fantasy fiction', 'epic fantasy', 'urban fantasy', 'dark fantasy', 'high fantasy',
      'magical realism', 'mythic fantasy', 'fairy tale', 'dragon fantasy', 'wizard fantasy'
    ],
    negative: ['historical fiction'],
  },
  Romance: {
    positive: [
      'romance', 'romantic fiction', 'contemporary romance', 'historical romance', 'regency romance',
      'paranormal romance', 'young adult romance', 'romantic comedy', 'love story', 'romantic suspense'
    ],
    negative: ['mystery', 'horror', 'fantasy', 'biography', 'autobiography', 'textbook'],
  },
  Mystery: {
    positive: [
      'mystery', 'mystery fiction', 'detective fiction', 'detective', 'crime mystery', 'crime',
      'murder mystery', 'thriller mystery', 'mystery thriller', 'police procedural'
    ],
    negative: ['textbook', 'study guide', 'school book', 'biography', 'autobiography', 'memoir'],
  },
  Horror: {
    positive: [
      'horror', 'horror fiction', 'gothic horror', 'gothic fiction', 'supernatural horror',
      'psychological horror', 'dark horror', 'vampire fiction', 'vampire horror', 'ghost story',
      'haunting', 'monster fiction', 'occult fiction'
    ],
    negative: ['romance', 'biography', 'autobiography', 'textbook', 'school book', 'general fiction'],
  },
  History: {
    positive: [
      'history', 'world history', 'indian history', 'ancient history', 'medieval history', 'modern history',
      'historical nonfiction', 'historical non fiction', 'political history', 'social history', 'biography and history'
    ],
    negative: ['historical fiction', 'fictional history', 'novel', 'romance', 'fantasy', 'mystery', 'horror'],
  },
};

const CATEGORY_SEARCH_TERMS = {
  Fiction: ['fiction novels', 'literary fiction', 'classic fiction', 'contemporary fiction'],
  Fantasy: ['fantasy fiction', 'epic fantasy', 'urban fantasy', 'dark fantasy', 'high fantasy'],
  Romance: ['romance novels', 'contemporary romance', 'historical romance', 'romantic fiction', 'paranormal romance'],
  Mystery: ['mystery fiction', 'detective fiction', 'crime mystery', 'murder mystery', 'thriller mystery'],
  History: ['history books', 'world history', 'indian history', 'ancient history', 'medieval history'],
  Horror: ['horror fiction', 'gothic horror', 'supernatural horror', 'psychological horror', 'vampire fiction'],
};

const isSchoolCurriculumBook = (book) => {
  const metadata = getMetadataValues(book).join(' ');
  return SCHOOL_PATTERNS.some((pattern) => metadata.includes(pattern));
};

const isValidCategoryBook = (book, selectedCategory) => {
  if (!book || typeof book !== 'object') return false;

  const metadataValues = getMetadataValues(book);
  const metadataText = metadataValues.join(' ');

  if (!metadataText || isSchoolCurriculumBook(book)) {
    return false;
  }

  const rules = CATEGORY_RULES[selectedCategory];
  if (!rules) return false;

  const explicitPositiveMatch = hasAnyMatch(book, rules.positive);
  const explicitNegativeMatch = hasAnyMatch(book, rules.negative);

  if (selectedCategory === 'History') {
    const historyMatch = explicitPositiveMatch && !explicitNegativeMatch;
    const historicalFictionMatch = metadataText.includes('historical fiction') || metadataText.includes('fictional history');
    return historyMatch && !historicalFictionMatch;
  }

  if (selectedCategory === 'Fiction') {
    const fictionMatch = explicitPositiveMatch && !explicitNegativeMatch;
    if (fictionMatch) return true;

    const secondaryFictionEvidence = metadataText.includes('fiction') || metadataText.includes('novel');
    const hasNonFictionConflict = metadataText.includes('biography') || metadataText.includes('autobiography') || metadataText.includes('memoir') || metadataText.includes('diary');
    return secondaryFictionEvidence && !hasNonFictionConflict && !isSchoolCurriculumBook(book);
  }

  return explicitPositiveMatch && !explicitNegativeMatch;
};

function CategoriesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedBookIds, setSavedBookIds] = useState(new Set());
  const [savingBookId, setSavingBookId] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  const selectedCategory = searchParams.get('category') || '';
  const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const visibleBooks = useMemo(() => {
    const start = (page - 1) * DISPLAY_PAGE_SIZE;
    const end = start + DISPLAY_PAGE_SIZE;
    return books.slice(start, end);
  }, [books, page]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedBookIds(new Set());
      return undefined;
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

  useEffect(() => {
    if (!selectedCategory) {
      setBooks([]);
      setError('');
      setLoading(false);
      setTotalPages(1);
      setTotalBooks(0);
      return undefined;
    }

    let active = true;
    const fetchCategoryBooks = async () => {
      try {
        setLoading(true);
        setError('');

        const validBooks = [];
        const seenIds = new Set();

        const gatherFromDiscover = async () => {
          let currentPage = 1;
          let totalApiPages = 1;

          while (currentPage <= totalApiPages && currentPage <= MAX_DISCOVER_PAGES) {
            const response = await api.get('/api/books/discover', {
              params: { category: selectedCategory, page: currentPage, limit: 40, sort: 'rating' },
            });

            const pageBooks = Array.isArray(response?.data?.data) ? response.data.data : [];
            totalApiPages = Number(response?.data?.pagination?.totalPages || 1);

            if (!pageBooks.length) {
              break;
            }

            for (const candidate of pageBooks) {
              const bookId = getBookId(candidate);
              if (!bookId || seenIds.has(bookId)) continue;
              seenIds.add(bookId);

              if (isValidCategoryBook(candidate, selectedCategory)) {
                validBooks.push(candidate);
              }

              if (validBooks.length >= 10) {
                return;
              }
            }

            if (currentPage >= totalApiPages || validBooks.length >= 10) {
              break;
            }

            currentPage += 1;
          }
        };

        const gatherFromSearch = async () => {
          const searchTerms = CATEGORY_SEARCH_TERMS[selectedCategory] || [selectedCategory];

          for (const term of searchTerms.slice(0, MAX_SEARCH_QUERIES)) {
            if (validBooks.length >= 10) break;

            const response = await api.get('/api/books/search', {
              params: { q: term, limit: 20 },
            });

            const searchBooks = Array.isArray(response?.data?.data) ? response.data.data : [];

            for (const candidate of searchBooks) {
              const bookId = getBookId(candidate);
              if (!bookId || seenIds.has(bookId)) continue;
              seenIds.add(bookId);

              if (isValidCategoryBook(candidate, selectedCategory)) {
                validBooks.push(candidate);
              }

              if (validBooks.length >= 10) {
                break;
              }
            }
          }
        };

        await gatherFromDiscover();

        if (validBooks.length < 10 && active) {
          await gatherFromSearch();
        }

        if (!active) return;

        setBooks(validBooks);
        setTotalBooks(validBooks.length);
        setTotalPages(Math.max(1, Math.ceil(validBooks.length / DISPLAY_PAGE_SIZE)));
      } catch (err) {
        if (!active) return;
        setBooks([]);
        setError('Unable to load this category right now. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCategoryBooks();

    return () => {
      active = false;
    };
  }, [refreshKey, selectedCategory]);

  const handleSelectCategory = (category) => {
    setSearchParams({ category, page: '1' });
  };

  const handleShowAllCategories = () => {
    setSearchParams({});
  };

  const handleSave = async (book) => {
    const bookId = book?._id;
    if (!bookId || savingBookId) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }

    const isSaved = savedBookIds.has(bookId);
    setSavingBookId(bookId);
    setSaveError('');
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
      setSaveError('Your library could not be updated. Please try again.');
    } finally {
      setSavingBookId(null);
    }
  };

  const handleNextPage = () => {
    if (page >= totalPages) return;
    setSearchParams({ category: selectedCategory, page: String(page + 1) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (page <= 1) return;
    setSearchParams({ category: selectedCategory, page: String(page - 1) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-shell container categories-page">
      <section className="categories-page-header">
        <p className="eyebrow">Category Explorer</p>
        <h1>Browse by Category</h1>
        <p>Find your next read by mood, genre, or subject.</p>
      </section>

      {!selectedCategory ? (
        <section aria-labelledby="category-list-heading">
          <div className="categories-page-section-heading">
            <div>
              <p className="eyebrow">Choose a shelf</p>
              <h2 id="category-list-heading">What are you in the mood for?</h2>
            </div>
          </div>
          <div className="category-grid category-explorer-grid">
            {categories.map(({ name, icon: Icon }) => (
              <button type="button" className="category-tile category-explorer-tile" key={name} onClick={() => handleSelectCategory(name)}>
                <div className="category-icon" aria-hidden="true"><Icon size={20} /></div>
                <span>{name}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="category-results" aria-labelledby="category-results-heading">
          <button type="button" className="back-link category-back-link" onClick={handleShowAllCategories}>
            <FiArrowLeft size={16} />
            All categories
          </button>

          <div className="category-results-header">
            <div>
              <p className="eyebrow">Selected category</p>
              <h2 id="category-results-heading">{selectedCategory} Books</h2>
            </div>
            {!loading && !error && books.length > 0 && (
              <p className="category-results-count">{totalBooks} book{totalBooks === 1 ? '' : 's'} on this shelf</p>
            )}
          </div>

          {saveError && <p className="save-error category-save-error" role="alert">{saveError}</p>}

          {loading && <LoadingState />}

          {!loading && error && (
            <div className="library-state category-error-state" role="alert">
              <p className="eyebrow">A quiet interruption</p>
              <h2>This shelf is temporarily unavailable.</h2>
              <p>{error}</p>
              <button type="button" className="button button-primary" onClick={() => setRefreshKey((key) => key + 1)}>
                <FiRefreshCw size={15} />
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && books.length === 0 && (
            <div className="library-state category-empty-state">
              <p className="eyebrow">An unwritten shelf</p>
              <h2>No valid books found in this category yet.</h2>
              <p>Explore the other shelves and see where your next story leads.</p>
              <button type="button" className="button button-primary" onClick={handleShowAllCategories}>
                Explore All Categories
              </button>
            </div>
          )}

          {!loading && !error && books.length > 0 && (
            <>
              {books.length < 10 && (
                <p className="category-results-count" aria-live="polite">
                  Only {books.length} matching books were available in the current dataset.
                </p>
              )}
              <BookGrid books={visibleBooks} savedBookIds={savedBookIds} savingBookId={savingBookId} onSave={handleSave} />
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onNextPage={handleNextPage}
                onPreviousPage={handlePreviousPage}
                isLoading={loading}
              />
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default CategoriesPage;
