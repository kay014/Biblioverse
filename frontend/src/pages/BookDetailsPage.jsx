import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiBookmark, FiEdit2, FiMessageSquare, FiStar, FiTrash2 } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'reading', label: 'Currently Reading' },
  { value: 'finished', label: 'Finished' },
];

const formatAuthors = (book) => {
  if (Array.isArray(book?.authors) && book.authors.length) {
    return book.authors.join(', ');
  }

  if (typeof book?.authors === 'string' && book.authors.trim()) {
    return book.authors.trim();
  }

  if (typeof book?.author === 'string' && book.author.trim()) {
    return book.author.trim();
  }

  return 'Unknown Author';
};

const formatCategories = (book) => {
  if (Array.isArray(book?.categories) && book.categories.length) {
    return book.categories.join(', ');
  }

  if (typeof book?.category === 'string' && book.category.trim()) {
    return book.category.trim();
  }

  return null;
};

const buildCoverUrl = (book) => {
  if (typeof book?.coverImage === 'string' && book.coverImage.trim()) {
    return book.coverImage.trim();
  }

  if (typeof book?.image === 'string' && book.image.trim()) {
    return book.image.trim();
  }

  if (book?.imageLinks) {
    return book.imageLinks.thumbnail || book.imageLinks.small || book.imageLinks.medium || null;
  }

  return null;
};

const formatReadableDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function DeleteReviewConfirmModal({ isOpen, isDeleting, onCancel, onConfirm }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const focusTarget = modalRef.current?.querySelector('[data-focus-target]') || modalRef.current?.querySelector('button');
    focusTarget?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
        );
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="delete-review-modal-backdrop" onClick={onCancel} aria-hidden="false">
      <div
        ref={modalRef}
        className="delete-review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-review-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="delete-review-modal-header">
          <h3 id="delete-review-title">Delete your review?</h3>
        </div>

        <p className="delete-review-modal-copy">
          This will permanently remove your review from this book.
        </p>

        <div className="delete-review-modal-actions">
          <button type="button" className="button button-secondary" onClick={onCancel} data-focus-target>
            Cancel
          </button>
          <button type="button" className="button button-primary" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [readingStatus, setReadingStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: '5', comment: '' });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState('');
  const [deleteReviewModalOpen, setDeleteReviewModalOpen] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);

  const coverUrl = useMemo(() => buildCoverUrl(book), [book]);
  const normalizedUserId = user?._id || user?.id || null;
  const currentUserReview = useMemo(
    () => reviews.find((review) => String(review?.user?._id || review?.user || '') === String(normalizedUserId || '')),
    [reviews, normalizedUserId],
  );

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get(`/api/books/${id}`);
        const nextBook = response?.data?.data || null;
        setBook(nextBook);
        setCoverFailed(false);
      } catch (err) {
        if (err?.response?.status === 404) {
          setError('Book not found');
        } else if (err?.response?.status === 400) {
          setError('This book ID is invalid.');
        } else {
          setError('Unable to load this book right now.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBook();
    }
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;

      try {
        setReviewsLoading(true);
        const response = await api.get(`/api/books/${id}/reviews`);
        setReviews(Array.isArray(response?.data?.data) ? response.data.data : []);
      } catch (err) {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  useEffect(() => {
    const fetchLibraryState = async () => {
      if (!isAuthenticated || !id) {
        setSaved(false);
        setReadingStatus('');
        return;
      }

      try {
        const response = await api.get('/api/books/library');
        const libraryEntries = Array.isArray(response?.data?.data) ? response.data.data : [];
        const match = libraryEntries.find((entry) => {
          const libraryBookId = entry?.book?._id || entry?.book?.id || entry?.bookId;
          return String(libraryBookId) === String(id);
        });

        setSaved(Boolean(match));
        setReadingStatus(match?.status || '');
      } catch (err) {
        setSaved(false);
        setReadingStatus('');
      }
    };

    fetchLibraryState();
  }, [isAuthenticated, id]);

  const refreshLibraryState = async () => {
    if (!isAuthenticated || !id) {
      setSaved(false);
      setReadingStatus('');
      return false;
    }

    try {
      const response = await api.get('/api/books/library');
      const libraryEntries = Array.isArray(response?.data?.data) ? response.data.data : [];
      const match = libraryEntries.find((entry) => {
        const libraryBookId = entry?.book?._id || entry?.book?.id || entry?.bookId;
        return String(libraryBookId) === String(id);
      });

      const nextSaved = Boolean(match);
      setSaved(nextSaved);
      setReadingStatus(match?.status || '');
      return nextSaved;
    } catch (err) {
      setSaved(false);
      setReadingStatus('');
      return false;
    }
  };

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (!id) return;

    setSaving(true);
    try {
      if (saved) {
        await api.delete(`/api/books/${id}/save`);
        setSaved(false);
        setReadingStatus('');
        await refreshLibraryState();
      } else {
        await api.post(`/api/books/${id}/save`);
        setSaved(true);

        const nextSaved = await refreshLibraryState();
        if (nextSaved) {
          setReadingStatus((previousStatus) => previousStatus || 'want_to_read');
        }
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to update your library right now.';
      setReviewNotice(message);
      await refreshLibraryState();
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (event) => {
    const nextStatus = event.target.value;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (!id) return;

    try {
      setStatusSaving(true);
      if (!saved) {
        await api.post(`/api/books/${id}/save`);
        setSaved(true);
      }

      await api.patch(`/api/books/${id}/status`, { status: nextStatus });
      setReadingStatus(nextStatus);
      setReviewNotice('Reading status updated.');
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to update the reading status.';
      setReviewNotice(message);
    } finally {
      setStatusSaving(false);
    }
  };

  const refreshReviews = async () => {
    if (!id) return;

    try {
      const response = await api.get(`/api/books/${id}/reviews`);
      setReviews(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch (err) {
      setReviews([]);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const rating = Number(reviewForm.rating);
    const comment = reviewForm.comment.trim();

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      setReviewNotice('Choose a valid rating between 1 and 5.');
      return;
    }

    if (!comment) {
      setReviewNotice('Please add a short review before submitting.');
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewNotice('');

      const payload = { rating, comment };
      if (editingReviewId) {
        await api.put(`/api/books/${id}/reviews`, payload);
      } else {
        await api.post(`/api/books/${id}/reviews`, payload);
      }

      setReviewForm({ rating: '5', comment: '' });
      setEditingReviewId(null);
      await refreshReviews();
      setReviewNotice(editingReviewId ? 'Review updated.' : 'Review posted.');
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to save your review right now.';
      setReviewNotice(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!currentUserReview?._id) return;

    setDeletingReview(true);

    try {
      await api.delete(`/api/books/${id}/reviews`);
      setDeleteReviewModalOpen(false);
      setEditingReviewId(null);
      setReviewForm({ rating: '5', comment: '' });
      await refreshReviews();
      setReviewNotice('Review deleted.');
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to delete your review.';
      setReviewNotice(message);
    } finally {
      setDeletingReview(false);
    }
  };

  const authorText = formatAuthors(book);
  const categoriesText = formatCategories(book);
  const description = book?.description || book?.summary || '';
  const ratingValue = Number(book?.averageRating ?? 0);
  const reviewCount = Number(book?.ratingsCount ?? 0);

  if (loading) {
    return (
      <div className="page-shell container">
        <div className="book-details-skeleton" aria-live="polite">
          <div className="book-details-hero skeleton-block" />
          <div className="book-details-copy">
            <div className="skeleton-line long" />
            <div className="skeleton-line medium" />
            <div className="skeleton-line short" />
            <div className="skeleton-line full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="page-shell container">
        <div className="book-details-empty">
          <p className="eyebrow">Book Details</p>
          <h2>{error === 'Book not found' ? 'Book Not Found' : 'Something went wrong'}</h2>
          <p>
            {error === 'Book not found'
              ? "The story you're looking for could not be found."
              : 'We could not load this book right now.'}
          </p>
          <div className="book-details-actions">
            <Link to="/discover" className="button button-primary">
              <FiArrowLeft size={15} />
              Back to Discover
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell container">
      <div className="book-details-topbar">
        <Link to={location.state?.from || '/discover'} className="back-link">
          <FiArrowLeft size={16} />
          Back to Discover
        </Link>
      </div>

      <article className="book-details-hero">
        <div className="book-detail-cover-card">
          {coverUrl && !coverFailed ? (
            <div className="book-detail-cover-wrap">
              <img
                src={coverUrl}
                alt={book.title || 'Book cover'}
                className="book-detail-cover"
                onError={() => setCoverFailed(true)}
              />
            </div>
          ) : (
            <div className="book-detail-cover-fallback" aria-label={`No cover available for ${book.title || 'this book'}`}>
              <span>{(book.title || 'B').slice(0, 1).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="book-details-copy">
          <p className="eyebrow">Book Details</p>
          <h1 className="book-detail-title">{book.title || 'Untitled Book'}</h1>
          <p className="book-detail-author">by {authorText}</p>

          <div className="book-detail-meta-row">
            {ratingValue > 0 && (
              <div className="book-detail-stat" aria-label={`Rated ${ratingValue} out of 5`}>
                <FiStar size={16} />
                <span>{ratingValue.toFixed(1)}</span>
                <small>{reviewCount} ratings</small>
              </div>
            )}

            {book?.publishedDate && (
              <div className="book-detail-stat">
                <span>{book.publishedDate}</span>
              </div>
            )}

            {book?.pageCount && (
              <div className="book-detail-stat">
                <span>{book.pageCount} pages</span>
              </div>
            )}
          </div>

          {categoriesText && (
            <div className="book-detail-tags">
              {categoriesText.split(',').map((category) => (
                <span key={category.trim()}>{category.trim()}</span>
              ))}
            </div>
          )}

          <div className="book-detail-actions">
            <button type="button" className="button button-primary" onClick={handleSaveToggle} disabled={saving}>
              <FiBookmark size={15} />
              {saving ? 'Saving...' : saved ? 'Saved to Library' : 'Save to Library'}
            </button>

            <div className="book-detail-status-wrap">
              <label htmlFor="reading-status" className="status-label">
                Reading status
              </label>
              <select
                id="reading-status"
                value={readingStatus || 'want_to_read'}
                onChange={handleStatusChange}
                disabled={statusSaving || !isAuthenticated || !saved}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {!isAuthenticated && (
            <p className="auth-note">
              Sign in to save this title or track your reading journey.
            </p>
          )}
        </div>
      </article>

      <section className="book-detail-section">
        <div className="section-heading narrow">
          <p className="eyebrow">About this book</p>
          <h2>Description</h2>
        </div>

        <div className="detail-copy">
          {description ? (
            <p>{description}</p>
          ) : (
            <p className="empty-detail-copy">No description is available for this title yet.</p>
          )}
        </div>
      </section>

      <section className="book-detail-section">
        <div className="reviews-header">
          <div>
            <p className="eyebrow">Reader reflections</p>
            <h2>Reviews</h2>
          </div>
          <div className="review-summary">
            <FiMessageSquare size={16} />
            <span>{reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
          </div>
        </div>

        {reviewNotice && <p className="review-notice" role="status">{reviewNotice}</p>}

        {!isAuthenticated ? (
          <div className="review-login-box">
            <p>Log in to add or manage your review.</p>
            <Link to="/login" className="button button-secondary">
              Log in
            </Link>
          </div>
        ) : (
          <form className="review-form" onSubmit={handleReviewSubmit}>
            <div className="review-form-header">
              <label htmlFor="review-rating">Your rating</label>
              <select
                id="review-rating"
                value={reviewForm.rating}
                onChange={(event) => setReviewForm((current) => ({ ...current, rating: event.target.value }))}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={String(value)}>{value} star{value === 1 ? '' : 's'}</option>
                ))}
              </select>
            </div>

            <label htmlFor="review-comment">Your review</label>
            <textarea
              id="review-comment"
              rows="5"
              value={reviewForm.comment}
              maxLength={500}
              onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
              placeholder="Share what stood out to you..."
            />

            <div className="review-form-actions">
              {editingReviewId && (
                <button type="button" className="button button-secondary" onClick={() => {
                  setEditingReviewId(null);
                  setReviewForm({ rating: '5', comment: '' });
                }}>
                  Cancel
                </button>
              )}
              <button type="submit" className="button button-primary" disabled={submittingReview}>
                {submittingReview ? 'Saving...' : editingReviewId ? 'Update Review' : 'Post Review'}
              </button>
            </div>
          </form>
        )}

        {reviewsLoading ? (
          <div className="review-list review-skeleton">
            <div className="skeleton-line medium" />
            <div className="skeleton-line long" />
            <div className="skeleton-line full" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="review-empty">
            <p>No reviews yet.</p>
            <span>Be the first to share your thoughts.</span>
          </div>
        ) : (
          <div className="review-list">
            {reviews.map((review) => {
              const reviewUserId = review?.user?._id || review?.user || '';
              const isOwnReview = String(reviewUserId) === String(normalizedUserId || '');

              return (
                <div className="review-card" key={review?._id || `${review?.user?._id || 'review'}-${review?.createdAt || Math.random()}`}>
                  <div className="review-card-head">
                    <div>
                      <strong>{review?.user?.name || 'Reader'}</strong>
                      <span>{formatReadableDate(review?.createdAt)}</span>
                    </div>
                    <div className="review-stars" aria-label={`${review?.rating || 0} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <FiStar key={index} size={14} className={index < Number(review?.rating || 0) ? 'star filled' : 'star'} />
                      ))}
                    </div>
                  </div>

                  <p className="review-comment">{review?.comment || 'No review text provided.'}</p>

                  {isOwnReview && (
                    <div className="review-actions">
                      <button
                        type="button"
                        className="mini-action"
                        onClick={() => {
                          setEditingReviewId(review._id);
                          setReviewForm({ rating: String(review.rating || 5), comment: review.comment || '' });
                        }}
                      >
                        <FiEdit2 size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        className="mini-action danger"
                        onClick={() => setDeleteReviewModalOpen(true)}
                      >
                        <FiTrash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <DeleteReviewConfirmModal
        isOpen={deleteReviewModalOpen}
        isDeleting={deletingReview}
        onCancel={() => setDeleteReviewModalOpen(false)}
        onConfirm={handleDeleteReview}
      />
    </div>
  );
}

export default BookDetailsPage;
