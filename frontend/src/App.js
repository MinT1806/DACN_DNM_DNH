import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import './index.css';

// Import pages from pages folder
import LandingPage from './pages/LandingPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import VocabularyPage from './pages/VocabularyPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ExercisesPage from './pages/ExercisesPage';
import ForumPage from './pages/ForumPage';
import GamificationPage from './pages/GamificationPage';
import ListeningPage from './pages/ListeningPage';
import SpeakingPage from './pages/SpeakingPage';
import MentorPage from './pages/MentorPage';
import ProgressPage from './pages/ProgressPage';
import PlacementTestPage from './pages/PlacementTestPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LearningPathPage from './pages/LearningPathPage';
import LearningAnalyticsPage from './pages/LearningAnalyticsPage';
import RecommendationPage from './pages/RecommendationPage';
import DailyChallengePage from './pages/DailyChallengePage';
import AgentPage from './pages/AgentPage';
import TestPage from './pages/TestPage';
import ExamResultsPage from './pages/ExamResultsPage';
import CompleteTestPage from './pages/CompleteTestPage';
import CompleteResultPage from './pages/CompleteResultPage';
import RankingPage from './pages/RankingPage';
import SkillSelectionPage from './pages/SkillSelectionPage';
import AIExercisePage from './pages/AIExercisePage';
import Sidebar from './components/Sidebar';
import VideoLearningPage from './pages/VideoLearningPage';
import StoryModePage from './pages/StoryModePage';
import FlashcardPage from './pages/FlashcardPage';
import LessonPage from './pages/LessonPage';
import CreateEditLessonPage from './pages/CreateEditLessonPage';

// ============== SIDEBAR LAYOUT WRAPPER ==============
function SidebarLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    localStorage.setItem('sidebarOpen', String(next));
  };

  return (
    <div className="app-with-sidebar">
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />
      <main
        className="main-content"
        style={{
          marginLeft: sidebarOpen ? 260 : 72,
          transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
          minHeight: '100vh',
          flex: 1,
        }}
      >
        {children}
      </main>
    </div>
  );
}

// ============== FOOTER ==============
function Footer() {
  return (
    <footer className="footer">
      <p>ABC English Learning Platform &copy; 2026</p>
      <p>Powered by AI | Built with React & Spring Boot</p>
    </footer>
  );
}

// ============== NAVBAR (for unauthenticated pages) ==============
function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="brand-logo">ABC English</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/courses">Courses</Link>
        <Link to="/vocabulary">Vocabulary</Link>
        <Link to="/agent">AI Agent</Link>
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/daily-challenge">Daily Challenge</Link>
            <Link to="/tests">Tests</Link>
            <Link to="/ranking">Ranking</Link>
            <span className="user-greeting">Hello, {user.username}</span>
            <button onClick={handleLogout} className="btn btn-outline">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline">Login</Link>
            <Link to="/register" className="btn btn-primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

// ============== APP ==============
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth pages: NO sidebar */}
          <Route path="/login" element={<><Navbar /><div className="main-content"><LoginPage /></div><Footer /></>} />
          <Route path="/register" element={<><Navbar /><div className="main-content"><RegisterPage /></div><Footer /></>} />
          <Route path="/forgot-password" element={<><Navbar /><div className="main-content"><ForgotPasswordPage /></div><Footer /></>} />

          {/* All other pages: WITH sidebar */}
          <Route path="/*" element={
            <SidebarLayout>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/home" element={<LandingPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/vocabulary" element={<VocabularyPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/exercises" element={<ExercisesPage />} />
                <Route path="/forum" element={<ForumPage />} />
                <Route path="/gamification" element={<GamificationPage />} />
                <Route path="/listening" element={<ListeningPage />} />
                <Route path="/speaking" element={<SpeakingPage />} />
                <Route path="/mentor" element={<MentorPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/placement-test" element={<PlacementTestPage />} />
                <Route path="/teacher" element={<TeacherDashboardPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminDashboardPage tab="users" />} />
                <Route path="/learning-path" element={<LearningPathPage />} />
                <Route path="/analytics" element={<LearningAnalyticsPage />} />
                <Route path="/recommendations" element={<RecommendationPage />} />
                <Route path="/daily-challenge" element={<DailyChallengePage />} />
                <Route path="/video/:lessonId" element={<VideoLearningPage />} />
                <Route path="/lesson/:lessonId" element={<LessonPage />} />
                <Route path="/lesson-create" element={<CreateEditLessonPage />} />
                <Route path="/lesson-create/:courseId" element={<CreateEditLessonPage />} />
                <Route path="/lesson-create/:courseId/:lessonId" element={<CreateEditLessonPage />} />
                <Route path="/stories" element={<StoryModePage />} />
                <Route path="/stories/:storyId" element={<StoryModePage />} />
                <Route path="/flashcards" element={<FlashcardPage />} />
                <Route path="/agent" element={<AgentPage />} />
                <Route path="/ai-exercises" element={<SkillSelectionPage />} />
                <Route path="/ai-exercise/:skill" element={<AIExercisePage />} />
                <Route path="/tests" element={<TestPage />} />
                <Route path="/test/:testId" element={<TestPage />} />
                <Route path="/exam-result/:resultId" element={<ExamResultsPage />} />
                <Route path="/complete-test" element={<CompleteTestPage />} />
                <Route path="/complete-test/:testId" element={<CompleteTestPage />} />
                <Route path="/complete-result/:resultId" element={<CompleteResultPage />} />
                <Route path="/ranking" element={<RankingPage />} />
              </Routes>
            </SidebarLayout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
