import { FiSearch } from 'react-icons/fi';
import { useEffect, useState } from 'react';

function SearchBar({ onSearch, onClear, isLoading, initialQuery = '' }) {
  const [input, setInput] = useState(initialQuery);

  useEffect(() => {
    setInput(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e);
    }
  };

  return (
    <form className="search-bar-form" onSubmit={handleSubmit} aria-label="Search for books">
      <div className="search-input-wrap">
        <FiSearch className="search-icon" aria-hidden="true" size={18} />
        <input
          type="search"
          name="q"
          className="search-input"
          placeholder="Search by title, author, or keyword..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-label="Book search input"
          autoComplete="off"
        />
        {input && !isLoading && (
          <button type="button" className="search-clear-button" onClick={() => { setInput(''); onClear?.(); }} aria-label="Clear search">
            ×
          </button>
        )}
      </div>
      <button
        type="submit"
        className="search-button"
        disabled={isLoading || !input.trim()}
        aria-label="Submit search"
      >
        {isLoading ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}

export default SearchBar;
