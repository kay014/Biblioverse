import BookCard from '../books/BookCard';

function BookGrid({ books, savedBookIds, savingBookId, onSave }) {
  if (!books || books.length === 0) {
    return null;
  }

  return (
    <div className="discover-books-grid">
      {books.map((book) => (
        <BookCard
          key={book?._id || book?.sourceId || book?.title}
          book={book}
          isSaved={savedBookIds?.has(book?._id)}
          isSaving={savingBookId === book?._id}
          onSave={onSave}
        />
      ))}
    </div>
  );
}

export default BookGrid;
