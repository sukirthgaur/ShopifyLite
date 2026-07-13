import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as storesApi from '../api/stores';
import * as usersApi from '../api/users';
import Loader from '../components/Loader';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    storesCount: 0,
    usersCount: 0,
    ownStoreName: '',
    ownStoreSlug: '',
    ownStoreStatus: false,
  });

  // Post-login redirect logic (STORE_ADMIN only)
  useEffect(() => {
    if (user?.role === 'STORE_ADMIN') {
      if (user.storeId) {
        navigate('/manage', { replace: true });
      } else {
        navigate('/create-store', { replace: true });
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      // If the user is STORE_ADMIN, we redirect them immediately so no need to fetch stats
      if (user?.role === 'STORE_ADMIN') {
        return;
      }
      
      try {
        if (user?.role === 'SUPER_ADMIN') {
          const [storesRes, usersRes] = await Promise.all([
            storesApi.getStores({ limit: 1 }),
            usersApi.getUsers({ limit: 1 }),
          ]);
          setStats({
            storesCount: storesRes.data.pagination.total,
            usersCount: usersRes.data.pagination.total,
            ownStoreName: '',
            ownStoreSlug: '',
            ownStoreStatus: false,
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // If the user is STORE_ADMIN, render a loading screen before redirection
  if (user?.role === 'STORE_ADMIN' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="text-gray-500 mt-1">Here is what's happening with Shopify Lite today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Stores</p>
            <h3 className="text-4xl font-extrabold text-gray-950 mt-2">{stats.storesCount}</h3>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Users</p>
            <h3 className="text-4xl font-extrabold text-gray-950 mt-2">{stats.usersCount}</h3>
          </div>
          <div className="p-4 bg-teal-50 rounded-xl text-teal-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
