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

const FundRow = ({ fund, onClick }) => {
  const category = getFundCategory(fund.schemeName);
  const risk = getRiskLevel(category);
  
  const formatReturn = (val) => {
    if (val === null || val === undefined) return <span className="text-gray-500 dark:text-gray-400">--</span>;
    const num = parseFloat(val);
    if (num > 0) return <span className="text-green-600 dark:text-green-400 font-medium">+{val}%</span>;
    if (num < 0) return <span className="text-red-600 dark:text-red-400 font-medium">{val}%</span>;
    return <span className="text-gray-500 font-medium">{val}%</span>;
  };

  return (
    <tr 
      onClick={onClick}
      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 ${fund.status === 'Historical' ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
            {fund.status === 'Historical' ? <Archive size={18} /> : fund.schemeName.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[220px] lg:max-w-xs">{fund.schemeName}</p>
            <p className="text-xs text-gray-500 mt-0.5">AMC / Code: {fund.schemeCode}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${fund.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
          {fund.status}
        </span>
      </td>
      <td className="p-4">
        <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium">
          {category}
        </span>
      </td>
      <td className="p-4">
        <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
          <Shield size={14} className={risk === 'Very High' ? 'text-red-500' : risk === 'Moderate' ? 'text-yellow-500' : 'text-green-500'} />
          {risk}
        </span>
      </td>
      <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">--</td>
      <td className="p-4 text-sm">{formatReturn(fund.return1y)}</td>
      <td className="p-4 text-sm">{formatReturn(fund.return3y)}</td>
      <td className="p-4 text-sm">{formatReturn(fund.return5y)}</td>
      <td className="p-4 text-right">
        <ChevronRight className="inline-block text-gray-400 group-hover:text-blue-500 transition-colors" size={20} />
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
        const trimmedQuery = query.trim();
        const response = trimmedQuery.length >= 2
          ? await searchMutualFunds({ q: trimmedQuery, limit: 100, signal: controller.signal })
          : await listMutualFunds({ limit: 100, offset: 0, signal: controller.signal });

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

    const timeoutId = setTimeout(loadFunds, query.trim() ? 300 : 0);
    return () => {
      active = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

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
      const fh = fund.schemeName.split(' ')[0];

      if (filters.status !== 'All' && fund.status !== filters.status) return false;
      if (filters.category !== 'All' && cat !== filters.category) return false;
      if (filters.risk !== 'All' && risk !== filters.risk) return false;
      if (filters.fundHouse !== 'All' && fh !== filters.fundHouse) return false;
      
      // Rating is mocked to '--', so we ignore rating filter for now
      return true;
    });
  }, [allFunds, filters]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-6 lg:p-8 font-sans transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Mutual Funds</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Discover and invest in top mutual funds.</p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search mutual funds..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-sm placeholder-gray-400 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mr-2 text-sm font-medium">
                <Filter size={16} /> Filters:
              </div>
              
              <select 
                value={filters.status} 
                onChange={e => setFilters({...filters, status: e.target.value})}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">Status: All</option>
                <option value="Active">Active</option>
                <option value="Historical">Historical</option>
              </select>

              <select 
                value={filters.category} 
                onChange={e => setFilters({...filters, category: e.target.value})}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">Category: All</option>
                <option value="Equity">Equity</option>
                <option value="Debt">Debt</option>
                <option value="Hybrid">Hybrid</option>
              </select>

              <select 
                value={filters.risk} 
                onChange={e => setFilters({...filters, risk: e.target.value})}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">Risk: All</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="Very High">Very High</option>
              </select>

              <select 
                value={filters.fundHouse} 
                onChange={e => setFilters({...filters, fundHouse: e.target.value})}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 max-w-[120px] truncate"
              >
                <option value="All">Fund House: All</option>
                {fundHouses.filter(h => h !== 'All').map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>

              <select 
                value={filters.rating} 
                onChange={e => setFilters({...filters, rating: e.target.value})}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
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
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                  <th className="p-4 font-semibold">Fund Name</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Risk</th>
                  <th className="p-4 font-semibold">Rating</th>
                  <th className="p-4 font-semibold">1Y Return</th>
                  <th className="p-4 font-semibold">3Y Return</th>
                  <th className="p-4 font-semibold">5Y Return</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center">
                      <div className="flex items-center justify-center space-x-2 text-gray-400">
                        <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        <span>Loading funds...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedFunds.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-12 text-center text-gray-500">
                      <Search className="mx-auto h-8 w-8 text-gray-400 mb-3 opacity-50" />
                      <p>No funds found matching your criteria.</p>
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
