import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OverviewItem } from '../types';
import { StatCard } from './ui/StatCard';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Activity, Database, DollarSign, MapPin, TrendingUp, X, ShieldCheck, Lock } from 'lucide-react';
import { apiFetch, BASE_URL } from '../services/api';

export const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<OverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalItems, setModalItems] = useState<string[]>([]);
  const [modalType, setModalType] = useState<'specimen' | 'department' | null>(null);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<OverviewItem[]>('/overview', controller.signal);
        setKpis(data);
        setError(null);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError('Unable to load executive overview.');
          console.error(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  const getIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('test')) return <Activity size={20} />;
    if (l.includes('center')) return <MapPin size={20} />;
    if (l.includes('price') || l.includes('cost') || l.includes('revenue')) return <DollarSign size={20} />;
    return <Database size={20} />;
  };

  const handleCardClick = async (label: string) => {
    const l = label.toLowerCase();
    
    if (l.includes('specimen')) {
        setModalTitle('Select Specimen Type');
        setModalType('specimen');
        setModalOpen(true);
        setListLoading(true);
        try {
            const data = await apiFetch<string[]>('/filters/specimens');
            setModalItems(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setListLoading(false);
        }
    } else if (l.includes('department')) {
        setModalTitle('Select Department');
        setModalType('department');
        setModalOpen(true);
        setListLoading(true);
        try {
            const data = await apiFetch<string[]>('/filters/departments');
            setModalItems(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setListLoading(false);
        }
    } else {
        // Default navigation
        if (l.includes('test')) navigate('/tests');
        else if (l.includes('center')) navigate('/centers');
        else if (l.includes('price') || l.includes('revenue')) navigate('/pricing');
        else navigate('/tests');
    }
  };

  const handleItemClick = (item: string) => {
      setModalOpen(false);
      if (modalType === 'specimen') {
          navigate(`/tests?specimenId=${encodeURIComponent(item)}`);
      } else if (modalType === 'department') {
          navigate(`/tests?department=${encodeURIComponent(item)}`);
      }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 relative flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="flex-grow space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Overview</h1>
          <p className="text-gray-500 mt-1">Real-time metrics from EDOS Analytics API</p>
        </div>

        {error && (
          <div className="text-red-600 p-4 bg-red-50 rounded-lg border border-red-200">
              {error}
          </div>
        )}

        {!error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, idx) => (
              <StatCard
                key={idx}
                title={kpi.label}
                value={kpi.value != null ? kpi.value.toLocaleString() : '—'}
                icon={getIcon(kpi.label)}
                onClick={() => handleCardClick(kpi.label)}
              />
            ))}
            {kpis.length === 0 && (
              <div className="col-span-4 p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                  No overview metrics available.
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mt-8">
          <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Analytics Source</h3>
                <p className="text-gray-600 mt-1">
                    This dashboard is powered by a Cloudflare Worker edge function. 
                    Data is fetched directly from the authoritative source at <code>{BASE_URL}</code>.
                </p>
              </div>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-8 border-t border-gray-200 pt-6 pb-2">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
           <div>
              <p className="text-xs text-gray-500 flex items-center justify-center md:justify-start gap-1.5">
                <Lock size={12} className="text-gray-400" />
                This is for Apollo Diagnostics business use only, copyright &copy; 2026 Apollo Diagnostics.
              </p>
           </div>
           
           <div className="flex flex-col items-center md:items-end">
              <p className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-green-600"/>
                HIPAA and GDPR compliant
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                 Apollo Diagnostics GRL is a CAP and NABL Accredited Lab
              </p>
           </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                      <h3 className="font-bold text-lg text-gray-900">{modalTitle}</h3>
                      <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                      {listLoading ? (
                          <div className="flex justify-center py-8"><LoadingSpinner /></div>
                      ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {modalItems.map((item, idx) => (
                                  <button
                                      key={idx}
                                      onClick={() => handleItemClick(item)}
                                      className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors border border-transparent hover:border-blue-100 truncate"
                                      title={item}
                                  >
                                      {item}
                                  </button>
                              ))}
                              {modalItems.length === 0 && <p className="text-gray-500 text-sm col-span-2 text-center py-4">No items found.</p>}
                          </div>
                      )}
                  </div>
                  <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
                      <button 
                          onClick={() => setModalOpen(false)}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                      >
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};