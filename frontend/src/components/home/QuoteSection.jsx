import { useEffect, useState } from 'react';

const quotes = [
  { text: 'A room without books is like a body without a soul.', author: 'Cicero' },
  { text: 'Books are a uniquely portable magic.', author: 'Stephen King' },
  { text: 'There is no friend as loyal as a book.', author: 'Ernest Hemingway' },
  { text: 'So many books, so little time.', author: 'Frank Zappa' },
];

function QuoteSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState('visible');

  useEffect(() => {
    const timers = new Set();
    const schedule = (callback, delay) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
    };

    const cycleQuote = () => {
      schedule(() => {
        setPhase('fading-out');
        schedule(() => {
          setPhase('empty');
          schedule(() => {
            setActiveIndex((currentIndex) => (currentIndex + 1) % quotes.length);
            setPhase('fading-in');
            schedule(() => {
              setPhase('visible');
              cycleQuote();
            }, 1000);
          }, 500);
        }, 1000);
      }, 3000);
    };

    cycleQuote();

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <section className="quote-section">
      <div className="container quote-inner">
        <div className="quote-mark" aria-hidden="true">❧</div>
        <div className="quote-rotator" aria-live="polite">
          {quotes.map((quote, index) => (
            <div
              className={`quote-content${index === activeIndex ? ` is-${phase}` : ''}`}
              aria-hidden={index !== activeIndex}
              key={quote.author}
            >
              <blockquote>“{quote.text}”</blockquote>
              <p className="quote-author">— {quote.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default QuoteSection;
