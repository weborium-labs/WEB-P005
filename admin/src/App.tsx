import { useEffect } from "react";
import ResponsiveAppBar from "./components/ResponsiveAppBar"
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import {
  SignIn,
  AdminLanding,
  Dashboard,
  NavbarsPage,
  PublicationsPage,
  GlimpsesPage,
} from "./pages/page.index"
import { TokenCapture } from "./components/components.index"
import { GuestOnly, ProtectedRoute } from "./components/RouteGuards"
import { initializeAuth } from "./api/auth.api"

// Wraps the dashboard routes in the admin shell (sidebar + avatar menu).
const DashboardLayout = () => (
  <ResponsiveAppBar>
    <Outlet />
  </ResponsiveAppBar>
);

const App = () => {
  // Restore the session (refresh cookie -> access token -> verified profile)
  // exactly once per page load. Single-flight, StrictMode-safe.
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
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
