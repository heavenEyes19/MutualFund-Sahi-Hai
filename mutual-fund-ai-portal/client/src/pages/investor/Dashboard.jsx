import { BarChart3, TrendingUp, Wallet, PieChart } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

/**
 * Investor Dashboard - Main dashboard for investor role
 */
const InvestorDashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's your investment overview and recommendations
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Portfolio Value
            </h3>
            <Wallet className="text-blue-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₹5,24,000
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            ↑ 12.5% this year
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Invested
            </h3>
            <PieChart className="text-purple-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₹4,65,000
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Across 8 funds
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Gains & Losses
            </h3>
            <TrendingUp className="text-green-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            +₹59,000
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            12.7% return
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Active SIPs
            </h3>
            <BarChart3 className="text-orange-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            ₹15,000/month
          </p>
        </div>
      </div>

      {/* Recent activity section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Recent Transactions
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Placeholder: Recent transactions will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboard;
