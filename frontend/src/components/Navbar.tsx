import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as storesApi from '../api/stores';
import type { Store } from '../types';

/**
 * Top Global Navigation Bar Component
 * Displays branding logo on the left (replaced with a store selection dropdown for Super Admins)
 * and user profile info + Sign Out controls on the right.
 */
const Navbar = () => {
  const { user, logout, actingStoreId, setActingStoreId, originalRole } = useAuth();
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
          <div className="flex items-center space-x-2">
            <select
              value={actingStoreId || 'none'}
              onChange={(e) => handleStoreChange(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-bold text-gray-900 bg-white shadow-sm cursor-pointer"
            >
              <option value="none">Shopify Lite (Super Admin)</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  🏬 {s.name}
                </option>
              ))}
            </select>
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
