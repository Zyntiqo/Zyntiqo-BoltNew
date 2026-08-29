import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import BookConsultation from '@/pages/BookConsultation';
import RequestQuote from '@/pages/RequestQuote';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

// Admin app
import AppLayout from '@/components/app/AppLayout';
import DashboardPage from '@/pages/app/DashboardPage';
import CRMPage from '@/pages/app/CRMPage';
import PipelinePage from '@/pages/app/PipelinePage';
import AutomationsPage from '@/pages/app/AutomationsPage';
import CampaignsPage from '@/pages/app/CampaignsPage';
import MeetingsPage from '@/pages/app/MeetingsPage';
import TasksPage from '@/pages/app/TasksPage';
import AssistantPage from '@/pages/app/AssistantPage';
import SettingsPage from '@/pages/app/SettingsPage';
import OnboardingPage from '@/pages/app/OnboardingPage';
import ProjectsPage from '@/pages/app/ProjectsPage';
import QuotesPage from '@/pages/app/QuotesPage';
import InvoicesPage from '@/pages/app/InvoicesPage';
import SupportPage from '@/pages/app/SupportPage';
import CustomersPage from '@/pages/app/CustomersPage';
import UsersPage from '@/pages/app/UsersPage';

// Portal
import PortalLayout from '@/components/portal/PortalLayout';
import PortalDashboardPage from '@/pages/portal/PortalDashboardPage';
import PortalProjectsPage from '@/pages/portal/PortalProjectsPage';
import PortalMeetingsPage from '@/pages/portal/PortalMeetingsPage';
import PortalQuotesPage from '@/pages/portal/PortalQuotesPage';
import PortalInvoicesPage from '@/pages/portal/PortalInvoicesPage';
import PortalSupportPage from '@/pages/portal/PortalSupportPage';
import PortalFilesPage from '@/pages/portal/PortalFilesPage';
import PortalProfilePage from '@/pages/portal/PortalProfilePage';

// Shared
import ProtectedRoute from '@/components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public marketing site */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/book-consultation" element={<BookConsultation />} />
            <Route path="/request-quote" element={<RequestQuote />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Route>

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Onboarding (staff only) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireStaff>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Admin portal (staff only) */}
          <Route
            path="/app"
            element={
              <ProtectedRoute requireStaff>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="crm" element={<CRMPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="automations" element={<AutomationsPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="meetings" element={<MeetingsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="quotes" element={<QuotesPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>

          {/* Customer portal (authenticated users) */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <PortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PortalDashboardPage />} />
            <Route path="projects" element={<PortalProjectsPage />} />
            <Route path="meetings" element={<PortalMeetingsPage />} />
            <Route path="quotes" element={<PortalQuotesPage />} />
            <Route path="invoices" element={<PortalInvoicesPage />} />
            <Route path="support" element={<PortalSupportPage />} />
            <Route path="files" element={<PortalFilesPage />} />
            <Route path="profile" element={<PortalProfilePage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
