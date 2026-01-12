import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DiagnosticTest, PaginationEnvelope } from '../types';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ChevronLeft, ChevronRight, Search, Download, Filter, ChevronDown, ChevronUp, Beaker, Clock, FileText, Info } from 'lucide-react';

const BASE_URL = 'https://edos-analytics-api.shibi-kannan.workers.dev';

// Filter option types
interface FilterOptions {
  departments: string[];
  specimens: string[];
  diseases: string[];
}

export const TestExplorer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<PaginationEnvelope<DiagnosticTest> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  
  // Filter State
  const [query, setQuery] = useState('');
  // Initialize from URL param or default
  const [cityId, setCityId] = useState(searchParams.get('cityId') || 'GRL0001');
  const [department, setDepartment] = useState(searchParams.get('department') || '');
  const [specimen, setSpecimen] = useState(searchParams.get('specimenId') || '');
  const [disease, setDisease] = useState(searchParams.get('diseaseId') || '');

  // Dropdown Options State
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    departments: [],
    specimens: [],
    diseases: []
  });

  // Expanded Rows State
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  // Update filters if search params change (e.g. browser navigation or incoming links)
  useEffect(() => {
    setCityId(searchParams.get('cityId') || 'GRL0001');
    setDepartment(searchParams.get('department') || '');
    setSpecimen(searchParams.get('specimenId') || '');
    setDisease(searchParams.get('diseaseId') || '');
  }, [searchParams]);

  // 1. Fetch Filter Options on Mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [deptRes, specRes, disRes] = await Promise.all([
          fetch(`${BASE_URL}/filters/departments`),
          fetch(`${BASE_URL}/filters/specimens`),
          fetch(`${BASE_URL}/filters/diseases`)
        ]);

        const departments = await deptRes.json();
        const specimens = await specRes.json();
        const diseases = await disRes.json();

        setFilterOptions({
          departments: Array.isArray(departments) ? departments : [],
          specimens: Array.isArray(specimens) ? specimens : [],
          diseases: Array.isArray(diseases) ? diseases : []
        });
      } catch (err) {
        console.error("Failed to load filter metadata", err);
      }
    };
    fetchFilters();
  }, []);

  // 2. Fetch Tests when params change
  useEffect(() => {
    // Reset page when filters change (but not when page changes)
    // This effect handles the fetching logic based on current state
    const fetchTests = async () => {
      try {
        setLoading(true);
        const offset = (page - 1) * limit;
        
        // Construct API URL strictly
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());
        if (query.trim()) params.append('q', query.trim());
        if (cityId.trim()) params.append('cityId', cityId.trim());
        if (department) params.append('department', department);
        // Note: API expects IDs usually, but prompt implies names returned by filters. 
        // We pass the selected value.
        if (specimen) params.append('specimenId', specimen); 
        if (disease) params.append('diseaseId', disease);

        const response = await fetch(`${BASE_URL}/tests?${params.toString()}`);
        
        if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        setData(jsonData);
        setError(null);
      } catch (err) {
        setError("Failed to fetch tests catalog. Please verify connection to Cloudflare Worker.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
        fetchTests();
    }, 300); // Debounce

    return () => clearTimeout(timeoutId);
  }, [page, limit, query, cityId, department, specimen, disease]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [query, cityId, department, specimen, disease]);

  const toggleRow = (id: string | number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diagnostic Test Catalogue</h1>
          <p className="text-gray-500 mt-1">
             Authoritative list from <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">/tests</span> endpoint
          </p>
        </div>
        <a 
            href={`${BASE_URL}/export/tests.csv`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
        >
            <Download size={18} />
            Export CSV
        </a>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="lg:col-span-1 relative">
           <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Search</label>
           <div className="relative">
             <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
             <input
                type="text"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Code or Name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
             />
           </div>
        </div>

        {/* City ID */}
        <div>
           <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">City ID</label>
           <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              placeholder="e.g. GRL0001"
           />
        </div>

        {/* Department */}
        <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Department</label>
            <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
            >
                <option value="">All Departments</option>
                {filterOptions.departments.map((dept, idx) => (
                    <option key={idx} value={dept}>{dept}</option>
                ))}
            </select>
        </div>

        {/* Sample Type */}
        <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Sample Type</label>
            <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                value={specimen}
                onChange={(e) => setSpecimen(e.target.value)}
            >
                <option value="">All Samples</option>
                {filterOptions.specimens.map((spec, idx) => (
                    <option key={idx} value={spec}>{spec}</option>
                ))}
            </select>
        </div>

        {/* Disease */}
        <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Disease</label>
            <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                value={disease}
                onChange={(e) => setDisease(e.target.value)}
            >
                <option value="">All Diseases</option>
                {filterOptions.diseases.map((dis, idx) => (
                    <option key={idx} value={dis}>{dis}</option>
                ))}
            </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 flex items-center gap-2">
          <Info size={18} /> {error}
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner />
            <p className="text-center text-gray-500 mt-4">Syncing with EDOS Live API...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 w-10"></th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Test Name</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dept / Category</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">MRP</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">TAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.results.map((test, index) => {
                    const rowId = test.id || test.test_code || index;
                    const isExpanded = expandedRows.has(rowId);
                    
                    return (
                        <React.Fragment key={rowId}>
                            {/* Main Row */}
                            <tr 
                                className={`cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50 hover:bg-blue-50' : 'hover:bg-gray-50'}`}
                                onClick={() => toggleRow(rowId)}
                            >
                                <td className="px-6 py-4 text-gray-400">
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-blue-600 font-mono">
                                    {test.test_code}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{test.test_name}</div>
                                    {test.status && (
                                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${test.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {test.status}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">{test.department || test.department_name}</div>
                                    <div className="text-xs text-gray-500">{test.category}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                                    {test.mrp ? `₹${test.mrp}` : '—'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 text-right">
                                    {test.tat || '—'}
                                </td>
                            </tr>

                            {/* Expanded Detail Row */}
                            {isExpanded && (
                                <tr className="bg-blue-50/30">
                                    <td colSpan={6} className="px-6 py-4 border-b border-gray-100">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                            
                                            {/* Column 1: Specimen */}
                                            <div className="space-y-3">
                                                <h4 className="flex items-center gap-2 font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                                    <Beaker size={16} className="text-blue-500"/> Specimen & Pre-analytics
                                                </h4>
                                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                                    <span className="text-gray-500">Sample Type:</span>
                                                    <span className="font-medium text-gray-800">{test.sampleType_name || '—'}</span>
                                                    
                                                    <span className="text-gray-500">Container:</span>
                                                    <span className="text-gray-800">
                                                        {test.container || '—'} 
                                                        {test.color_name && <span className="ml-1 text-xs px-1.5 py-0.5 bg-gray-200 rounded-full">{test.color_name}</span>}
                                                    </span>

                                                    <span className="text-gray-500">Temperature:</span>
                                                    <span className="text-gray-800">{test.temp || '—'}</span>

                                                    <span className="text-gray-500">Instructions:</span>
                                                    <span className="text-gray-800 italic">{test.specimen_remarks || 'None'}</span>
                                                </div>
                                            </div>

                                            {/* Column 2: Logistics & TAT */}
                                            <div className="space-y-3">
                                                <h4 className="flex items-center gap-2 font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                                    <Clock size={16} className="text-orange-500"/> Logistics & Turnaround
                                                </h4>
                                                <div className="grid grid-cols-[110px_1fr] gap-2">
                                                    <span className="text-gray-500">Processing Days:</span>
                                                    <span className="text-gray-800">{test.test_processingday_day || '—'} ({test.test_processingday_dayType || '—'})</span>

                                                    <span className="text-gray-500">Cut-off:</span>
                                                    <span className="text-gray-800 text-xs font-mono bg-white px-1 border rounded">{test.cut_off || '—'}</span>

                                                    <span className="text-gray-500">Report Delivery:</span>
                                                    <span className="text-gray-800">{test.reportDelivery_days || '—'}</span>

                                                    <span className="text-gray-500">Last Modified:</span>
                                                    <span className="text-gray-800 text-xs">{test.last_tat_modified_date?.split('T')[0] || '—'}</span>
                                                </div>
                                            </div>

                                            {/* Column 3: Clinical & Operations */}
                                            <div className="space-y-3">
                                                <h4 className="flex items-center gap-2 font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                                    <FileText size={16} className="text-green-500"/> Clinical Context
                                                </h4>
                                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                                    <span className="text-gray-500">Disease:</span>
                                                    <span className="font-medium text-blue-700">{test.disease_name || '—'}</span>

                                                    <span className="text-gray-500">Methodology:</span>
                                                    <span className="text-gray-800">{test.methodology || '—'}</span>

                                                    <span className="text-gray-500">Frequency:</span>
                                                    <span className="text-gray-800">{test.frequency || '—'}</span>

                                                    <span className="text-gray-500">Processing Lab:</span>
                                                    <span className="text-gray-800">{test.processing_lab || test.centre_name || '—'}</span>
                                                </div>
                                            </div>

                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    );
                  })}
                  {data?.results.length === 0 && (
                     <tr>
                         <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                             No tests found matching your criteria.
                         </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.total > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <span className="text-sm text-gray-700">
                    Showing <span className="font-semibold">{((page - 1) * limit) + 1}</span> to <span className="font-semibold">{Math.min(page * limit, data.total)}</span> of <span className="font-semibold">{data.total}</span>
                </span>
                <div className="flex space-x-2">
                    <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                    >
                    <ChevronLeft size={16} />
                    </button>
                    <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                    >
                    <ChevronRight size={16} />
                    </button>
                </div>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};