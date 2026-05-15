import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

// Public page imports
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';
// import Chatbot from '../pages/Chatbot';

// Page imports - Investor
import InvestorDashboard from '../pages/investor/Dashboard';
import AIAdvisory from '../pages/investor/AIAdvisory';
import Portfolio from '../pages/investor/Portfolio';
import SIPs from '../pages/investor/SIPs';
import History from '../pages/investor/History';
import MutualFunds from '../pages/MutualFunds';
import MutualFundDetails from '../pages/MutualFundDetails';
import KYCPage from '../pages/investor/KYCPage';
import Profile from '../pages/Profile';
import Explore from '../pages/investor/Explore';
import Cart from '../pages/investor/Cart';


// Page imports - Admin
import AdminPlatformAnalytics from '../pages/admin/Analytics';
import KYCManagement from '../pages/admin/KYCManagement';
import FundMaster from '../pages/admin/FundMaster';
import Settings from '../pages/admin/Settings';
import AdminSupport from '../pages/admin/Support';

// Router configuration
const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  // {
  //   path: '/chatbot',
  //   element: <Chatbot />,
  // },

  // Protected dashboard layout and routes
  {
    path: '/dashboard-area',
    element: <DashboardLayout />,
    children: [
      // Investor routes
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <InvestorDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'explore',
        element: (
          <ProtectedRoute>
            <Explore />
          </ProtectedRoute>
        ),
      },
      {
        path: 'cart',
        element: (
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        ),
      },
      {
        path: 'ai-advisory',
        element: (
          <ProtectedRoute>
            <AIAdvisory />
          </ProtectedRoute>
        ),
      },
      {
        path: 'portfolio',
        element: (
          <ProtectedRoute>
            <Portfolio />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sips',
        element: (
          <ProtectedRoute>
            <SIPs />
          </ProtectedRoute>
        ),
      },
      {
        path: 'history',
        element: (
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mutual-funds',
        element: (
          <ProtectedRoute>
            <MutualFunds />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mutual-funds/:schemeCode',
        element: (
          <ProtectedRoute>
            <MutualFundDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: 'kyc',
        element: (
          <ProtectedRoute>
            <KYCPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },

      // Admin routes
      {
        path: 'analytics',
        element: (
          <ProtectedRoute>
            <AdminPlatformAnalytics />
          </ProtectedRoute>
        ),
      },
      {
        path: 'kyc-management',
        element: (
          <ProtectedRoute>
            <KYCManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'fund-master',
        element: (
          <ProtectedRoute>
            <FundMaster />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
      {
        path: 'support',
        element: (
          <ProtectedRoute>
            <AdminSupport />
          </ProtectedRoute>
        ),
      },

      // Default redirect
      {
        index: true,
        element: (
          <ProtectedRoute>
            <InvestorDashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // 404 Not Found
  {
    path: '*',
    element: (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            404 - Page Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The page you're looking for doesn't exist.
          </p>
          <a
            href="/dashboard-area/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    ),
  },
]);

/**
 * Router component for the application
 * Provides route configuration and navigation
 */
const Router = () => {
  return <RouterProvider router={router} />;
};

export default Router;
