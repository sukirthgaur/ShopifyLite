import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as categoriesApi from '../api/categories';
import type { Category } from '../types';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Toggle from '../components/Toggle';

/**
 * Category Manager Admin Page
 * Provides full scoped CRUD interface for categories.
 */
const CategoryManager = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoriesApi.getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user?.storeId]);

  const openCreateModal = () => {
    setModalType('create');
    setName('');
    setFormError(null);
    setSelectedCategory(null);
    setModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setModalType('edit');
    setName(category.name);
    setFormError(null);
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const openDeleteModal = (category: Category) => {
    setModalType('delete');
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (modalType === 'create') {
        await categoriesApi.createCategory({ name });
      } else if (modalType === 'edit' && selectedCategory) {
        await categoriesApi.updateCategory(selectedCategory.id, { name });
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setFormError(err?.message || 'Something went wrong. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    const targetId = selectedCategory.id;

    // Optimistic UI update
    setCategories(prev => prev.filter(c => c.id !== targetId));
    setModalOpen(false);

    try {
      await categoriesApi.deleteCategory(targetId);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete category');
      fetchCategories();
    }
  };

  const handleToggleActive = async (category: Category) => {
    const nextActive = !category.isActive;

    // Optimistic UI update
    setCategories(prev => prev.map(c => c.id === category.id ? { ...c, isActive: nextActive } : c));

    try {
      await categoriesApi.updateCategory(category.id, { isActive: nextActive });
    } catch (err: any) {
      alert(err?.message || 'Failed to update category status');
      fetchCategories();
    }
  };

  const columns = [
    {
      header: 'Category Name',
      accessor: 'name' as keyof Category,
    },
    {
      header: 'Status',
      accessor: (row: Category) => (
        <div className="flex items-center space-x-3">
          <Toggle
            checked={row.isActive}
            onChange={() => handleToggleActive(row)}
          />
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
            row.isActive 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
              : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            {row.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: Category) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openEditModal(row)}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Category Manager</h1>
          <p className="text-gray-500 mt-1">Organize products into categories for easier storefront browsing.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer text-sm"
        >
          Add Category
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <DataTable
          columns={columns}
          data={categories}
          isLoading={loading}
          emptyMessage="No categories found. Click 'Add Category' to create one."
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen && modalType !== 'delete'}
        onClose={() => setModalOpen(false)}
        title={modalType === 'create' ? 'Create Category' : 'Modify Category'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Category Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900"
              placeholder="e.g. Apparel, Accessories, Electronics"
            />
          </div>

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
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer text-sm"
            >
              {modalType === 'create' ? 'Create Category' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={modalOpen && modalType === 'delete'}
        onClose={() => setModalOpen(false)}
        title="Delete Category"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong className="text-gray-900 font-semibold">{selectedCategory?.name}</strong>? Any products in this category will have their category unassigned (set to None). This action cannot be undone.
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

export default CategoryManager;
