import { Routes, Route } from "react-router-dom";
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

function App() {
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
 
      {/* Dynamic Catch-All Route for Admin Custom Pages */}
      <Route path="/page/:slug" element={<DynamicContentPage />} />
    </Routes>
  );
}

export default App;