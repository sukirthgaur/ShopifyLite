import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as storesApi from '../api/stores';
import * as productsApi from '../api/products';
import type { Store, Product, PaginationMeta } from '../types';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const StoreManagement = () => {
  const { user } = useAuth();

  // Store information states
  const [store, setStore] = useState<Store | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);

  // Products table states
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [productsLoading, setProductsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form input states
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStoreDetails = async () => {
    if (!user?.storeId) return;
    setStoreLoading(true);
    try {
      const res = await storesApi.getStoreById(user.storeId);
      setStore(res.data);
    } catch (err) {
      console.error('Error fetching store details', err);
    } finally {
      setStoreLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await productsApi.getProducts({ page: currentPage, limit: 10 });
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error fetching products list', err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreDetails();
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const openCreateModal = () => {
    setModalType('create');
    setName('');
    setPrice(0);
    setImageUrl('');
    setStock(0);
    setFormError(null);
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setModalType('edit');
    setName(product.name);
    setPrice(product.price);
    setImageUrl(product.imageUrl);
    setStock(product.stock);
    setFormError(null);
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const openDeleteModal = (product: Product) => {
    setModalType('delete');
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (price <= 0) {
      setFormError('Price must be a positive number');
      setIsSubmitting(false);
      return;
    }

    if (stock < 0) {
      setFormError('Stock cannot be negative');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = { name, price: Number(price), imageUrl, stock: Number(stock) };
      if (modalType === 'create') {
        await productsApi.createProduct(payload);
      } else if (modalType === 'edit' && selectedProduct) {
        await productsApi.updateProduct(selectedProduct.id, payload);
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err?.message || 'Something went wrong. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      await productsApi.deleteProduct(selectedProduct.id);
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete product');
    }
  };

  const columns = [
    {
      header: 'Product details',
      accessor: (row: Product) => (
        <div className="flex items-center space-x-3">
          <img
            src={row.imageUrl}
            alt={row.name}
            className="w-10 h-10 object-cover rounded-lg border border-gray-100 bg-gray-50 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100';
            }}
          />
          <span className="font-semibold text-gray-900">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Price',
      accessor: (row: Product) => (
        <span className="font-mono font-medium text-gray-900">${row.price.toFixed(2)}</span>
      ),
    },
    {
      header: 'Stock Inventory',
      accessor: (row: Product) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          row.stock > 10 
            ? 'bg-emerald-50 text-emerald-700' 
            : row.stock > 0 
            ? 'bg-amber-50 text-amber-700' 
            : 'bg-rose-50 text-rose-700'
        }`}>
          {row.stock} units
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: Product) => (
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

  const storefrontUrl = `${window.location.origin}/store/${store?.slug}`;

  return (
    <div className="space-y-8">
      {/* Top Section: Store Info Card */}
      {storeLoading ? (
        <div className="h-48 bg-white border border-gray-100 rounded-3xl animate-pulse" />
      ) : store ? (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-gray-950">{store.name}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                store.isActive 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {store.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-mono">Slug: {store.slug}</p>
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold hover:underline"
              >
                View Public Storefront
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-rose-50 text-rose-700 rounded-3xl border border-rose-100 text-center font-semibold">
          Error: Store properties could not be loaded.
        </div>
      )}

      {/* Bottom Section: Product Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-950">Store Inventory Products</h2>
            <p className="text-sm text-gray-500">Manage items catalog, pricing, images, and track active stock counts.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer text-sm"
          >
            Add Product
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <DataTable
            columns={columns}
            data={products}
            isLoading={productsLoading}
            emptyMessage="No products seeded yet. Create your first product above."
          />
          <Pagination pagination={pagination} onPageChange={setCurrentPage} />
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen && modalType !== 'delete'}
        onClose={() => setModalOpen(false)}
        title={modalType === 'create' ? 'Create Product Catalog Item' : 'Modify Product details'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900"
              placeholder="e.g. Classic Premium T-Shirt"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Price ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={price || ''}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-950 font-mono"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-950 font-mono"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Image URL Link
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-950 font-mono"
              placeholder="https://images.unsplash.com/..."
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
              {modalType === 'create' ? 'Create Product' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={modalOpen && modalType === 'delete'}
        onClose={() => setModalOpen(false)}
        title="Delete Product"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong className="text-gray-900 font-semibold">{selectedProduct?.name}</strong>? This action cannot be undone and will permanently remove this item from your catalog.
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

export default StoreManagement;
