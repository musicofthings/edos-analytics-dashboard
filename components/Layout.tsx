import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Beaker, Map, DollarSign, Menu, ExternalLink, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean }> = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { path: '/', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { path: '/tests', label: 'Test Explorer', icon: <Beaker size={20} /> },
    { path: '/pricing', label: 'Pricing Intel', icon: <DollarSign size={20} /> },
    { path: '/centers', label: 'Centers', icon: <Map size={20} /> },
  ];

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="h-24 flex items-center justify-center px-6 border-b border-gray-200 bg-white">
          <img 
            src="https://www.apollodiagnostics.in/assets/images/logo.png" 
            alt="Apollo Diagnostics" 
            className="h-16 w-auto object-contain"
            onError={(e) => {
              // Fallback to text if image fails to load
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerText = 'Apollo Diagnostics';
                parent.className = 'h-24 flex items-center justify-center font-bold text-xl text-blue-800';
              }
            }}
          />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.path}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-3">
          <a 
            href="https://edos.apollodiagnostics.in/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          >
             <span>Go to Official Site</span>
             <ExternalLink size={14} />
          </a>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-700">API Connected</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed w-full bg-white border-b border-gray-200 z-20 h-16 flex items-center px-4 justify-between">
         <img
            src="https://www.apollodiagnostics.in/assets/images/logo.png"
            alt="Apollo Diagnostics"
            className="h-10 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const span = document.createElement('span');
                span.className = 'font-bold text-blue-800';
                span.textContent = 'EDOS Analytics';
                parent.insertBefore(span, parent.firstChild);
              }
            }}
          />
         <button className="p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
           {mobileMenuOpen ? <X size={24} /> : <Menu />}
         </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <nav
            className="bg-white w-64 h-full pt-20 px-4 space-y-1 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 pt-20 md:pt-6">
        <div className="max-w-7xl mx-auto min-h-[calc(100vh-3rem)]">
          {children}
        </div>
      </main>

      {/* Floating Navigation Controls */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg border border-gray-200 flex flex-col gap-1">
          <button 
            onClick={handleScrollToTop} 
            className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-full text-gray-500 transition-colors"
            title="Scroll to Top"
          >
            <ArrowUp size={20} />
          </button>
          
          <div className="h-px bg-gray-200 w-full my-1"></div>

          <button 
            onClick={() => navigate('/')} 
            className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-full text-gray-500 transition-colors"
            title="Go Home"
          >
            <Home size={20} />
          </button>
          
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-full text-gray-500 transition-colors"
            title="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
          
          <button 
            onClick={() => navigate(1)} 
            className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-full text-gray-500 transition-colors"
            title="Go Forward"
          >
            <ArrowRight size={20} />
          </button>

          <div className="h-px bg-gray-200 w-full my-1"></div>

          <button 
            onClick={handleScrollToBottom} 
            className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-full text-gray-500 transition-colors"
            title="Scroll to Bottom"
          >
            <ArrowDown size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};