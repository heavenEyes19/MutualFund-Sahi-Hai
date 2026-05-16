import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Search, Eye, AlertCircle, Shield, ArrowRight, UserCheck, UserX } from 'lucide-react';
import kycService from '../../services/kycService';
import { motion, AnimatePresence } from 'framer-motion';

const KYCManagement = () => {
  const [kycs, setKycs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKyc, setSelectedKyc] = useState(null);

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

  useEffect(() => { fetchKYCs(); }, []);

  const handleVerify = async (id, status) => {
    try {
      await kycService.verifyKYC(id, status);
      await fetchKYCs();
      if (selectedKyc && selectedKyc._id === id) {
        setSelectedKyc({ ...selectedKyc, status });
      }
    } catch (err) {
      alert('Failed to update KYC status');
      console.error(err);
    }
  };

  const filteredKycs = kycs.filter((kyc) => {
    const search = searchTerm.toLowerCase();
    const name = kyc.userId?.name?.toLowerCase() || 'unknown user';
    const email = kyc.userId?.email?.toLowerCase() || '';
    const aadhar = kyc.aadharNumber || '';
    const pan = kyc.panNumber?.toLowerCase() || '';
    return name.includes(search) || email.includes(search) || aadhar.includes(search) || pan.includes(search);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"><CheckCircle2 size={12} /> Approved</span>;
      case 'Rejected':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20"><Clock size={12} /> Pending</span>;
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <div className="w-full transition-colors duration-300 font-inter">

      {/* Header */}
      <header className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Compliance & Verification</p>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">KYC Management</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Verify investor identities to maintain platform regulatory compliance.</p>
      </header>

      {error && (
        <div className="mb-8 flex items-start gap-4 p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-[28px]">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
          <p className="text-sm font-black text-rose-700 dark:text-rose-400 uppercase tracking-tight">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── List ── */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="ui-card overflow-hidden dark:bg-slate-900/40">
            {/* Search bar */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, Aadhaar, or PAN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4">Investor Detail</th>
                    <th className="px-6 py-4">Submitted</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-8 h-8 border-3 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Vault...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredKycs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-20 text-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">
                        No KYC submissions found in vault.
                      </td>
                    </tr>
                  ) : (
                    filteredKycs.map((kyc) => (
                      <tr
                        key={kyc._id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group ${selectedKyc?._id === kyc._id ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}
                        onClick={() => setSelectedKyc(kyc)}
                      >
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-900 dark:text-white text-[13px] leading-tight mb-1">{kyc.userId?.name || 'Unknown User'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{kyc.userId?.email}</p>
                        </td>
                        <td className="px-6 py-5 text-[12px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">{new Date(kyc.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-6 py-5">{getStatusBadge(kyc.status)}</td>
                        <td className="px-6 py-5 text-right">
                          <div className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                             <Eye size={14} />
                             <span className="text-[10px] font-black uppercase tracking-widest">Open</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Detail Panel ── */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-32">
          <AnimatePresence mode="wait">
            {selectedKyc ? (
              <motion.div 
                key={selectedKyc._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="ui-card dark:bg-slate-900/50 overflow-hidden shadow-2xl"
              >
                <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-600" />

                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{selectedKyc.userId?.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Investor Profile</p>
                    </div>
                    {getStatusBadge(selectedKyc.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    {[
                      { label: 'Aadhaar ID', value: selectedKyc.aadharNumber },
                      { label: 'PAN Identity', value: selectedKyc.panNumber, mono: true },
                      { label: 'Verified Phone', value: selectedKyc.phoneNumber },
                      { label: 'Email Address', value: selectedKyc.userId?.email, full: true },
                    ].map(({ label, value, mono, full }) => (
                      <div key={label} className={full ? 'col-span-2' : ''}>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">{label}</p>
                        <p className={`text-[13px] font-black text-slate-900 dark:text-white ${mono ? 'uppercase' : ''}`}>{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 space-y-8 bg-slate-50/30 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Document Evidence</h4>
                  <div className="grid grid-cols-1 gap-6">
                    {[
                      { label: 'PAN Card Scan', url: selectedKyc.panCardPhotoUrl },
                      { label: 'Verification Selfie', url: selectedKyc.submissionPhotoUrl },
                    ].map(({ label, url }) => (
                      <div key={label} className="group">
                        <div className="flex items-center justify-between mb-3 px-1">
                           <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{label}</p>
                           <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">View Full</button>
                        </div>
                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[28px] overflow-hidden shadow-inner group-hover:border-indigo-500/50 transition-all">
                          <img
                            src={`${API_URL}${url}`}
                            alt={label}
                            className="w-full h-auto object-contain max-h-48 group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Identity+Proof+Not+Found'; }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedKyc.status === 'Pending' ? (
                  <div className="p-6 grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleVerify(selectedKyc._id, 'Rejected')}
                      className="flex items-center justify-center gap-2 py-4 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-rose-600 hover:text-white transition-all group"
                    >
                      <UserX size={16} className="group-hover:rotate-12 transition-transform" /> Reject
                    </button>
                    <button
                      onClick={() => handleVerify(selectedKyc._id, 'Approved')}
                      className="flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 hover:-translate-y-1 active:translate-y-0 transition-all group"
                    >
                      <UserCheck size={16} className="group-hover:scale-110 transition-transform" /> Approve
                    </button>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified on {new Date().toLocaleDateString()}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] h-[500px] flex flex-col items-center justify-center p-10 text-center"
              >
                <div className="w-16 h-16 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-6 shadow-sm">
                  <Shield className="text-slate-300 dark:text-slate-700" size={32} />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">Review Vault Empty</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium leading-relaxed">Select a pending application from the left to begin the verification protocol.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default KYCManagement;
