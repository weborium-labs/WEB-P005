import { lazy, Suspense, useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import ResponsiveAppBar from "./components/ResponsiveAppBar"
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import SignIn from "./pages/SignIn"
import AdminLanding from "./pages/AdminLanding"

// Dashboard screens are code-split so the sign-in/landing bundle stays small;
// each screen loads on first navigation.
const Dashboard = lazy(() => import("./pages/page.index").then((m) => ({ default: m.Dashboard })));
const NavbarsPage = lazy(() => import("./pages/page.index").then((m) => ({ default: m.NavbarsPage })));
const PublicationsPage = lazy(() => import("./pages/page.index").then((m) => ({ default: m.PublicationsPage })));
const GlimpsesPage = lazy(() => import("./pages/page.index").then((m) => ({ default: m.GlimpsesPage })));
const PagesPage = lazy(() => import("./pages/page.index").then((m) => ({ default: m.PagesPage })));
const PageEditorPage = lazy(() => import("./pages/page.index").then((m) => ({ default: m.PageEditorPage })));
const MediaPage = lazy(() => import("./pages/page.index").then((m) => ({ default: m.MediaPage })));
const ThemesPage = lazy(() => import("./pages/page.index").then((m) => ({ default: m.ThemesPage })));

const RouteFallback = () => (
  <Box sx={{ display: "grid", placeItems: "center", py: 10 }} role="status">
    <CircularProgress aria-label="Loading…" />
  </Box>
);
import { TokenCapture } from "./components/components.index"
import { GuestOnly, ProtectedRoute } from "./components/RouteGuards"
import { initializeAuth } from "./api/auth.api"

// Wraps the dashboard routes in the admin shell (sidebar + avatar menu).
const DashboardLayout = () => (
  <ResponsiveAppBar>
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  </ResponsiveAppBar>
);

const App = () => {
  // Restore the session (refresh cookie -> access token -> verified profile)
  // exactly once per page load. Single-flight, StrictMode-safe.
  // detect change vercel1
  // detect change vercel2
  // detect change vercel3
  // detect change vercel4
  useEffect(() => {
    void initializeAuth();
  }, []);

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GuestOnly><AdminLanding /></GuestOnly>} />
          <Route path="/auth/signIn" element={<GuestOnly><SignIn /></GuestOnly>} />
          <Route path="/verify-token" element={<TokenCapture />} />
          <Route element={<ProtectedRoute />}>
            {/* The admin shell (sidebar, avatar menu, logout) is only for the
                dashboard screens — public routes stay chrome-free as before. */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/navbars" element={<NavbarsPage />} />
              <Route path="/dashboard/publications" element={<PublicationsPage />} />
              <Route path="/dashboard/glimpses" element={<GlimpsesPage />} />
              <Route path="/dashboard/pages" element={<PagesPage />} />
              <Route path="/dashboard/pages/:slug" element={<PageEditorPage />} />
              <Route path="/dashboard/media" element={<MediaPage />} />
              <Route path="/dashboard/themes" element={<ThemesPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
