import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import * as storesApi from '../api/stores';
import * as productsApi from '../api/products';
import * as categoriesApi from '../api/categories';
import type { Store, Product, PaginationMeta, Category } from '../types';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import Toggle from '../components/Toggle';
import Loader from '../components/Loader';
import { uploadImage } from '../api/uploads';

interface ProductFormValues {
  name: string;
  price: number;
  stock: number;
  categoryId: string | null;
  images: { url: string }[];
}

/**
 * Store Management Admin Dashboard Page
 * Allows merchants to configure store properties, categories, catalog items, and inventory details.
 */
const StoreManagement = () => {
  const { user } = useAuth();

  // Store information states
  const [store, setStore] = useState<Store | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);

  // Categories list
  const [categories, setCategories] = useState<Category[]>([]);

  // Products table states
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Modals states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form error and submission states
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Form for Product Form with useFieldArray for multiple images
  const { register, control, handleSubmit, reset, setValue, watch } = useForm<ProductFormValues>({
    defaultValues: {
      name: '',
      price: 0,
      stock: 0,
      categoryId: '',
      images: [{ url: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'images'
  });

  // Track upload states (loading & errors) per field array row ID
  const [uploadStates, setUploadStates] = useState<Record<string, { uploading: boolean; error: string | null }>>({});

  const handleFileChange = async (index: number, fieldId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStates((prev) => ({
      ...prev,
      [fieldId]: { uploading: true, error: null },
    }));

    try {
      const res = await uploadImage(file);
      if (res.success && res.data?.url) {
        setValue(`images.${index}.url`, res.data.url);
        setUploadStates((prev) => ({
          ...prev,
          [fieldId]: { uploading: false, error: null },
        }));
      } else {
        throw new Error(res.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      const errorMsg = err?.message || err?.errors?.[0] || 'Upload failed. Please try again.';
      setUploadStates((prev) => ({
        ...prev,
        [fieldId]: { uploading: false, error: errorMsg },
      }));
    }
  };

  const watchedImages = watch('images');

  // Client-side filtering and pagination calculations
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategoryFilter === 'all' || p.categoryId === selectedCategoryFilter;
    return matchesCategory;
  });

  const itemsPerPage = 10;
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Adjust page number if it goes out of range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const paginationMeta: PaginationMeta = {
    page: currentPage,
    limit: itemsPerPage,
    total: totalItems,
    totalPages: totalPages
  };

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

  const fetchCategories = async () => {
    if (!user?.storeId) return;
    try {
      const res = await categoriesApi.getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories list', err);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      // Fetch products list with a high limit for client-side filtering/stats
      const res = await productsApi.getProducts({ page: 1, limit: 1000 });
      setProducts(res.data.products);
    } catch (err) {
      console.error('Error fetching products list', err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreDetails();
    fetchCategories();
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [user?.storeId]);

  const openCreateModal = () => {
    setModalType('create');
    reset({
      name: '',
      price: 0,
      stock: 0,
      categoryId: '',
      images: [{ url: '' }]
    });
    setFormError(null);
    setUploadStates({});
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setModalType('edit');
    reset({
      name: product.name,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId || '',
      images: product.images.map(url => ({ url }))
    });
    setFormError(null);
    setUploadStates({});
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const openDeleteModal = (product: Product) => {
    setModalType('delete');
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleProductSubmit = async (values: ProductFormValues) => {
    setFormError(null);
    setIsSubmitting(true);

    const priceNum = Number(values.price);
    const stockNum = Number(values.stock);

    if (priceNum <= 0) {
      setFormError('Price must be a positive number');
      setIsSubmitting(false);
      return;
    }

    if (stockNum < 0) {
      setFormError('Stock cannot be negative');
      setIsSubmitting(false);
      return;
    }

    const imageUrls = values.images.map(img => img.url.trim()).filter(Boolean);
    if (imageUrls.length === 0) {
      setFormError('At least one valid uploaded image is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: values.name,
        price: priceNum,
        stock: stockNum,
        categoryId: values.categoryId || null,
        images: imageUrls
      };

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

  const handleToggleActive = async (product: Product) => {
    try {
      await productsApi.updateProduct(product.id, { isActive: !product.isActive });
      fetchProducts();
    } catch (err: any) {
      alert(err?.message || 'Failed to update product status');
    }
  };

  const columns = [
    {
      header: 'Product details',
      accessor: (row: Product) => (
        <div className="flex items-center space-x-3">
          <img
            src={row.images?.[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100'}
            alt={row.name}
            className="w-10 h-10 object-cover rounded-lg border border-gray-100 bg-gray-50 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100';
            }}
          />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">{row.name}</span>
            {row.categoryId && (
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100/50 rounded-full px-2 py-0.2 w-fit mt-0.5">
                {categories.find(c => c.id === row.categoryId)?.name || 'Category'}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Price',
      accessor: (row: Product) => (
        <span className="font-mono font-medium text-gray-900">₹{row.price.toFixed(2)}</span>
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
      header: 'Quick Action',
      accessor: (row: Product) => (
        <div className="flex items-center space-x-2">
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
      )
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

      {/* Stats Summary Section */}
      {!storeLoading && store && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Products</p>
              <h3 className="text-3xl font-extrabold text-gray-950 mt-2">{products.length}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Active Products</p>
              <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">{products.filter(p => p.isActive).length}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Inactive Products</p>
              <h3 className="text-3xl font-extrabold text-amber-600 mt-2">{products.filter(p => !p.isActive).length}</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
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

        {/* Category Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-2 gap-4">
          <div className="text-sm text-gray-500 font-medium px-2">
            Showing all catalog items configured for your store storefront.
          </div>

          <div className="flex items-center space-x-2 pb-2 sm:pb-0 px-2">
            <label htmlFor="adminCategoryFilter" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Filter by Category:
            </label>
            <select
              id="adminCategoryFilter"
              value={selectedCategoryFilter}
              onChange={(e) => { setSelectedCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs text-gray-900 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <DataTable
            columns={columns}
            data={paginatedProducts}
            isLoading={productsLoading}
            emptyMessage="No products found matching the criteria."
          />
          <Pagination pagination={paginationMeta} onPageChange={setCurrentPage} />
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen && modalType !== 'delete'}
        onClose={() => setModalOpen(false)}
        title={modalType === 'create' ? 'Create Product Catalog Item' : 'Modify Product details'}
      >
        <form onSubmit={handleSubmit(handleProductSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
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
              {...register('name', { required: 'Product name is required' })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900"
              placeholder="e.g. Classic Premium T-Shirt"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Price (₹ INR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register('price', { required: 'Price is required' })}
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
                {...register('stock', { required: 'Stock is required' })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-950 font-mono"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Category
            </label>
            <select
              {...register('categoryId')}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900 bg-white"
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Images Field Array */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Product Images
            </label>
            <div className="space-y-3">
              {fields.map((field, index) => {
                const currentUrl = watchedImages?.[index]?.url;
                const state = uploadStates[field.id];

                return (
                  <div key={field.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-2">
                    <input
                      type="hidden"
                      {...register(`images.${index}.url` as const, { required: 'Image is required' })}
                    />
                    
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 flex items-center gap-3">
                        {state?.uploading ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium py-1.5">
                            <Loader size="sm" />
                            <span>Uploading image...</span>
                          </div>
                        ) : currentUrl ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={currentUrl}
                              alt={`Product Preview ${index + 1}`}
                              className="w-14 h-14 object-cover rounded-lg border border-gray-200 bg-white"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100';
                              }}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">Uploaded successfully</span>
                              <a
                                href={currentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-emerald-600 hover:underline truncate max-w-[200px] font-mono"
                              >
                                {currentUrl}
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full">
                            <div className="flex items-center gap-2">
                              <label className="relative flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 rounded-lg bg-white text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:border-emerald-500 cursor-pointer transition-all">
                                <span>Select Image File</span>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="sr-only"
                                  onChange={(e) => handleFileChange(index, field.id, e)}
                                />
                              </label>
                              <span className="text-[11px] text-gray-400">JPEG, PNG, or WEBP (Max 5MB)</span>
                            </div>
                            {state?.error && (
                              <div className="text-xs font-semibold text-rose-600 mt-1 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>{state.error}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg px-3 py-1.5 transition-all cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => append({ url: '' })}
              className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              + Add Image
            </button>
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
