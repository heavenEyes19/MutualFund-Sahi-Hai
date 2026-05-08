import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Wallet, PieChart, Upload, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import kycService from '../../services/kycService';

/**
 * Investor Dashboard - Main dashboard for investor role
 * Includes overview and KYC completion tabs.
 */
const InvestorDashboard = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [kycData, setKycData] = useState(null);
  const [kycStatus, setKycStatus] = useState('Not Submitted'); // Pending, Approved, Rejected, Not Submitted
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    aadharNumber: '',
    phoneNumber: '',
    panNumber: '',
    panCardPhoto: null,
    submissionPhoto: null
  });

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const data = await kycService.getKYCStatus();
      setKycStatus(data.status);
      setKycData(data.kyc);
    } catch (error) {
      console.error("Error fetching KYC status", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData({ ...formData, [name]: files[0] });
    }
  };

  const handleSubmitKYC = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError('');

    if (!formData.panCardPhoto || !formData.submissionPhoto) {
      setSubmitError('Please upload both required photos.');
      setIsLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('aadharNumber', formData.aadharNumber);
      submitData.append('phoneNumber', formData.phoneNumber);
      submitData.append('panNumber', formData.panNumber);
      submitData.append('panCardPhoto', formData.panCardPhoto);
      submitData.append('submissionPhoto', formData.submissionPhoto);

      await kycService.submitKYC(submitData);
      await fetchKYCStatus(); // Refresh status
      setFormData({
        aadharNumber: '',
        phoneNumber: '',
        panNumber: '',
        panCardPhoto: null,
        submissionPhoto: null
      });
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Error submitting KYC');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
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

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
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

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
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

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Recent Transactions
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Placeholder: Recent transactions will appear here</p>
        </div>
      </div>
    </>
  );

  const renderKYC = () => {
    if (kycStatus === 'Approved') {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center transition-colors">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">KYC Verified</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your KYC details have been successfully verified. You are ready to invest!
          </p>
        </div>
      );
    }

    if (kycStatus === 'Pending') {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center transition-colors">
          <Clock className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">KYC Pending Verification</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your KYC details have been submitted and are currently under review by our team.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:p-8 transition-colors max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Complete Your KYC</h2>
        
        {kycStatus === 'Rejected' && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 text-red-700 dark:text-red-400">
            <XCircle className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-semibold">Your previous KYC submission was rejected.</p>
              <p className="text-sm mt-1">Please ensure your details match your documents exactly and upload clear photos.</p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="mt-0.5 shrink-0" size={20} />
            <p className="text-sm">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmitKYC} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Aadhar Number
              </label>
              <input
                type="text"
                name="aadharNumber"
                required
                value={formData.aadharNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-colors"
                placeholder="1234 5678 9012"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                name="panNumber"
                required
                value={formData.panNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-colors uppercase"
                placeholder="ABCDE1234F"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                required
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-colors"
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Document Uploads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Upload PAN Card</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">JPEG, PNG up to 5MB</p>
                <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                  <span>Browse File</span>
                  <input type="file" name="panCardPhoto" onChange={handleFileChange} className="hidden" accept="image/jpeg, image/png" />
                </label>
                {formData.panCardPhoto && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400 truncate">
                    {formData.panCardPhoto.name}
                  </p>
                )}
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Upload Your Photo</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Clear face, JPEG, PNG up to 5MB</p>
                <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                  <span>Browse File</span>
                  <input type="file" name="submissionPhoto" onChange={handleFileChange} className="hidden" accept="image/jpeg, image/png" />
                </label>
                {formData.submissionPhoto && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400 truncate">
                    {formData.submissionPhoto.name}
                  </p>
                )}
              </div>

            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                'Submit KYC Details'
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's your investment overview and recommendations
          </p>
        </div>

        {kycStatus !== 'Approved' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-400 px-4 py-3 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">KYC Action Required:</span> Please complete your KYC to start investing.
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="mb-8 border-b border-gray-200 dark:border-gray-800">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('kyc')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'kyc'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            KYC Completion
            {kycStatus === 'Approved' ? (
              <CheckCircle2 size={16} className="text-green-500" />
            ) : kycStatus === 'Pending' ? (
              <Clock size={16} className="text-yellow-500" />
            ) : (
              <AlertCircle size={16} className="text-red-500" />
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'overview' ? renderOverview() : renderKYC()}
      </div>
    </div>
  );
};

export default InvestorDashboard;
