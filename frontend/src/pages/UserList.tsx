import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as usersApi from '../api/users';
import * as storesApi from '../api/stores';
import type { User, Store, PaginationMeta, Role } from '../types';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const UserList = () => {
  const { user: currentUser } = useAuth();
  const isSuper = currentUser?.role === 'SUPER_ADMIN';

  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('STORE_ADMIN');
  const [storeId, setStoreId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getUsers({ page: currentPage, limit: 10 });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  useEffect(() => {
    fetchStores();
  }, []);

  const openCreateModal = () => {
    setModalType('create');
    setName('');
    setEmail('');
    setPassword('');
    setRole('STORE_ADMIN');
    setStoreId('');
    setFormError(null);
    setSelectedUser(null);
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setModalType('edit');
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setStoreId(user.storeId || '');
    setFormError(null);
    setSelectedUser(user);
    setModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setModalType('delete');
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (modalType === 'create') {
        const payload: any = { name, email, password, role };
        if (role === 'STORE_ADMIN' && storeId) {
          payload.storeId = storeId;
        }
        await usersApi.createUser(payload);
      } else if (modalType === 'edit' && selectedUser) {
        const payload: any = { name, email };
        if (password) {
          payload.password = password;
        }
        if (isSuper) {
          payload.role = role;
          if (role === 'STORE_ADMIN' && storeId) {
            payload.storeId = storeId;
          } else {
            payload.storeId = null;
          }
        }
        await usersApi.updateUser(selectedUser.id, payload);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err?.message || 'Something went wrong');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await usersApi.deleteUser(selectedUser.id);
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete user');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' as keyof User },
    { header: 'Email', accessor: 'email' as keyof User },
    {
      header: 'Role',
      accessor: (row: User) => (
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
          row.role === 'SUPER_ADMIN' 
            ? 'bg-rose-50 text-rose-600 border-rose-100' 
            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
        }`}>
          {row.role.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Assigned Store',
      accessor: (row: User) => {
        if (row.role === 'SUPER_ADMIN') return <span className="text-gray-400">—</span>;
        return row.store?.name ? (
          <span className="font-semibold text-gray-900">{row.store.name}</span>
        ) : (
          <span className="text-amber-500 font-medium">Unassigned</span>
        );
      },
    },
    {
      header: 'Actions',
      accessor: (row: User) => {
        const canEdit = isSuper || row.id === currentUser?.id || row.storeId === currentUser?.storeId;
        const canDelete = isSuper && row.id !== currentUser?.id;

        return (
          <div className="flex space-x-2">
            {canEdit && (
              <button
                onClick={() => openEditModal(row)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => openDeleteModal(row)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Delete
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {isSuper ? 'User Management' : 'Store Team Members'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isSuper 
              ? 'View all global accounts, modify roles, and link admins to storefronts.' 
              : 'View and manage users associated with your store.'}
          </p>
        </div>

        {isSuper && (
          <button
            onClick={openCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer text-sm"
          >
            Create User
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <DataTable columns={columns} data={users} isLoading={loading} emptyMessage="No team members found." />
        <Pagination pagination={pagination} onPageChange={setCurrentPage} />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen && modalType !== 'delete'}
        onClose={() => setModalOpen(false)}
        title={modalType === 'create' ? 'Create User Account' : 'Modify User Account'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900"
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900"
              placeholder="e.g. jane@store.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Password {modalType === 'edit' && '(leave blank to keep current)'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={modalType === 'create'}
              minLength={8}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900"
              placeholder="••••••••"
            />
          </div>

          {isSuper && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900"
                >
                  <option value="STORE_ADMIN">Store Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              {role === 'STORE_ADMIN' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Associate Store
                  </label>
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900"
                  >
                    <option value="">Unassigned</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
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
              {modalType === 'create' ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={modalOpen && modalType === 'delete'}
        onClose={() => setModalOpen(false)}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the user account for <strong className="text-gray-900 font-semibold">{selectedUser?.name}</strong> ({selectedUser?.email})? This action cannot be undone.
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

export default UserList;
