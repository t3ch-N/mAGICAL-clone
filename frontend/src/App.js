import { useEffect, useRef, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";

// Pages
import HomePage from "./pages/HomePage";
import TournamentPage from "./pages/TournamentPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import TicketsPage from "./pages/TicketsPage";
import TravelPage from "./pages/TravelPage";
import MediaPage from "./pages/MediaPage";
import RegistrationPage from "./pages/RegistrationPage";
import NewsPage from "./pages/NewsPage";
import GalleryPage from "./pages/GalleryPage";
import AboutPage from "./pages/AboutPage";
import AboutKOGLPage from "./pages/AboutKOGLPage";
import ContactPage from "./pages/ContactPage";
import AdminDashboard from "./pages/AdminDashboard";

// Components
import MainLayout from "./components/MainLayout";
import AuthCallback from "./components/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";

import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth context
import { AuthProvider } from "./context/AuthContext";

function AppRouter() {
  const location = useLocation();
  
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  // Check URL fragment for session_id synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tournament" element={<TournamentPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/players/:playerId" element={<LeaderboardPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/travel" element={<TravelPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/registration" element={<RegistrationPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:articleId" element={<NewsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/about-kogl" element={<AboutKOGLPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
