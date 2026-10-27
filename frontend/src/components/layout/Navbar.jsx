import { useState } from 'react';
import { FiBookOpen, FiSearch } from 'react-icons/fi';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Discover', to: '/discover' },
  { label: 'Categories', to: '/categories' },
  { label: 'Library', to: '/library' },
  { label: 'Community', to: '/community' },
];

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      navigate('/');
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/discover?q=${encodeURIComponent(query)}` : '/discover');
  };

  return (
    <header className={`site-header${location.pathname === '/' ? ' home-site-header' : ''}`}>
      <div className="container nav-shell">
        <NavLink to="/" className="brand" aria-label="Biblioverse home">
          <span className="brand-mark" aria-hidden="true"><FiBookOpen size={20} /></span>
          <span className="brand-copy">
            <strong>Biblioverse</strong>
            <small>Private library</small>
          </span>
        </NavLink>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <form className="global-search" onSubmit={handleSearchSubmit} role="search">
          <label htmlFor="global-book-search" className="global-search-label">Search books</label>
          <FiSearch size={16} aria-hidden="true" />
          <input
            id="global-book-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search books"
            autoComplete="off"
          />
          <button type="submit" aria-label="Search books">Search</button>
        </form>

        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <NavLink to="/profile" className="nav-link tertiary">
                {user?.name || 'Profile'}
              </NavLink>
              <button type="button" className="button button-secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="button button-outline">
                Login
              </NavLink>
              <NavLink to="/register" className="button button-primary">
                Join
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
