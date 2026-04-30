import { BarChart3, Users, Database, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

/**
 * Admin Platform Analytics Dashboard - Main dashboard for admin role
 */
const AdminPlatformAnalytics = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Platform Analytics, {user?.name}! 📊
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor platform health, users, and fund master data
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Users
            </h3>
            <Users className="text-blue-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            1,284
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            ↑ 156 this week
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Active Sessions
            </h3>
            <BarChart3 className="text-green-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            342
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Currently online
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Funds Managed
            </h3>
            <Database className="text-purple-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            156
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Active funds
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              KYC Pending
            </h3>
            <AlertCircle className="text-red-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            Requires attention
          </p>
        </div>
      </div>

      {/* System health section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          System Health & Monitoring
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Placeholder: System metrics and health status will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPlatformAnalytics;
