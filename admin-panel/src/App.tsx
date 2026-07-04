// import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import Sidebar from './components/Sidebar';
// import LoginPage from './pages/LoginPage';
// import DashboardPage from './pages/DashboardPage';
// import UsersPage from './pages/UsersPage';
// import UserDetailPage from './pages/UserDetailPage';
// import PostsPage from './pages/PostsPage';
// import ReelsPage from './pages/ReelsPage';
// import StoriesPage from './pages/StoriesPage';
// import CommentsPage from './pages/CommentsPage';
// import ReportsPage from './pages/ReportsPage';
// import { Loader2 } from 'lucide-react';

// function ProtectedLayout() {
//   const { user, isLoading } = useAuth();

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-dark-950">
//         <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
//       </div>
//     );
//   }

//   if (!user) return <Navigate to="/login" replace />;

//   return (
//     <div className="min-h-screen bg-dark-950">
//       <Sidebar />
//       <main className="ml-[240px] p-6 min-h-screen">
//         <Outlet />
//       </main>
//     </div>
//   );
// }

// function PublicRoute() {
//   const { user, isLoading } = useAuth();

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-dark-950">
//         <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
//       </div>
//     );
//   }

//   if (user) return <Navigate to="/" replace />;

//   return <Outlet />;
// }

// export default function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <Routes>
//           {/* Public routes */}
//           <Route element={<PublicRoute />}>
//             <Route path="/login" element={<LoginPage />} />
//           </Route>

//           {/* Protected routes */}
//           <Route element={<ProtectedLayout />}>
//             <Route path="/" element={<DashboardPage />} />
//             <Route path="/users" element={<UsersPage />} />
//             <Route path="/users/:userId" element={<UserDetailPage />} />
//             <Route path="/posts" element={<PostsPage />} />
//             <Route path="/reels" element={<ReelsPage />} />
//             <Route path="/stories" element={<StoriesPage />} />
//             <Route path="/comments" element={<CommentsPage />} />
//             <Route path="/reports" element={<ReportsPage />} />
//           </Route>

//           {/* Catch all */}
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </BrowserRouter>
//     </AuthProvider>
//   );
// }









import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import UserDetailPage from './pages/UserDetailPage';
import PostsPage from './pages/PostsPage';
import ReelsPage from './pages/ReelsPage';
import StoriesPage from './pages/StoriesPage';
import CommentsPage from './pages/CommentsPage';
import ReportsPage from './pages/ReportsPage';
import { Loader2 } from 'lucide-react';

function ProtectedLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-page">
      <Sidebar />
      <main className="ml-[240px] p-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

function PublicRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/:userId" element={<UserDetailPage />} />
              <Route path="/posts" element={<PostsPage />} />
              <Route path="/reels" element={<ReelsPage />} />
              <Route path="/stories" element={<StoriesPage />} />
              <Route path="/comments" element={<CommentsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}