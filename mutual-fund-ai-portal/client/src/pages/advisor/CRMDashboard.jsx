import { Users, FileCheck, BarChart3, TrendingUp } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

/**
 * Advisor CRM Dashboard - Main dashboard for advisor role
 */
const AdvisorCRMDashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          CRM Dashboard, {user?.name}! 👔
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your clients, approvals, and performance metrics
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Clients
            </h3>
            <Users className="text-blue-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            42
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            ↑ 5 this month
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pending Approvals
            </h3>
            <FileCheck className="text-orange-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Awaiting review
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              AUM Under Management
            </h3>
            <BarChart3 className="text-purple-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₹2.5Cr
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Assets under management
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Avg. Client Return
            </h3>
            <TrendingUp className="text-green-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            14.3%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            YTD performance
          </p>
        </div>
      </div>

      {/* Client portfolios section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Client Portfolios
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Placeholder: Client portfolios will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default AdvisorCRMDashboard;
