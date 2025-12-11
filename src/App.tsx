import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import HomePage from "./pages/Home";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminSettings from './pages/admin/AdminSettings';
import AdminBulkUpload from './pages/admin/AdminBulkUpload';
import AdminScrapers from './pages/admin/AdminScrapers';
import AdminSeo from './pages/admin/AdminSeo';
import AdminAI from './pages/admin/AdminAI';
import AdminDesign from './pages/admin/AdminDesign';
import AdminCampaigns from './pages/admin/AdminCampaigns';
import AdminBackup from './pages/admin/AdminBackup';
import AdminLogos from './pages/admin/AdminLogos';
import AdminIntegrations from "./pages/admin/AdminIntegrations";
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminMembers from './pages/admin/AdminMembers';
import AdminNewsletter from './pages/admin/AdminNewsletter';
import EmailConfirmation from './pages/EmailConfirmation';

import ProfileLayout from "./pages/profile/ProfileLayout";
import { ProfileInfo, ProfileFavorites, ProfileSettings, ProfileWallet } from "./pages/profile/ProfilePages";
import { ConfirmationProvider } from './context/ConfirmationContext';
import { authService } from './services/authService';
import AuthModal from './components/AuthModal';


const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <div className="p-10 text-center">Bir hata oluştu.</div>,
  },
  {
    path: "/auth/confirm",
    element: <EmailConfirmation />,
  },
  {
    path: "/profile",
    element: <ProfileLayout />,
    children: [
      { index: true, element: <Navigate to="info" replace /> },
      { path: "info", element: <ProfileInfo /> },
      { path: "wallet", element: <ProfileWallet /> },
      { path: "favorites", element: <ProfileFavorites /> },
      { path: "settings", element: <ProfileSettings /> },
    ]
  },
  {
    path: "/panel",
    element: <AdminLogin />,
  },
  {
    path: "/panel/setup",
    element: <AdminSetup />,
  },
  {
    path: "/panel/login",
    element: <AdminLogin />,
  },
  {
    path: "/panel/dashboard",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
    ]
  },
  {
    path: "/panel/analytics",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminAnalytics /> },
    ]
  },
  {
    path: "/panel/members",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminMembers /> },
    ]
  },
  {
    path: "/panel/newsletter",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminNewsletter /> },
    ]
  },
  {
    path: "/panel/campaigns",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminCampaigns /> },
    ]
  },
  {
    path: "/panel/bulk-upload",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminBulkUpload /> },
    ]
  },
  {
    path: "/panel/scrapers",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminScrapers /> },
    ]
  },
  {
    path: "/panel/integrations",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminIntegrations /> },
    ]
  },
  {
    path: "/panel/settings",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminSettings /> },
    ]
  },
  {
    path: "/panel/seo",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminSeo /> },
    ]
  },
  {
    path: "/panel/ai",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminAI /> },
    ]
  },
  {
    path: "/panel/logos",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminLogos /> },
    ]
  },
  {
    path: "/panel/design",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDesign /> },
    ]
  },
  {
    path: "/panel/backup",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminBackup /> },
    ]
  },
  {
    path: "/panel/advanced",
    element: <AdminLayout />,
    children: [
      { index: true, element: <div className="p-10">Gelişmiş ayarlar yakında...</div> },
    ]
  },
  {
    path: "/panel/audience",
    element: <AdminLayout />,
    children: [
      { index: true, element: <div className="p-10">Kitle analizleri yakında...</div> },
    ]
  },
  {
    path: "/admin/login",
    element: <Navigate to="/panel/login" replace />,
  },
  {
    path: "/admin/setup", 
    element: <Navigate to="/panel/setup" replace />,
  },
  {
    path: "/admin/*",
    element: <Navigate to="/panel/dashboard" replace />,
  },
  {
    path: "*",
    element: <div className="flex h-screen items-center justify-center">Sayfa bulunamadı (404)</div>
  }
]);



import { ToastProvider } from './context/ToastContext';

// ... imports

function AppWrapper() {
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = React.useState(false);

  React.useEffect(() => {
    // Listen for Password Recovery specific event
    const { data: { subscription } } = authService.onAuthStateChange((event) => {
      console.log("Auth Event:", event); // Debug
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryModalOpen(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <React.StrictMode>
      <ToastProvider>
        <ConfirmationProvider>
          <RouterProvider router={router} />

          {/* Global Modal for Recovery */}
          {isRecoveryModalOpen && (
            <div className="relative z-[9999]">
              <AuthModal
                isOpen={isRecoveryModalOpen}
                onClose={() => setIsRecoveryModalOpen(false)}
                initialResetMode={true}
              />
            </div>
          )}
        </ConfirmationProvider>
      </ToastProvider>
    </React.StrictMode>
  );
}

export default AppWrapper;