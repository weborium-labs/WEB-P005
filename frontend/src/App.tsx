import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

// Pages
import PublicationsPage from "./pages/PublicationsPage";
import GlimpsesPage from "./pages/GlimpsesPage";
import DynamicContentPage from "./pages/DynamicContentPage";
import CoursesTaughtPage from "./pages/CoursesTaughtPage";
import MentorshipPage from "./pages/MentorshipPage";
import ResearchInterestsPage from "./pages/ResearchInterestsPage";
import LandingPage from "./pages/LandingPage";
import About from "./pages/About";
import EditorialBoardPage from "./pages/EditorialBoardPage";
import PatentsPage from "./pages/PatentsPage";
import ContactPage from "./pages/ContactPage";
import CmsRoute from "./pages/CmsRoute";
import { useTheme } from "./hooks/useTheme";

function App() {
  const location = useLocation();

  // Active theme (DB-backed colour tokens) — applied as CSS custom properties
  // on <html>; the built-in :root defaults render identically until it lands.
  useTheme(location.pathname);

  return (
    <Routes>
      {/* Root & Core Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/publications" element={<PublicationsPage />} />
      <Route path="/glimpses" element={<GlimpsesPage />} />
      <Route path="/teaching/courses" element={<CoursesTaughtPage />} />
      <Route path="/mentorship" element={<MentorshipPage />} />
      <Route path="/research/interests" element={<ResearchInterestsPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/page/editorial-board-memberships" element={<EditorialBoardPage />} />
      <Route path="/research/patents" element={<PatentsPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Legacy sub-navigation reader (`page_content` on nav items) — kept for
          existing deep links; new pages should use the CMS resolver below. */}
      <Route path="/page/:slug" element={<DynamicContentPage />} />

      {/* CMS route resolution — MUST stay last. Any other URL resolves against
          the published pages via GET /api/v1/pages/resolve?path=…, so a page
          created in the admin at a new URL is live without a frontend rebuild.
          Unknown paths render the real 404 page. */}
      <Route path="*" element={<CmsRoute />} />
    </Routes>
  );
}

export default App;
