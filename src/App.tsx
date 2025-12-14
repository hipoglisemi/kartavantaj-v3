import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import HomePage from "./pages/Home";
import AdminLogin from "./pages/admin/AdminLogin";
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
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSecurity from './pages/admin/AdminSecurity';
import AdminLogs from './pages/admin/AdminLogs';
import AdminSystemStatus from './pages/admin/AdminSystemStatus';
import EmailConfirmation from './pages/EmailConfirmation';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';
import { settingsService } from './services/settingsService';
import AdminService from './services/adminService';
import { universalSync } from './services/universalSyncService';

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
    path: "/panel/login",
    element: <AdminLogin />,
  },
  {
    path: "/panel/dashboard",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminDashboard /> },
    ]
  },
  {
    path: "/panel/notifications",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminNotifications /> },
    ]
  },
  {
    path: "/panel/analytics",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminAnalytics /> },
    ]
  },
  {
    path: "/panel/members",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminMembers /> },
    ]
  },
  {
    path: "/panel/newsletter",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminNewsletter /> },
    ]
  },
  {
    path: "/panel/campaigns",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminCampaigns /> },
    ]
  },
  {
    path: "/panel/bulk-upload",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminBulkUpload /> },
    ]
  },
  {
    path: "/panel/scrapers",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminScrapers /> },
    ]
  },
  {
    path: "/panel/integrations",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminIntegrations /> },
    ]
  },
  {
    path: "/panel/settings",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminSettings /> },
    ]
  },
  {
    path: "/panel/seo",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminSeo /> },
    ]
  },
  {
    path: "/panel/ai",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminAI /> },
    ]
  },
  {
    path: "/panel/logos",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminLogos /> },
    ]
  },
  {
    path: "/panel/design",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminDesign /> },
    ]
  },
  {
    path: "/panel/backup",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminBackup /> },
    ]
  },
  {
    path: "/panel/security",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminSecurity /> },
    ]
  },
  {
    path: "/panel/logs",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminLogs /> },
    ]
  },
  {
    path: "/panel/system-status",
    element: <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminSystemStatus /> },
    ]
  },

  {
    path: "/admin/login",
    element: <Navigate to="/panel/login" replace />,
  },

  {
    path: "/admin/*",
    element: <Navigate to="/panel/dashboard" replace />,
  },
  {
    path: "*",
    element: <NotFound />
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

  // Gerçek zamanlı senkronizasyon başlat
  React.useEffect(() => {
    try {
      // Universal sync başlat
      console.log('🚀 Starting Universal Sync Service');
      
      // Settings senkronizasyonu başlat
      if (settingsService?.startPeriodicSync) {
        settingsService.startPeriodicSync();
      }
      
      // Realtime dinleme başlat
      let settingsSubscription: any = null;
      let adminSubscription: any = null;
      
      if (settingsService?.subscribeToChanges) {
        settingsSubscription = settingsService.subscribeToChanges((newSettings: any) => {
          console.log('🔄 Ayarlar güncellendi:', newSettings);
        });
      }

      // Admin değişikliklerini dinle
      if (AdminService?.subscribeToAdminChanges) {
        adminSubscription = AdminService.subscribeToAdminChanges((admins: any[]) => {
          console.log('🔄 Admin listesi güncellendi:', admins);
        });
      }

      return () => {
        try {
          if (settingsSubscription?.unsubscribe) {
            settingsSubscription.unsubscribe();
          }
          if (adminSubscription?.unsubscribe) {
            adminSubscription.unsubscribe();
          }
          
          // Universal sync cleanup
          if (universalSync && typeof universalSync.stopAllSync === 'function') {
            universalSync.stopAllSync();
            console.log('🛑 Universal Sync Service stopped');
          }
        } catch (error) {
          console.warn('Subscription cleanup hatası:', error);
        }
      };
    } catch (error) {
      console.warn('Senkronizasyon başlatılamadı:', error);
    }
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