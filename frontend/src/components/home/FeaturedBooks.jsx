import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import BookCard from '../books/BookCard';

const getBookKey = (book) => book?._id || book?.id || book?.sourceId || book?.title;
const getCoverUrl = (book) => book?.coverImage || book?.image || null;

const explicitCurriculumPattern = /\b(?:cbse|ncert|icse|state[- ]?board|textbook|text book|workbook|work book|syllabus|curriculum|question bank|school exam|school textbook|study guide|exam preparation|exam prep|practice paper|sample paper)\b/i;
const classOrGradePattern = /\b(?:class|grade|standard|std\.?)\s*(?:[1-9]|1[0-2]|i{1,3}|iv|v|vi|vii|viii|ix|x|xi|xii)\b/i;
const schoolStudyPattern = /\b(?:school|student|students)\b.{0,32}\b(?:exam|study|subject|book|guide|practice)\b|\b(?:exam|study|subject|book|guide|practice)\b.{0,32}\b(?:school|student|students)\b/i;

const isSchoolCurriculumBook = (book) => {
  const metadata = [
    book?.title,
    book?.description,
    ...(Array.isArray(book?.categories) ? book.categories : []),
    ...(Array.isArray(book?.authors) ? book.authors : []),
  ]
    .filter((value) => typeof value === 'string')
    .join(' ');

  if (explicitCurriculumPattern.test(metadata) || classOrGradePattern.test(metadata)) {
    return true;
  }

  return schoolStudyPattern.test(metadata) && /\b(?:exam|study|subject|book|guide|practice)\b/i.test(metadata);
};

function FeaturedBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [failedCoverIds, setFailedCoverIds] = useState(new Set());

  useEffect(() => {
    let active = true;

    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/api/books/discover?limit=50');
        const items = response?.data?.data || [];

        if (active) {
          setBooks(items);
        }
      } catch (err) {
        if (active) {
          setError('Unable to load featured books right now.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchBooks();

    return () => {
      active = false;
    };
  }, []);

  const featuredBooks = useMemo(
    () => books
      .filter((book) => !isSchoolCurriculumBook(book))
      .filter((book) => {
        const coverUrl = getCoverUrl(book);
        return typeof coverUrl === 'string' && coverUrl.trim() && !failedCoverIds.has(getBookKey(book));
      })
      .slice(0, 12),
    [books, failedCoverIds],
  );

  const handleCoverError = (bookId) => {
    setFailedCoverIds((currentIds) => {
      if (currentIds.has(bookId)) return currentIds;
      return new Set(currentIds).add(bookId);
    });
  };

  return (
    <section className="featured-books-section container">
      <div className="section-header">
        <div>
          <p className="eyebrow">Hand Picked</p>
          <h2>Featured Books</h2>
        </div>
        <Link to="/discover" className="view-all-link">
          View all <span aria-hidden="true">→</span>
        </Link>
      </div>

      {loading ? (
        <div className="section-state">Loading featured books…</div>
      ) : error ? (
        <div className="section-state error-state">{error}</div>
      ) : featuredBooks.length === 0 ? (
        <div className="section-state empty-state">No featured books available right now.</div>
      ) : (
        <div className="featured-books-grid">
          {featuredBooks.map((book) => (
            <BookCard
              key={getBookKey(book)}
              book={book}
              onCoverError={handleCoverError}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default FeaturedBooks;
