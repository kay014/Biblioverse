import { FiBookmark, FiBookOpen, FiPenTool, FiUsers } from 'react-icons/fi';

const features = [
  {
    icon: FiBookOpen,
    title: 'Discover Books',
    text: 'Explore millions of books from around the world.',
  },
  {
    icon: FiBookmark,
    title: 'Save & Organize',
    text: 'Save your favorites and organize your library.',
  },
  {
    icon: FiPenTool,
    title: 'Write Reviews',
    text: 'Share your thoughts and read community reviews.',
  },
  {
    icon: FiUsers,
    title: 'Join Community',
    text: 'Connect with fellow book lovers.',
  },
];

function FeatureStrip() {
  return (
    <section className="feature-strip-wrap">
      <div className="container feature-strip">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="feature-item">
            <div className="feature-icon" aria-hidden="true">
              <Icon size={18} />
            </div>
            <div className="feature-copy">
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeatureStrip;
