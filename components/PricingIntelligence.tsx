import React, { useEffect, useState, useMemo, useRef } from 'react';
import { PricingEntry } from '../types';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Search, Filter, X, BarChart3, Table as TableIcon, GitCompare, Plus, Check } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import { apiFetch } from '../services/api';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16'];

interface AnalyticsMetrics {
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  deptStats: { name: string; avg: number; count: number }[];
  distribution: { name: string; count: number }[];
}

export const PricingIntelligence: React.FC = () => {
  const [data, setData] = useState<PricingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('dashboard');

  // Interactive Filters
  const [query, setQuery] = useState('');
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Comparison State
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [comparisonSearch, setComparisonSearch] = useState('');
  const [showComparisonDropdown, setShowComparisonDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowComparisonDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPricing = async () => {
      try {
        setLoading(true);
        const pricingData = await apiFetch<PricingEntry[]>('/pricing/enriched', controller.signal);
        setData(pricingData);
        setError(null);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError("Failed to load enriched pricing data.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    fetchPricing();
    return () => controller.abort();
  }, []);

  // --- Aggregation & Filtering Engine ---

  const { uniqueDepts, uniqueCities } = useMemo(() => {
    const depts = new Set<string>();
    const cities = new Set<string>();
    data.forEach(d => {
      if (d.department) depts.add(d.department);
      if (d.city) cities.add(d.city);
    });
    return {
      uniqueDepts: Array.from(depts).sort(),
      uniqueCities: Array.from(cities).sort()
    };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = 
        item.test_name.toLowerCase().includes(query.toLowerCase()) ||
        item.test_code.toLowerCase().includes(query.toLowerCase());
      
      const matchesDept = selectedDepts.length === 0 || selectedDepts.includes(item.department);
      const matchesCity = selectedCities.length === 0 || selectedCities.includes(item.city);

      return matchesSearch && matchesDept && matchesCity;
    });
  }, [data, query, selectedDepts, selectedCities]);

  // Comparison Data Logic
  const comparisonResults = useMemo(() => {
      if (!comparisonSearch.trim()) return [];
      return data.filter(d => 
        (d.test_name.toLowerCase().includes(comparisonSearch.toLowerCase()) || 
        d.test_code.toLowerCase().includes(comparisonSearch.toLowerCase())) &&
        !selectedTests.has(d.test_code)
      ).slice(0, 8); // Limit dropdown results
  }, [data, comparisonSearch, selectedTests]);

  const comparisonData = useMemo(() => {
    if (selectedTests.size === 0) return [];
    return data
      .filter(item => selectedTests.has(item.test_code))
      .map(item => ({
        name: item.test_name.length > 15 ? item.test_name.substring(0,15)+'...' : item.test_name,
        fullName: item.test_name,
        price: parseFloat(item.mrp) || 0,
        city: item.city,
        code: item.test_code
      }));
  }, [data, selectedTests]);

  // Analytics Calculations
  const analytics = useMemo<AnalyticsMetrics | null>(() => {
    if (filteredData.length === 0) return null;

    const prices = filteredData.map(d => parseFloat(d.mrp) || 0).filter(p => !isNaN(p) && p > 0);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) || 0;
    const minPrice = Math.min(...prices) || 0;
    const maxPrice = Math.max(...prices) || 0;

    // Dept Breakdown
    const deptMap: Record<string, { total: number; count: number }> = {};
    filteredData.forEach(d => {
      const dept = d.department || 'Unknown';
      if (!deptMap[dept]) deptMap[dept] = { total: 0, count: 0 };
      const price = parseFloat(d.mrp) || 0;
      deptMap[dept].total += price;
      deptMap[dept].count += 1;
    });

    const deptStats = Object.entries(deptMap)
      .map(([name, stats]) => ({
        name,
        avg: Math.round(stats.total / stats.count),
        count: stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Increased slice to show more depts on full width chart

    // Price Distribution
    const buckets: Record<string, number> = {};
    const bucketSize = 500;
    prices.forEach(p => {
      const b = Math.floor(p / bucketSize) * bucketSize;
      const key = `${b}`;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    const distribution = Object.entries(buckets)
      .map(([range, count]) => ({ range: parseInt(range), count }))
      .sort((a, b) => a.range - b.range)
      .map(d => ({ name: `₹${d.range}-${d.range + bucketSize}`, count: d.count }));

    return { avgPrice, minPrice, maxPrice, deptStats, distribution };
  }, [filteredData]);

  // Handle Pagination reset
  useEffect(() => setPage(1), [query, selectedDepts, selectedCities]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600 p-6 bg-red-50 rounded-lg">{error}</div>;

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedResults = filteredData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleFilter = (set: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    set(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const toggleSelection = (testCode: string) => {
    setSelectedTests(prev => {
      const next = new Set(prev);
      if (next.has(testCode)) next.delete(testCode);
      else next.add(testCode);
      return next;
    });
  };

  const renderCustomBarLabel = (props: any): React.ReactElement<SVGElement> => {
      const { x, y, width, value } = props;
      if (width < 20) return <text />; // Hidden if bar is too small
      return <text x={x + width / 2} y={y - 5} fill="#666" textAnchor="middle" fontSize={10}>₹{`${value}`}</text>;
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing Intelligence</h1>
          <p className="text-gray-500 mt-1">
            Analyzing {filteredData.length} records 
            {(selectedDepts.length > 0 || selectedCities.length > 0) && ' (Filtered)'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm self-start xl:self-auto">
          <button 
            onClick={() => setViewMode('dashboard')}
            className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <BarChart3 size={18} /> <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="h-6 w-px bg-gray-200"></div>
          <button 
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <TableIcon size={18} /> <span className="hidden sm:inline">Data Grid</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Filters Sidebar */}
        <div className={`lg:w-64 flex-shrink-0 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-6">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                 <Filter size={16} /> Filters
               </h3>
               {(selectedDepts.length > 0 || selectedCities.length > 0) && (
                 <button 
                   onClick={() => { setSelectedDepts([]); setSelectedCities([]); }}
                   className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                 >
                   Clear All
                 </button>
               )}
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Departments</p>
                <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                  {uniqueDepts.map(dept => (
                    <label key={dept} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedDepts.includes(dept)}
                        onChange={() => toggleFilter(setSelectedDepts, dept)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 truncate">{dept}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Cities</p>
                <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                  {uniqueCities.map(city => (
                    <label key={city} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedCities.includes(city)}
                        onChange={() => toggleFilter(setSelectedCities, city)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 truncate">{city}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-6">
          
          <button 
            className="lg:hidden w-full py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Comparison Builder Section */}
          <div className="bg-white border border-blue-100 p-6 rounded-xl shadow-sm">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                 <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <GitCompare className="text-blue-600" size={20} />
                        Pricing Comparison
                    </h3>
                    <p className="text-sm text-gray-500">Select multiple tests to compare MRPs side-by-side</p>
                 </div>
                 
                 {/* Search & Select Input */}
                 <div className="relative w-full md:w-80" ref={dropdownRef}>
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Add test to compare..."
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={comparisonSearch}
                        onChange={(e) => {
                            setComparisonSearch(e.target.value);
                            setShowComparisonDropdown(true);
                        }}
                        onFocus={() => setShowComparisonDropdown(true)}
                    />
                    {showComparisonDropdown && comparisonSearch.trim().length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {comparisonResults.length > 0 ? (
                                comparisonResults.map(test => (
                                    <button 
                                        key={test.test_code}
                                        onClick={() => {
                                            toggleSelection(test.test_code);
                                            setComparisonSearch('');
                                            setShowComparisonDropdown(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center justify-between group"
                                    >
                                        <div className="truncate pr-2">
                                            <div className="font-medium text-gray-900 truncate">{test.test_name}</div>
                                            <div className="text-xs text-gray-500">{test.test_code} • {test.city}</div>
                                        </div>
                                        <Plus size={16} className="text-blue-600 opacity-0 group-hover:opacity-100" />
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-gray-500">No matching tests found</div>
                            )}
                        </div>
                    )}
                 </div>
             </div>

             {/* Selected Chips */}
             <div className="flex flex-wrap gap-2 mb-6">
                 {Array.from(selectedTests).map(code => {
                     const t = data.find(d => d.test_code === code);
                     return t ? (
                         <div key={code} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-100">
                             <span className="truncate max-w-[150px]">{t.test_name}</span>
                             <button onClick={() => toggleSelection(code)} className="hover:text-blue-900"><X size={14}/></button>
                         </div>
                     ) : null;
                 })}
                 {selectedTests.size === 0 && (
                     <div className="text-sm text-gray-400 italic">No tests selected. Use the search above or checkboxes in the table.</div>
                 )}
                 {selectedTests.size > 0 && (
                     <button onClick={() => setSelectedTests(new Set())} className="text-xs text-red-600 hover:underline self-center ml-2">Clear All</button>
                 )}
             </div>

             {/* Comparison Chart */}
             {selectedTests.size > 0 && (
                <div className="h-80 md:h-96 w-full bg-gray-50/50 rounded-lg border border-gray-200 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" unit="₹" tick={{fontSize: 10}} />
                            <YAxis dataKey="name" type="category" width={140} fontSize={11} tick={{fill: '#6b7280'}} />
                            <Tooltip 
                                cursor={{fill: '#e5e7eb'}} 
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                formatter={(value: any) => [`₹${value}`, 'MRP']}
                            />
                            <Bar dataKey="price" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} label={renderCustomBarLabel}>
                                {comparisonData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             )}
          </div>

          {/* DASHBOARD VIEW */}
          {viewMode === 'dashboard' && analytics && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
               {/* KPI Row */}
               <div className="col-span-1 xl:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500">Avg. Market Price</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">₹{analytics.avgPrice.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500">Lowest Price</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">₹{analytics.minPrice.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500">Highest Price</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">₹{analytics.maxPrice.toLocaleString()}</p>
                    </div>
                </div>

              {/* Chart 1: Distribution */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1 xl:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Price Range Distribution</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.distribution}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={11} minTickGap={30} tick={{fill: '#6b7280'}} />
                      <YAxis fontSize={11} tick={{fill: '#6b7280'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} 
                        formatter={(value: any) => [`${value}`, 'Count']}
                      />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Dept Avg - FULL WIDTH */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1 xl:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Avg MRP by Department</h3>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.deptStats} layout="vertical" margin={{ left: 50, right: 30, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={120} fontSize={10} interval={0} tick={{fill: '#4b5563'}} />
                      <Tooltip 
                        cursor={{fill: '#f3f4f6'}} 
                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }} 
                        formatter={(value: any) => [`${value}`, 'Avg MRP']}
                      />
                      <Bar dataKey="avg" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fontSize: 10, fill: '#666' }}>
                        {analytics.deptStats.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Market Share - FULL WIDTH */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1 xl:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Market Share (Volume)</h3>
                <div className="h-96 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.deptStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="count"
                        label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        fontSize={10}
                      >
                        {analytics.deptStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                      <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{fontSize: '11px'}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TABLE VIEW */}
          <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm ${viewMode === 'dashboard' ? 'hidden' : 'block'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-12 px-6 py-3"></th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Test Code</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">City</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">MRP</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">TAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedResults.map((item, idx) => {
                    const isSelected = selectedTests.has(item.test_code);
                    return (
                        <tr key={`${item.test_code}-${idx}`} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                        <td className="px-6 py-3">
                            <button 
                                onClick={() => toggleSelection(item.test_code)}
                                className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-transparent hover:border-blue-400'}`}
                            >
                                <Check size={12} strokeWidth={3} />
                            </button>
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-blue-600">{item.test_code}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">{item.test_name}</td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs">{item.department}</span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">{item.city}</td>
                        <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">{item.mrp}</td>
                        <td className="px-6 py-3 text-sm text-gray-500 text-xs text-right">{item.tat}</td>
                        </tr>
                    );
                  })}
                  {paginatedResults.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-gray-500">No records found matching your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {paginatedResults.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <span className="text-sm text-gray-700">
                  Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
                </span>
                <div className="flex space-x-2">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 text-sm">Prev</button>
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 text-sm">Next</button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};