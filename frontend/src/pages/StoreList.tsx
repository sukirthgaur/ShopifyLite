import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as storesApi from '../api/stores';
import type { Store, PaginationMeta } from '../types';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const StoreList = () => {
  const { user, refreshProfile } = useAuth();
  const isSuper = user?.role === 'SUPER_ADMIN';

  const [stores, setStores] = useState<Store[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await storesApi.getStores({ page: currentPage, limit: 10 });
      setStores(res.data.stores);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [currentPage, user]);

  const openCreateModal = () => {
    setModalType('create');
    setName('');
    setSlug('');
    setIsActive(true);
    setFormError(null);
    setSelectedStore(null);
    setModalOpen(true);
  };

  const openEditModal = (store: Store) => {
    setModalType('edit');
    setName(store.name);
    setSlug(store.slug);
    setIsActive(store.isActive);
    setFormError(null);
    setSelectedStore(store);
    setModalOpen(true);
  };

  const openDeleteModal = (store: Store) => {
    setModalType('delete');
    setSelectedStore(store);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      setFormError('Slug must contain only lowercase letters, numbers, and hyphens');
      return;
    }

    try {
      if (modalType === 'create') {
        await storesApi.createStore({ name, slug });
        // Refresh session profile in case user role or storeId changes
        await refreshProfile();
      } else if (modalType === 'edit' && selectedStore) {
        await storesApi.updateStore(selectedStore.id, isSuper ? { name, slug, isActive } : { name, slug });
      }
      setModalOpen(false);
      fetchStores();
    } catch (err: any) {
      setFormError(err?.message || 'Something went wrong');
    }
  };

  const handleDelete = async () => {
    if (!selectedStore) return;
    try {
      await storesApi.deleteStore(selectedStore.id);
      setModalOpen(false);
      fetchStores();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete store');
    }
  };

  const columns = [
    { header: 'Store Name', accessor: 'name' as keyof Store },
    { header: 'Slug', accessor: 'slug' as keyof Store },
    {
      header: 'Status',
      accessor: (row: Store) => (
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
          row.isActive 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
            : 'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: Store) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openEditModal(row)}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Edit
          </button>
          {isSuper && (
            <button
              onClick={() => openDeleteModal(row)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  const hasStore = stores.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {isSuper ? 'Stores Directory' : 'My Store Details'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isSuper 
              ? 'Manage all merchant stores, adjust status, and create new tenants.' 
              : 'Configure your e-commerce store properties.'}
          </p>
        </div>

        {!isSuper && !hasStore && (
          <button
            onClick={openCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer text-sm"
          >
            Create Store
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-500 shadow-sm animate-pulse">
          Loading store properties...
        </div>
      ) : hasStore ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <DataTable columns={columns} data={stores} isLoading={loading} />
          {isSuper && (
            <Pagination pagination={pagination} onPageChange={setCurrentPage} />
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-500 shadow-sm">
          <p className="text-base font-semibold text-gray-700">No store configured</p>
          <p className="text-sm text-gray-400 mt-1">Get started by creating your e-commerce storefront details.</p>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen && modalType !== 'delete'}
        onClose={() => setModalOpen(false)}
        title={modalType === 'create' ? 'Create Storefront' : 'Modify Storefront'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Store Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900"
              placeholder="e.g. My Awesome Shop"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Slug URL
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900 font-mono"
              placeholder="e.g. my-awesome-shop"
            />
          </div>

          {isSuper && modalType === 'edit' && (
            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                Active storefront
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer text-sm"
            >
              {modalType === 'create' ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={modalOpen && modalType === 'delete'}
        onClose={() => setModalOpen(false)}
        title="Delete Store"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong className="text-gray-900 font-semibold">{selectedStore?.name}</strong>? This action cannot be undone and will affect all users linked to this store.
          </p>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer text-sm"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StoreList;
