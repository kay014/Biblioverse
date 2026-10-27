import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import DiscoverPage from '../pages/DiscoverPage';
import BookDetailsPage from '../pages/BookDetailsPage';
import LibraryPage from '../pages/LibraryPage';
import CategoriesPage from '../pages/CategoriesPage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import ProfilePage from '../pages/ProfilePage';
import CommunityPage from '../pages/CommunityPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/discover" element={<DiscoverPage />} />
      <Route path="/books/:id" element={<BookDetailsPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<SignupPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
