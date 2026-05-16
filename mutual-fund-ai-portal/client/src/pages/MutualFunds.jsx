import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, ChevronRight, Archive, Star, Shield, Filter, TrendingUp, TrendingDown, LayoutGrid, List } from "lucide-react";
import { listMutualFunds, searchMutualFunds } from "../services/mutualFunds";
import { motion, AnimatePresence } from "framer-motion";

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
  if (val === null) return 0;
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
    if (val === null || val === undefined) return <span className="text-slate-400 dark:text-slate-600">--</span>;
    const num = parseFloat(val);
    if (num > 0) return <span className="text-emerald-600 dark:text-emerald-400 font-black">+{val}%</span>;
    if (num < 0) return <span className="text-rose-500 font-black">{val}%</span>;
    return <span className="text-slate-500 font-black">{val}%</span>;
  };

  return (
    <tr 
      onClick={onClick}
      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group border-b border-slate-100 dark:border-slate-800 last:border-0"
    >
      <td className="p-5">
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 shadow-sm transition-transform group-hover:scale-110 ${fund.status === 'Historical' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
            {fund.status === 'Historical' ? <Archive size={18} /> : fund.schemeName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs leading-tight">{fund.schemeName}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">AMC: {fund.schemeCode}</p>
          </div>
        </div>
      </td>
      <td className="p-5 hidden md:table-cell">
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${fund.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
          {fund.status}
        </span>
      </td>
      <td className="p-5 hidden lg:table-cell">
        <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700">
          {category}
        </span>
      </td>
      <td className="p-5 hidden xl:table-cell">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-400">
          <Shield size={14} className={risk === 'Very High' ? 'text-rose-500' : risk === 'Moderate' ? 'text-amber-500' : 'text-emerald-500'} />
          {risk}
        </div>
      </td>
      <td className="p-5">
        {rating > 0 ? (
          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg w-fit">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-black">{rating}</span>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-700 text-xs font-black">--</span>
        )}
      </td>
      <td className="p-5 text-sm tabular-nums">{formatReturn(fund.return1y)}</td>
      <td className="p-5 text-sm tabular-nums hidden sm:table-cell">{formatReturn(fund.return3y)}</td>
      <td className="p-5 text-sm tabular-nums hidden lg:table-cell">{formatReturn(fund.return5y)}</td>
      <td className="p-5 text-right">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10">
          <ChevronRight size={20} />
        </div>
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
    status: 'All',
    category: 'All',
    risk: 'All',
    rating: 'All',
    fundHouse: 'All'
  });

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== query) setQuery(q);
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
          ? await searchMutualFunds({ q: filterQuery, limit: 30, signal: controller.signal })
          : await listMutualFunds({ limit: 30, offset: 0, signal: controller.signal });
        if (!active) return;
        const activeFunds = Array.isArray(response?.active) ? response.active.map(f => ({ ...f, status: 'Active' })) : [];
        const historicalFunds = Array.isArray(response?.historical) ? response.historical.map(f => ({ ...f, status: 'Historical' })) : [];
        setAllFunds([...activeFunds, ...historicalFunds]);
      } catch (error) {
        if (error?.name !== "CanceledError") setAllFunds([]);
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
    <div className="w-full transition-colors duration-300 font-inter">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Advanced Search */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Discovery Hub</p>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Market Pulse</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md">Browse through thousands of direct and regular mutual fund schemes.</p>
          </div>
          
          <div className="flex flex-col gap-4 w-full lg:max-w-xl">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search schemes, AMCs, or categories..."
                className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[22px] focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 text-sm font-black text-slate-900 dark:text-white outline-none transition-all shadow-xl shadow-slate-200/20 dark:shadow-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
            
            {/* Quick Filter Selects */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600 mr-1">
                <Filter size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
              </div>
              
              {[
                { key: 'category', options: ['All', 'Equity', 'Debt', 'Hybrid'], prefix: 'Cat:' },
                { key: 'risk', options: ['All', 'Low', 'Moderate', 'Very High'], prefix: 'Risk:' },
                { key: 'rating', options: ['All', '5', '4', '3'], prefix: 'Rating:' },
                { key: 'status', options: ['All', 'Active', 'Historical'], prefix: 'Type:' }
              ].map(filter => (
                <select 
                  key={filter.key}
                  value={filters[filter.key]} 
                  onChange={e => setFilters({...filters, [filter.key]: e.target.value})}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-sm"
                >
                  {filter.options.map(opt => <option key={opt} value={opt}>{filter.prefix} {opt}</option>)}
                </select>
              ))}

              <select 
                value={filters.fundHouse} 
                onChange={e => setFilters({...filters, fundHouse: e.target.value})}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-sm max-w-[140px] truncate"
              >
                <option value="All">AMC: All</option>
                {fundHouses.filter(h => h !== 'All').map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Listings Table */}
        <div className="ui-card overflow-hidden dark:bg-slate-900/40 border-none shadow-2xl shadow-slate-200/30 dark:shadow-none">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-5 min-w-[280px]">Scheme Details</th>
                  <th className="px-6 py-5 hidden md:table-cell">Status</th>
                  <th className="px-6 py-5 hidden lg:table-cell">Category</th>
                  <th className="px-6 py-5 hidden xl:table-cell">Risk Pulse</th>
                  <th className="px-6 py-5">Rating</th>
                  <th className="px-6 py-5">1Y Return</th>
                  <th className="px-6 py-5 hidden sm:table-cell">3Y CAGR</th>
                  <th className="px-6 py-5 hidden lg:table-cell">5Y CAGR</th>
                  <th className="px-6 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] animate-pulse">Scanning Markets</p>
                      </div>
                    </td>
                  </tr>
                ) : displayedFunds.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-[22px] flex items-center justify-center text-slate-200 dark:text-slate-800">
                           <Search size={32} />
                        </div>
                        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Zero Results</p>
                        <p className="text-xs text-slate-400 font-medium max-w-[240px] mx-auto">We couldn't find any schemes matching your criteria. Try adjusting the filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedFunds.map((fund, idx) => (
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
