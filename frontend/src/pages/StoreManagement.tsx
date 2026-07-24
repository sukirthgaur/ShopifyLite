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

interface ProductFormValues {
  name: string;
  price: number;
  stock: number;
  categoryId: string | null;
  images: { url: string; file: File | null; previewUrl: string }[];
}

export const getProductImageUrl = (url?: string) => {
  if (!url) return 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100';
  if (url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const backendUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:5000';
  return `${backendUrl}${url}`;
};

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

  // Products table & stats states
  const [products, setProducts] = useState<Product[]>([]);
  const [productStats, setProductStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [productsLoading, setProductsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modals states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form error and submission states
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Form for Product Form with useFieldArray for multiple images
  const { register, control, handleSubmit, reset, watch } = useForm<ProductFormValues>({
    defaultValues: {
      name: '',
      price: 0,
      stock: 0,
      categoryId: '',
      images: [{ url: '', file: null, previewUrl: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'images'
  });

  const [isDragging, setIsDragging] = useState(false);

  const processMultipleFiles = (filesList: FileList | File[]) => {
    const filesArray = Array.from(filesList);
    const validFiles: File[] = [];

    for (const file of filesArray) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert(`"${file.name}" is not a supported image format (JPEG, PNG, WEBP).`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`"${file.name}" exceeds the 5MB size limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const currentCount = fields.length;
    const availableSlots = 5 - currentCount;

    if (availableSlots <= 0) {
      alert('Maximum limit of 5 images per product reached.');
      return;
    }

    const filesToAdd = validFiles.slice(0, availableSlots);

    if (validFiles.length > availableSlots) {
      alert(`Only ${availableSlots} image(s) could be added (max 5 images per product).`);
    }

    filesToAdd.forEach((file) => {
      append({
        url: '',
        file,
        previewUrl: URL.createObjectURL(file),
      });
    });
  };

  const handleMultipleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      processMultipleFiles(event.target.files);
      event.target.value = '';
    }
  };

  const handleDropzoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDropzoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDropzoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processMultipleFiles(e.dataTransfer.files);
    }
  };

  const watchedImages = watch('images');

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

  const fetchProductStats = async () => {
    if (!user?.storeId) return;
    try {
      const res = await productsApi.getProductStats();
      setProductStats(res.data);
    } catch (err) {
      console.error('Error fetching product stats', err);
    }
  };

  const fetchProducts = async () => {
    if (!user?.storeId) return;
    setProductsLoading(true);
    try {
      const res = await productsApi.getProducts({
        page: currentPage,
        limit: 10,
        categoryId: selectedCategoryFilter !== 'all' ? selectedCategoryFilter : undefined,
      });
      setProducts(res.data.products);
      setPaginationMeta(res.data.pagination);
    } catch (err) {
      console.error('Error fetching products list', err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreDetails();
    fetchCategories();
    fetchProductStats();
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [user?.storeId, currentPage, selectedCategoryFilter]);

  const openCreateModal = () => {
    setModalType('create');
    reset({
      name: '',
      price: 0,
      stock: 0,
      categoryId: '',
      images: []
    });
    setFormError(null);
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
      images: product.images.map(url => ({ url, file: null, previewUrl: url }))
    });
    setFormError(null);
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

    const hasNewImage = values.images.some(img => img.file);
    const hasExistingImage = values.images.some(img => img.url);

    if (!hasNewImage && !hasExistingImage) {
      setFormError('At least one product image is required');
      setIsSubmitting(false);
      return;
    }

    const hasEmptyImageSlot = values.images.some(img => !img.file && !img.url);
    if (hasEmptyImageSlot) {
      setFormError('Please select a file or remove empty image slots');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('price', String(priceNum));
      formData.append('stock', String(stockNum));
      formData.append('categoryId', values.categoryId || '');

      values.images.forEach(img => {
        if (img.file) {
          formData.append('images', img.file);
        } else if (img.url) {
          formData.append('existingImages', img.url);
        }
      });

      if (modalType === 'create') {
        await productsApi.createProduct(formData);
      } else if (modalType === 'edit' && selectedProduct) {
        await productsApi.updateProduct(selectedProduct.id, formData);
      }
      setModalOpen(false);
      fetchProducts();
      fetchProductStats();
    } catch (err: any) {
      setFormError(err?.message || 'Something went wrong. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    const targetId = selectedProduct.id;
    const isTargetActive = selectedProduct.isActive;

    // Optimistic UI update
    setProducts(prev => prev.filter(p => p.id !== targetId));
    setProductStats(prev => ({
      total: Math.max(0, prev.total - 1),
      active: isTargetActive ? Math.max(0, prev.active - 1) : prev.active,
      inactive: !isTargetActive ? Math.max(0, prev.inactive - 1) : prev.inactive,
    }));
    setModalOpen(false);

    try {
      await productsApi.deleteProduct(targetId);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete product');
      fetchProducts();
      fetchProductStats();
    }
  };

  const handleToggleActive = async (product: Product) => {
    const nextActive = !product.isActive;

    // Optimistic UI update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: nextActive } : p));
    setProductStats(prev => ({
      ...prev,
      active: nextActive ? prev.active + 1 : Math.max(0, prev.active - 1),
      inactive: nextActive ? Math.max(0, prev.inactive - 1) : prev.inactive + 1,
    }));

    try {
      const formData = new FormData();
      formData.append('isActive', String(nextActive));
      await productsApi.updateProduct(product.id, formData);
    } catch (err: any) {
      alert(err?.message || 'Failed to update product status');
      fetchProducts();
      fetchProductStats();
    }
  };

  const columns = [
    {
      header: 'Product details',
      accessor: (row: Product) => (
        <div className="flex items-center space-x-3">
          <img
            src={getProductImageUrl(row.images?.[0])}
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
              <h3 className="text-3xl font-extrabold text-gray-950 mt-2">{productStats.total}</h3>
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
              <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">{productStats.active}</h3>
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
              <h3 className="text-3xl font-extrabold text-amber-600 mt-2">{productStats.inactive}</h3>
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
            data={products}
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

          {/* Dynamic Images Dropzone and Preview Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Product Images ({fields.length} / 5)
              </label>
              <span className="text-xs text-gray-400 font-medium">Max 5 images</span>
            </div>

            {/* Dropzone for selecting or dragging multiple files */}
            {fields.length < 5 ? (
              <div
                onDragOver={handleDropzoneDragOver}
                onDragLeave={handleDropzoneDragLeave}
                onDrop={handleDropzoneDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]'
                    : 'border-gray-200 bg-gray-50/50 hover:border-emerald-400 hover:bg-emerald-50/20'
                }`}
              >
                <div className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-emerald-600 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Drag & drop images here, or{' '}
                    <label className="text-emerald-600 hover:text-emerald-700 underline font-bold cursor-pointer inline-block">
                      <span>browse files</span>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={handleMultipleFilesChange}
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Select multiple images (JPEG, PNG, WEBP — up to 5MB each)</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-medium text-center">
                Maximum limit of 5 images reached. Remove an image below to add a new one.
              </div>
            )}

            {/* Thumbnail Preview Grid */}
            {fields.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {fields.map((field, index) => {
                  const imgVal = watchedImages?.[index];
                  const previewSrc = imgVal?.previewUrl || imgVal?.url;
                  const isNewFile = !!imgVal?.file;

                  return (
                    <div key={field.id} className="border border-gray-200 rounded-xl p-3 bg-white shadow-sm flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {previewSrc ? (
                          <img
                            src={getProductImageUrl(previewSrc)}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-100 bg-gray-50 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                            No Img
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-gray-900 truncate">
                            {isNewFile ? imgVal.file?.name : `Image ${index + 1}`}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono truncate">
                            {isNewFile ? 'New Upload' : 'Existing Image'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-rose-100 transition-colors cursor-pointer flex-shrink-0"
                        title="Remove Image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
