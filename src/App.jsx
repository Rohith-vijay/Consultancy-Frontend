import React, { lazy, Suspense, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/Layout";
import GlobalLoader from "./components/GlobalLoader";

// Lazy-loaded Public Pages
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Donation = lazy(() => import("./pages/Donation"));
const Events = lazy(() => import("./pages/Events"));
const EventDetails = lazy(() => import("./pages/EventDetails"));
const Vision = lazy(() => import("./pages/Vision"));
const History = lazy(() => import("./pages/History"));
const Contact = lazy(() => import("./pages/Contact"));
const Volunteer = lazy(() => import("./pages/Volunteer"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const StoryDetail = lazy(() => import("./pages/StoryDetail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));

// New compatible views
const ImpactReports = lazy(() => import("./pages/ImpactReports"));
const MediaGallery = lazy(() => import("./pages/MediaGallery"));
const FaqAccordion = lazy(() => import("./pages/FaqAccordion"));
const FinancialTransparency = lazy(() => import("./pages/FinancialTransparency"));
const ImpactShowcase = lazy(() => import("./pages/ImpactShowcase"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));

// Dashboards (Lazy)
const AdminDashboard = lazy(() => import("./admin/Dashboard"));
const UserDashboard = lazy(() => import("./pages/dashboards/UserDashboard"));
const VolunteerDashboard = lazy(() => import("./pages/dashboards/VolunteerDashboard"));
const ApplicantDashboard = lazy(() => import("./pages/dashboards/ApplicantDashboard"));

// Context & protection
import { AppProvider, AppContext } from "./context/AppContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { ROLES } from "./utils/permissions";

// MUI Theme Integration
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#B07A3F",
    },
    secondary: {
      main: "#F59E0B",
    },
    background: {
      default: "#fafafa",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Inter", "sans-serif"',
    h1: { fontFamily: '"Poppins", "sans-serif"' },
    h2: { fontFamily: '"Poppins", "sans-serif"' },
    h3: { fontFamily: '"Poppins", "sans-serif"' },
    h4: { fontFamily: '"Poppins", "sans-serif"' },
    h5: { fontFamily: '"Poppins", "sans-serif"' },
    h6: { fontFamily: '"Poppins", "sans-serif"' },
  },
  shape: {
    borderRadius: 12,
  },
});

function App() {
  return (
    <AppProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <ErrorBoundary title="Global Application Crash Shield" name="GlobalAppRoot">
              <AnimatedRoutes />
            </ErrorBoundary>
          </Layout>
        </Router>
      </ThemeProvider>
    </AppProvider>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <Suspense fallback={<GlobalLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/stories/:id" element={<StoryDetail />} />
          <Route path="/vision" element={<Vision />} />
          <Route path="/history" element={<History />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/volunteer" element={<Volunteer />} />

          {/* New public pages */}
          <Route path="/reports" element={<ImpactReports />} />
          <Route path="/gallery" element={<MediaGallery />} />
          <Route path="/faq" element={<FaqAccordion />} />
          <Route path="/transparency" element={<FinancialTransparency />} />
          <Route path="/impact-showcase" element={<ImpactShowcase />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Public donation page (Allows both authenticated users and guest checkouts) */}
          <Route
            path="/donation"
            element={
              <ErrorBoundary title="Donation Portal Shield" name="DonationPortalRoot">
                <Donation />
              </ErrorBoundary>
            }
          />

          {/* Role-specific dashboards */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={[ROLES.USER, ROLES.DONOR]}>
                <ErrorBoundary title="Donor Portal Shield" name="UserDashboardRoot">
                  <UserDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/volunteer"
            element={
              <ProtectedRoute allowedRoles={[ROLES.VOLUNTEER]}>
                <ErrorBoundary title="Volunteer Portal Shield" name="VolunteerDashboardRoot">
                  <VolunteerDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/applicant"
            element={
              <ProtectedRoute allowedRoles={[ROLES.APPLICANT]}>
                <ErrorBoundary title="Applicant Portal Shield" name="ApplicantDashboardRoot">
                  <ApplicantDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <ErrorBoundary title="Admin Systems Shield" name="AdminDashboardRoot">
                  <AdminDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

export default App;
