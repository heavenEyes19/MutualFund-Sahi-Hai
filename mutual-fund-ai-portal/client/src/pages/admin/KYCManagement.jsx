import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Search, Eye, AlertCircle } from 'lucide-react';
import kycService from '../../services/kycService';

const KYCManagement = () => {
  const [kycs, setKycs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKyc, setSelectedKyc] = useState(null);

  useEffect(() => {
    fetchKYCs();
  }, []);

  const fetchKYCs = async () => {
    setIsLoading(true);
    try {
      const data = await kycService.getAllKYC();
      setKycs(data);
    } catch (err) {
      setError('Failed to load KYC data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await kycService.verifyKYC(id, status);
      await fetchKYCs(); // Refresh list
      if (selectedKyc && selectedKyc._id === id) {
        setSelectedKyc({ ...selectedKyc, status });
      }
    } catch (err) {
      alert('Failed to update KYC status');
      console.error(err);
    }
  };

  const filteredKycs = kycs.filter((kyc) =>
    kyc.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kyc.aadharNumber.includes(searchTerm) ||
    kyc.panNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
            <CheckCircle2 size={12} /> Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
            <XCircle size={12} /> Rejected
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            KYC Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and verify investor KYC submissions.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 text-red-700 dark:text-red-400">
          <AlertCircle className="mt-0.5 shrink-0" size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, Aadhar, or PAN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 dark:text-white transition-colors"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4">Investor</th>
                    <th className="px-6 py-4">Submitted On</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                          Loading...
                        </div>
                      </td>
                    </tr>
                  ) : filteredKycs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No KYC submissions found.
                      </td>
                    </tr>
                  ) : (
                    filteredKycs.map((kyc) => (
                      <tr key={kyc._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {kyc.userId?.name || 'Unknown User'}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                            {kyc.userId?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {new Date(kyc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(kyc.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedKyc(kyc)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            <Eye size={16} /> Review
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail Section */}
        <div className="lg:col-span-1">
          {selectedKyc ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 sticky top-24 transition-colors">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedKyc.userId?.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {selectedKyc.userId?.email}
                    </p>
                  </div>
                  {getStatusBadge(selectedKyc.status)}
                </div>

                <div className="space-y-4 mt-6">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Aadhar Number</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedKyc.aadharNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">PAN Number</p>
                    <p className="font-medium text-gray-900 dark:text-white uppercase">{selectedKyc.panNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedKyc.phoneNumber}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Submitted Documents</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">PAN Card</p>
                    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-2 border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <img 
                        src={`${API_URL}${selectedKyc.panCardPhotoUrl}`} 
                        alt="PAN Card" 
                        className="w-full h-auto rounded object-contain max-h-48"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Image+Not+Found'; }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">User Photo</p>
                    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-2 border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <img 
                        src={`${API_URL}${selectedKyc.submissionPhotoUrl}`} 
                        alt="User Photo" 
                        className="w-full h-auto rounded object-contain max-h-48"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found'; }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {selectedKyc.status === 'Pending' && (
                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex gap-3 rounded-b-lg">
                  <button
                    onClick={() => handleVerify(selectedKyc._id, 'Rejected')}
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerify(selectedKyc._id, 'Approved')}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Approve KYC
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center transition-colors">
              <Eye className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Submission Selected</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select a KYC submission from the list to review their details and documents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCManagement;
