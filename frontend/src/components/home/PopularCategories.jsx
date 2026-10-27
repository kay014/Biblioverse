import { Link } from 'react-router-dom';
import categories from '../../constants/categories';

function PopularCategories() {
  return (
    <section className="categories-section container">
      <h2 className="categories-title">Popular Categories</h2>
      <div className="category-grid">
        {categories.map(({ name, icon: Icon }) => (
          <Link key={name} to={`/categories?category=${encodeURIComponent(name)}`} className="category-tile">
            <div className="category-icon" aria-hidden="true">
              <Icon size={18} />
            </div>
            <span>{name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default PopularCategories;
