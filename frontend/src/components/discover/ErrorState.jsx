import { FiAlertCircle } from 'react-icons/fi';

function ErrorState({ error, onRetry }) {
  return (
    <div className="discover-state-wrap error-state">
      <div className="error-icon" aria-hidden="true">
        <FiAlertCircle size={32} />
      </div>
      <h3>Something went wrong</h3>
      <p>{error || 'Unable to load books. Please try again.'}</p>
      {onRetry && (
        <button type="button" className="button button-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
