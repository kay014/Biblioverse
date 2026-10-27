import { useEffect, useState } from 'react';
import { FiAlertCircle, FiMessageSquare, FiRefreshCw, FiStar } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../services/api';
import LoadingState from '../components/discover/LoadingState';

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getFallbackInitial = (title) => {
  const meaningfulCharacter = [...title].find((character) => /[\p{L}\p{N}]/u.test(character));
  return meaningfulCharacter?.toUpperCase() || 'B';
};

function CommunityReviewCard({ review }) {
  const book = review.book;
  const title = book?.title || 'Untitled book';
  const bookId = book?._id || book?.id;
  const cover = book?.coverImage || book?.image || null;
  const [coverFailed, setCoverFailed] = useState(false);
  const reviewer = review?.user?.name || 'Reader';
  const reviewDate = formatDate(review?.createdAt);

  return (
    <article className="community-review-card">
      <div className="community-review-book">
        <Link to={bookId ? `/books/${bookId}` : '/discover'} aria-label={`Open details for ${title}`}>
          {cover && !coverFailed ? (
            <img
              src={cover}
              alt={title}
              className="community-review-cover"
              loading="lazy"
              onError={() => setCoverFailed(true)}
            />
          ) : (
            <div className="community-review-cover-fallback" aria-label={`Cover unavailable for ${title}`}>
              <span aria-hidden="true">{getFallbackInitial(title)}</span>
            </div>
          )}
        </Link>
        <div>
          <p className="eyebrow">Reader note</p>
          <h2><Link to={bookId ? `/books/${bookId}` : '/discover'} state={{ from: '/community' }}>{title}</Link></h2>
          {Array.isArray(book?.authors) && book.authors.length > 0 && (
            <p className="community-review-author">by {book.authors.join(', ')}</p>
          )}
        </div>
      </div>

      <div className="community-review-meta">
        <span className="community-reviewer">{reviewer}</span>
        <span className="community-review-date">{reviewDate || 'Recently'}</span>
        <span className="community-review-rating" aria-label={`${review.rating} out of 5 stars`}>
          <FiStar size={14} />
          {review.rating}/5
        </span>
      </div>

      {review.comment ? (
        <p className="community-review-comment">&ldquo;{review.comment}&rdquo;</p>
      ) : (
        <p className="community-review-comment community-review-no-comment">A reader left a rating for this book.</p>
      )}
    </article>
  );
}

function CommunityPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchCommunityReviews = async () => {
      try {
        setLoading(true);
        setError('');

        const booksResponse = await api.get('/api/books/discover', {
          params: { page: 1, limit: 12, sort: 'newest' },
        });
        const books = Array.isArray(booksResponse?.data?.data) ? booksResponse.data.data : [];

        const reviewResults = await Promise.allSettled(
          books
            .filter((book) => book?._id)
            .map(async (book) => {
              const response = await api.get(`/api/books/${book._id}/reviews`);
              const bookReviews = Array.isArray(response?.data?.data) ? response.data.data : [];
              return bookReviews.map((review) => ({ ...review, book }));
            }),
        );

        if (!active) return;

        const nextReviews = reviewResults
          .filter((result) => result.status === 'fulfilled')
          .flatMap((result) => result.value)
          .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

        setReviews(nextReviews);
      } catch (err) {
        if (active) {
          setReviews([]);
          setError('We could not load reader notes right now. Please try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCommunityReviews();

    return () => {
      active = false;
    };
  }, [retryKey]);

  return (
    <div className="page-shell container community-page">
      <section className="community-header">
        <p className="eyebrow">Community</p>
        <h1>What readers are saying</h1>
        <p>Discover real reader notes from the books on Biblioverse.</p>
      </section>

      {loading && <LoadingState />}

      {!loading && error && (
        <div className="community-state" role="alert">
          <FiAlertCircle size={30} aria-hidden="true" />
          <p className="eyebrow">A quiet interruption</p>
          <h2>The reading room is temporarily unavailable.</h2>
          <p>{error}</p>
          <button type="button" className="button button-secondary" onClick={() => setRetryKey((key) => key + 1)}>
            <FiRefreshCw size={15} />
            Try again
          </button>
        </div>
      )}

      {!loading && !error && reviews.length === 0 && (
        <div className="community-state">
          <FiMessageSquare size={30} aria-hidden="true" />
          <p className="eyebrow">The conversation is just beginning</p>
          <h2>No reader notes yet.</h2>
          <p>Open a book, leave a review, and add your voice to the reading room.</p>
          <Link to="/discover" className="button button-primary">Discover Books</Link>
        </div>
      )}

      {!loading && !error && reviews.length > 0 && (
        <section className="community-feed" aria-labelledby="community-feed-heading">
          <div className="community-feed-heading">
            <div>
              <p className="eyebrow">Reader reflections</p>
              <h2 id="community-feed-heading">Notes from the shelf</h2>
            </div>
            <span>{reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
          </div>
          <div className="community-review-list">
            {reviews.map((review) => (
              <CommunityReviewCard key={`${review._id}-${review.book?._id}`} review={review} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default CommunityPage;
