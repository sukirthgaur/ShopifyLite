import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as usersApi from '../api/users';
import * as storesApi from '../api/stores';
import type { User, Store, PaginationMeta } from '../types';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';

const CustomerList = () => {
  const { user: currentUser } = useAuth();
  const isSuper = currentUser?.role === 'SUPER_ADMIN';

  const [customers, setCustomers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; role: string; storeId?: string } = {
        page: currentPage,
        limit: 10,
        role: 'CUSTOMER',
      };

      if (isSuper && selectedStoreFilter !== 'all') {
        params.storeId = selectedStoreFilter;
      }

      const res = await usersApi.getUsers(params);
      setCustomers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    if (!isSuper) return;
    try {
      const res = await storesApi.getStores({ limit: 100 });
      setStores(res.data.stores);
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, selectedStoreFilter]);

  useEffect(() => {
    fetchStores();
  }, []);

  const columns = [
    {
      header: 'Customer Name',
      accessor: (row: User) => (
        <div className="font-semibold text-gray-900 text-sm">{row.name}</div>
      ),
    },
    {
      header: 'Email Address',
      accessor: (row: User) => (
        <span className="font-mono text-xs text-gray-600">{row.email}</span>
      ),
    },
    ...(isSuper
      ? [
          {
            header: 'Registered Store',
            accessor: (row: User) =>
              row.store?.name ? (
                <span className="font-semibold text-gray-900 text-sm">{row.store.name}</span>
              ) : (
                <span className="text-gray-400 text-xs">—</span>
              ),
          },
        ]
      : []),
    {
      header: 'Joined Date',
      accessor: (row: User) =>
        new Date(row.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      className: 'text-gray-500 text-xs',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {isSuper ? 'Platform Customers' : 'Store Customers'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isSuper
              ? 'View and filter all store-scoped customer accounts across the platform.'
              : 'View customer accounts registered at your store.'}
          </p>
        </div>

        {/* Super Admin Store Filter Dropdown */}
        {isSuper && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Filter by Store:
            </label>
            <select
              value={selectedStoreFilter}
              onChange={(e) => {
                setSelectedStoreFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="all">All Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.slug})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <DataTable
          columns={columns}
          data={customers}
          isLoading={loading}
          emptyMessage="No customer accounts found."
        />
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-end">
            <Pagination pagination={pagination} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;
