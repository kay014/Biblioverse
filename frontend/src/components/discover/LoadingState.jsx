function LoadingState() {
  return (
    <div className="discover-state-wrap">
      <div className="skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-image" />
            <div className="skeleton-title" />
            <div className="skeleton-author" />
            <div className="skeleton-rating" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LoadingState;
