import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DiagnosticCenter } from '../types';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { MapPin, Search, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { apiFetch } from '../services/api';

export const Centers: React.FC = () => {
  const [centers, setCenters] = useState<DiagnosticCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    const fetchCenters = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<DiagnosticCenter[]>('/centers', controller.signal);
        setCenters(data);
        setError(null);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError("Failed to fetch centers.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    fetchCenters();
    return () => controller.abort();
  }, []);

  // Filter Logic
  const filteredCenters = useMemo(() => {
    return centers.filter(c => 
      c.city_name.toLowerCase().includes(query.toLowerCase()) || 
      c.center_code.toLowerCase().includes(query.toLowerCase())
    );
  }, [centers, query]);

  // Aggregation for Chart
  const cityStats = useMemo(() => {
    const counts: Record<string, number> = {};
    centers.forEach(c => {
      const city = c.city_name || 'Unknown';
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 cities
  }, [centers]);

  const handleCenterClick = (centerCode: string) => {
    navigate(`/tests?cityId=${encodeURIComponent(centerCode)}`);
  };

  if (loading && !centers.length) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Diagnostic Centers</h1>
        <p className="text-gray-500 mt-1">Network of {centers.length} active locations across {cityStats.length > 10 ? `${cityStats.length}+` : cityStats.length} cities</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: List */}
        <div className="flex-1 space-y-6">
          <div className="relative">
            <Search size={20} className="absolute inset-y-0 left-3 my-auto text-gray-400" />
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
                placeholder="Search by city or center code..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {error && <div className="text-red-600 p-4 bg-red-50 rounded-lg">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCenters.map((center, index) => (
              <div 
                key={index} 
                onClick={() => handleCenterClick(center.center_code)}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                      <MapPin size={20} />
                    </div>
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {center.center_code}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {center.city_name}
                  </h3>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-xs font-semibold text-gray-400 uppercase">
                   <span>Authorized Center</span>
                   <ArrowRight size={14} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
            {filteredCenters.length === 0 && !loading && (
                <div className="col-span-2 text-center text-gray-500 py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    No centers found matching "{query}"
                </div>
            )}
          </div>
        </div>

        {/* Right Column: Chart (Desktop only mainly) */}
        <div className="lg:w-1/3">
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Top Cities by Coverage</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityStats} layout="vertical" margin={{ left: 20 }}>
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" width={80} fontSize={11} interval={0} />
                     <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px' }} />
                     <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24}>
                        {cityStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index < 3 ? '#3b82f6' : '#93c5fd'} />
                        ))}
                     </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                 Data represents active center codes per city.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
};