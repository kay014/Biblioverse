import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FiBookmark } from 'react-icons/fi';

const statusLabels = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  finished: 'Finished',
};

const getFallbackInitial = (title) => {
  const meaningfulCharacter = [...title].find((character) => /[\p{L}\p{N}]/u.test(character));
  return meaningfulCharacter?.toUpperCase() || 'B';
};

function BookCard({ book, isSaved = false, isSaving = false, onSave, onCoverError, status }) {
  const location = useLocation();
  const bookId = book?._id || book?.id;
  const rawTitle = typeof book?.title === 'string' ? book.title.trim() : '';
  const title = rawTitle || 'Untitled';
  const author = Array.isArray(book?.authors) && book.authors.length ? book.authors.join(', ') : 'Unknown Author';
  const rating = Number(book?.averageRating ?? 0);
  const image = book?.coverImage || book?.image || null;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  return (
    <article className="featured-book-card">
      <Link
        to={bookId ? `/books/${bookId}` : '/discover'}
        state={{ from: `${location.pathname}${location.search}` }}
        aria-label={`View details for ${title}`}
      >
        <div className="featured-book-cover-wrap">
          {image && !imageFailed ? (
            <img
              src={image}
              alt={title}
              className="featured-book-cover"
              loading="lazy"
              onError={() => {
                setImageFailed(true);
                onCoverError?.(bookId);
              }}
            />
          ) : (
            <div className="featured-book-placeholder" aria-hidden="true">
              <span>{rawTitle ? getFallbackInitial(rawTitle) : 'B'}</span>
            </div>
          )}
        </div>
        <div className="featured-book-meta">
          <p className="featured-book-title">{title}</p>
          <p className="featured-book-author">{author}</p>
          {statusLabels[status] && (
            <span className={`book-status-badge status-${status}`}>
              {statusLabels[status]}
            </span>
          )}
          <div className="featured-book-rating" aria-label={`Rated ${rating} out of 5`}>
            <span>★</span>
            <span>{rating ? rating.toFixed(1) : 'New'}</span>
          </div>
        </div>
      </Link>
      {onSave && bookId && (
        <button
          type="button"
          className={`book-save-button${isSaved ? ' is-saved' : ''}`}
          onClick={() => onSave(book)}
          disabled={isSaving}
          aria-label={isSaved ? `Remove ${title} from your library` : `Save ${title} to your library`}
          title={isSaved ? 'Remove from library' : 'Save to library'}
        >
          <FiBookmark size={18} aria-hidden="true" />
          <span>{isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save'}</span>
        </button>
      )}
    </article>
  );
}

export default BookCard;
