import { Link } from 'react-router-dom';
import FeatureStrip from '../components/home/FeatureStrip';
import FeaturedBooks from '../components/home/FeaturedBooks';
import PopularCategories from '../components/home/PopularCategories';
import QuoteSection from '../components/home/QuoteSection';

function HomePage() {
  return (
    <div className="page-shell home-page">
      <section className="home-hero">
        <div className="home-hero-leaves" aria-hidden="true">
          <span className="hero-leaf hero-leaf-one" />
          <span className="hero-leaf hero-leaf-two" />
          <span className="hero-leaf hero-leaf-four" />
          <span className="hero-leaf hero-leaf-five" />
          <span className="hero-leaf hero-leaf-six" />
          <span className="hero-leaf hero-leaf-eight" />
          <span className="hero-leaf hero-leaf-nine" />
          <span className="hero-leaf hero-leaf-ten" />
          <span className="hero-leaf hero-leaf-eleven" />
          <span className="hero-leaf hero-leaf-twelve" />
          <span className="hero-leaf hero-leaf-thirteen" />
          <span className="hero-leaf hero-leaf-fourteen" />
          <span className="hero-leaf hero-leaf-sixteen" />
        </div>

        <div className="home-hero-inner container">
          <div className="home-hero-copy">
            <p className="home-hero-kicker"><span aria-hidden="true">✦</span> Discover Stories <span aria-hidden="true">✦</span></p>
            <h1>Biblioverse</h1>
            <p className="home-hero-subtitle">Your personal universe of books.</p>
            <p className="home-hero-supporting">
              A quiet place for curious minds, well-loved stories, and the next chapter waiting to be found.
            </p>
            <div className="hero-composition-row">
              <div className="scene-left-decor" aria-hidden="true">
                <div className="scene-books">
                  <span className="scene-book scene-book-back" />
                  <span className="scene-book scene-book-middle" />
                  <span className="scene-book scene-book-front" />
                  <span className="scene-bookmark" />
                </div>
                <div className="scene-plant">
                  <span className="scene-stem scene-stem-one" />
                  <span className="scene-stem scene-stem-two" />
                  <span className="scene-plant-leaf scene-plant-leaf-one" />
                  <span className="scene-plant-leaf scene-plant-leaf-two" />
                  <span className="scene-plant-leaf scene-plant-leaf-three" />
                  <span className="scene-pot" />
                </div>
              </div>

              <div className="home-hero-actions">
                <Link to="/discover" className="home-editorial-button home-editorial-button-primary">Explore Books</Link>
                <Link to="/library" className="home-editorial-button home-editorial-button-secondary">My Library</Link>
              </div>

              <div className="scene-right-decor" aria-hidden="true">
                <div className="scene-cup"><span className="scene-cup-handle" /></div>
                <div className="scene-steam scene-steam-one" />
                <div className="scene-steam scene-steam-two" />
              </div>

              <div className="scene-table-line" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <FeatureStrip />
      <FeaturedBooks />
      <QuoteSection />
      <PopularCategories />
    </div>
  );
}

export default HomePage;
