import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as storesApi from '../api/stores';
import type { Store } from '../types';

/**
 * Top Global Navigation Bar Component
 * Displays branding logo on the left (replaced with a store selection dropdown for Super Admins)
 * and user profile info + Sign Out controls on the right.
 */
const Navbar = () => {
  const { user, logout, actingStoreId, setActingStoreId, originalRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [stores, setStores] = useState<Store[]>([]);
  const navigate = useNavigate();

  const isSuper = originalRole === 'SUPER_ADMIN';

  useEffect(() => {
    const loadStores = async () => {
      if (isSuper) {
        try {
          const res = await storesApi.getStores({ page: 1, limit: 1000 });
          setStores(res.data.stores);
        } catch (err) {
          console.error('Error fetching stores list in Navbar', err);
        }
      }
    };
    loadStores();
  }, [isSuper]);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownOpen && !(e.target as Element).closest('#store-selector-dropdown')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  const handleStoreChange = (storeId: string) => {
    if (storeId === 'none') {
      setActingStoreId(null);
      navigate('/dashboard');
    } else {
      setActingStoreId(storeId);
      navigate('/manage');
    }
  };

  return (
    <nav className="h-16 border-b border-gray-100 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      
      {/* Top Left Area - Brand Logo / Super Admin Store Selector */}
      <div className="flex items-center space-x-3">
        {isSuper ? (
          <div className="relative" id="store-selector-dropdown">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-between gap-2 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-bold text-gray-900 bg-white shadow-sm hover:bg-gray-50 transition-all cursor-pointer min-w-[240px]"
            >
              <span className="truncate">
                {actingStoreId 
                  ? `🏬 ${stores.find(s => s.id === actingStoreId)?.name || 'Acting Store'}` 
                  : '🛡️ Shopify Lite (Super Admin)'}
              </span>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-250 ${dropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  type="button"
                  onClick={() => {
                    handleStoreChange('none');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-2 cursor-pointer ${
                    !actingStoreId ? 'bg-emerald-50/50 text-emerald-700' : 'text-gray-600'
                  }`}
                >
                  🛡️ Shopify Lite (Super Admin)
                </button>
                
                <div className="h-px bg-gray-100 my-1" />
                
                <div className="max-h-60 overflow-y-auto">
                  {stores.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        handleStoreChange(s.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-2 cursor-pointer ${
                        actingStoreId === s.id ? 'bg-emerald-50/50 text-emerald-700' : 'text-gray-600'
                      }`}
                    >
                      🏬 {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              {user?.role === 'STORE_ADMIN' && user.store?.name ? user.store.name : 'Shopify Lite'}
            </span>
            <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-md">
              MVP
            </span>
          </>
        )}
      </div>

      {/* Top Right Area - User Details & Sign Out */}
      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-3 text-right">
            <div>
              <p className="text-sm font-semibold text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
              originalRole === 'SUPER_ADMIN' 
                ? 'bg-rose-50 text-rose-600 border-rose-100' 
                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              {originalRole?.replace('_', ' ')} {actingStoreId && '(Acting)'}
            </span>
          </div>
        )}

        {/* Dark/Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          type="button"
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all cursor-pointer flex items-center justify-center dark-toggle-btn"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <svg className="w-5.5 h-5.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.001-.001z" />
            </svg>
          ) : (
            <svg className="w-5.5 h-5.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        <button
          onClick={logout}
          className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
