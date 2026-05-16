import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, ChevronRight, Archive, Star, Shield, Filter } from "lucide-react";
import { listMutualFunds, searchMutualFunds } from "../services/mutualFunds";

const getFundCategory = (schemeName) => {
  if (!schemeName) return 'Equity';
  const name = schemeName.toLowerCase();
  if (name.includes('debt') || name.includes('liquid') || name.includes('bond') || name.includes('gilt') || name.includes('fixed')) return 'Debt';
  if (name.includes('hybrid') || name.includes('balanced') || name.includes('dynamic') || name.includes('arbitrage')) return 'Hybrid';
  return 'Equity';
};

const getRiskLevel = (category) => {
  if (category === 'Equity') return 'Very High';
  if (category === 'Hybrid') return 'Moderate';
  return 'Low';
};

const calculateRating = (fund) => {
  const r1 = parseFloat(fund.return1y);
  const r3 = parseFloat(fund.return3y);
  const r5 = parseFloat(fund.return5y);
  
  const val = !isNaN(r5) ? r5 : (!isNaN(r3) ? r3 : (!isNaN(r1) ? r1 : null));
  if (val === null) return 0; // Unrated
  
  if (val >= 20) return 5;
  if (val >= 15) return 4;
  if (val >= 10) return 3;
  if (val >= 5) return 2;
  return 1;
};

const FundRow = ({ fund, onClick }) => {
  const category = getFundCategory(fund.schemeName);
  const risk = getRiskLevel(category);
  const rating = calculateRating(fund);
  
  const formatReturn = (val) => {
    if (val === null || val === undefined) return <span className="text-slate-400">--</span>;
    const num = parseFloat(val);
    if (num > 0) return <span className="text-emerald-500 font-medium">+{val}%</span>;
    if (num < 0) return <span className="text-red-500 font-medium">{val}%</span>;
    return <span className="text-slate-500 font-medium">{val}%</span>;
  };

  return (
    <tr 
      onClick={onClick}
      className="hover:bg-slate-50 transition-colors cursor-pointer group border-b border-slate-100 last:border-0"
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 ${fund.status === 'Historical' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
            {fund.status === 'Historical' ? <Archive size={18} /> : fund.schemeName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 truncate max-w-[220px] lg:max-w-xs">{fund.schemeName}</p>
            <p className="text-xs text-slate-500 mt-0.5">AMC / Code: {fund.schemeCode}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${fund.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
          {fund.status}
        </span>
      </td>
      <td className="p-4">
        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold">
          {category}
        </span>
      </td>
      <td className="p-4">
        <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <Shield size={14} className={risk === 'Very High' ? 'text-red-500' : risk === 'Moderate' ? 'text-amber-500' : 'text-emerald-500'} />
          {risk}
        </span>
      </td>
      <td className="p-4">
        {rating > 0 ? (
          <span className="flex items-center gap-1 text-sm text-slate-900">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="font-bold">{rating}</span>
          </span>
        ) : (
          <span className="text-slate-400 text-sm">--</span>
        )}
      </td>
      <td className="p-4 text-sm">{formatReturn(fund.return1y)}</td>
      <td className="p-4 text-sm">{formatReturn(fund.return3y)}</td>
      <td className="p-4 text-sm">{formatReturn(fund.return5y)}</td>
      <td className="p-4 text-right">
        <ChevronRight className="inline-block text-slate-300 group-hover:text-emerald-500 transition-colors" size={20} />
      </td>
    </tr>
  );
};

export default function MutualFunds() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [allFunds, setAllFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    status: 'All', // All, Active, Historical
    category: 'All', // All, Equity, Debt, Hybrid
    risk: 'All', // All, Low, Moderate, Very High
    rating: 'All',
    fundHouse: 'All'
  });

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== query) {
      setQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    const params = {};
    const trimmedQuery = query.trim();
    if (trimmedQuery) params.q = trimmedQuery;
    setSearchParams(params, { replace: true });
  }, [query, setSearchParams]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadFunds = async () => {
      setLoading(true);
      try {
        const terms = [];
        if (query.trim()) terms.push(query.trim());
        if (filters.fundHouse !== 'All') terms.push(filters.fundHouse);
        if (filters.category !== 'All') terms.push(filters.category);
        
        const filterQuery = terms.join(' ').trim();

        const response = filterQuery.length >= 2
          ? await searchMutualFunds({ q: filterQuery, limit: 20, signal: controller.signal })
          : await listMutualFunds({ limit: 20, offset: 0, signal: controller.signal });

        if (!active) return;
        
        const activeFunds = Array.isArray(response?.active) ? response.active.map(f => ({ ...f, status: 'Active' })) : [];
        const historicalFunds = Array.isArray(response?.historical) ? response.historical.map(f => ({ ...f, status: 'Historical' })) : [];
        
        setAllFunds([...activeFunds, ...historicalFunds]);
      } catch (error) {
        if (error?.name !== "CanceledError") {
          setAllFunds([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const timeoutId = setTimeout(loadFunds, 300);
    return () => {
      active = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, filters.fundHouse, filters.category]);

  // Extract unique fund houses
  const fundHouses = useMemo(() => {
    const houses = new Set();
    allFunds.forEach(fund => {
      const house = fund.schemeName.split(' ')[0];
      if (house && house.length > 2) houses.add(house);
    });
    return ['All', ...Array.from(houses).sort()];
  }, [allFunds]);

  const displayedFunds = useMemo(() => {
    return allFunds.filter(fund => {
      const cat = getFundCategory(fund.schemeName);
      const risk = getRiskLevel(cat);
      const rating = calculateRating(fund);
      const fh = fund.schemeName.split(' ')[0];

      if (filters.status !== 'All' && fund.status !== filters.status) return false;
      if (filters.category !== 'All' && cat !== filters.category) return false;
      if (filters.risk !== 'All' && risk !== filters.risk) return false;
      if (filters.fundHouse !== 'All' && fh !== filters.fundHouse) return false;
      
      if (filters.rating !== 'All') {
        const targetRating = parseInt(filters.rating, 10);
        if (rating < targetRating) return false;
      }

      return true;
    });
  }, [allFunds, filters]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 p-6 lg:p-8 font-sans transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Mutual Funds</h1>
            <p className="text-slate-500 mt-1 font-medium">Discover and invest in top mutual funds.</p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search mutual funds..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow text-sm placeholder-slate-400 text-slate-900 shadow-sm"
              />
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-slate-500 mr-2 text-sm font-semibold">
                <Filter size={16} /> Filters:
              </div>
              
              <select 
                value={filters.status} 
                onChange={e => setFilters({...filters, status: e.target.value})}
                className="bg-white border border-slate-200 text-slate-700 font-medium text-xs rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
              >
                <option value="All">Status: All</option>
                <option value="Active">Active</option>
                <option value="Historical">Historical</option>
              </select>

              <select 
                value={filters.category} 
                onChange={e => setFilters({...filters, category: e.target.value})}
                className="bg-white border border-slate-200 text-slate-700 font-medium text-xs rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
              >
                <option value="All">Category: All</option>
                <option value="Equity">Equity</option>
                <option value="Debt">Debt</option>
                <option value="Hybrid">Hybrid</option>
              </select>

              <select 
                value={filters.risk} 
                onChange={e => setFilters({...filters, risk: e.target.value})}
                className="bg-white border border-slate-200 text-slate-700 font-medium text-xs rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
              >
                <option value="All">Risk: All</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="Very High">Very High</option>
              </select>

              <select 
                value={filters.fundHouse} 
                onChange={e => setFilters({...filters, fundHouse: e.target.value})}
                className="bg-white border border-slate-200 text-slate-700 font-medium text-xs rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm max-w-[120px] truncate"
              >
                <option value="All">Fund House: All</option>
                {fundHouses.filter(h => h !== 'All').map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>

              <select 
                value={filters.rating} 
                onChange={e => setFilters({...filters, rating: e.target.value})}
                className="bg-white border border-slate-200 text-slate-700 font-medium text-xs rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
              >
                <option value="All">Ratings: All</option>
                <option value="5">5 Star</option>
                <option value="4">4+ Star</option>
                <option value="3">3+ Star</option>
              </select>

            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 font-bold">Fund Name</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Category</th>
                  <th className="p-4 font-bold">Risk</th>
                  <th className="p-4 font-bold">Rating</th>
                  <th className="p-4 font-bold">1Y Return</th>
                  <th className="p-4 font-bold">3Y Return</th>
                  <th className="p-4 font-bold">5Y Return</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-400">
                      <div className="animate-pulse flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-medium">Loading mutual funds...</p>
                      </div>
                    </td>
                  </tr>
                ) : displayedFunds.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Search size={40} className="text-slate-300 mb-2" />
                        <p className="text-lg font-bold text-slate-900">No mutual funds found</p>
                        <p className="text-sm font-medium">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedFunds.map((fund) => (
                    <FundRow 
                      key={fund.schemeCode} 
                      fund={fund} 
                      onClick={() => navigate(`/dashboard-area/mutual-funds/${fund.schemeCode}`)} 
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
