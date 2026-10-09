import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import BookDetailsPage from './pages/BookDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ReaderPage from './pages/ReaderPage';
import BookshelfPage from './pages/BookshelfPage';
import HistoryPage from './pages/HistoryPage';
import NotesPage from './pages/NotesPage';
import KnowledgeSearchPage from './pages/KnowledgeSearchPage';
import AnalyticsPage from './pages/AnalyticsPage';
import KnowledgeMapPage from './pages/KnowledgeMapPage';
import AuthorDashboardPage from './pages/AuthorDashboardPage';
import BookFormPage from './pages/BookFormPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/books/:id" element={<BookDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/reader/:bookId" element={<ReaderPage />} />
          <Route path="/bookshelf" element={<BookshelfPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/knowledge-search" element={<KnowledgeSearchPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/knowledge-map" element={<KnowledgeMapPage />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={['author', 'admin']} />}>
          <Route path="/author/dashboard" element={<AuthorDashboardPage />} />
          <Route path="/author/books/new" element={<BookFormPage />} />
          <Route path="/author/books/:id/edit" element={<BookFormPage />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        {/* This is the final planned phase — every SRS module now has a route. */}
      </Routes>
    </>
  );
}
