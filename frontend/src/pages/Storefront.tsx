import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as storefrontApi from '../api/storefront';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import Loader from '../components/Loader';
import Modal from '../components/Modal';

interface PublicProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  categoryId: string | null;
  stock: number;
}

interface PublicStorefront {
  storeName: string;
  categories: { id: string; name: string }[];
  products: PublicProduct[];
}

export const getProductImageUrl = (url?: string) => {
  if (!url) return 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const backendUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:5000';
  return `${backendUrl}${url}`;
};

/**
 * Public Storefront Catalog View Page
 * Accessible anonymously. Renders active categories, filtering, and products with carousel modal.
 */
const Storefront = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal } = useCart();
  const { theme, toggleTheme } = useTheme();

  const [storefront, setStorefront] = useState<PublicStorefront | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Category selection and modal carousel states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Cart/Drawer & conflict states
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<{ product: PublicProduct; quantity: number } | null>(null);

  useEffect(() => {
    const fetchStorefront = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const res = await storefrontApi.getStorefront(slug);
        setStorefront(res.data);
      } catch (err: any) {
        setError(err?.message || 'Storefront is currently offline or does not exist.');
      } finally {
        setLoading(false);
      }
    };

    fetchStorefront();
  }, [slug]);

  const openProductModal = (product: PublicProduct) => {
    setSelectedProduct(product);
    setCarouselIndex(0);
    setOrderQuantity(1);
    setOrderLoading(false);
    setOrderError(null);
    setOrderSuccess(false);
    setModalOpen(true);
  };

  const handleAddToCart = () => {
    if (!selectedProduct || !storefront) return;

    if (user?.role === 'STORE_ADMIN' || user?.role === 'SUPER_ADMIN') {
      setOrderError('Admin accounts cannot place orders.');
      return;
    }

    const result = addToCart(
      {
        productId: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        image: selectedProduct.images[0] || '',
        stock: selectedProduct.stock,
      },
      orderQuantity,
      slug || '',
      storefront.storeName
    );

    if (result.conflict) {
      setPendingItem({ product: selectedProduct, quantity: orderQuantity });
      setConflictModalOpen(true);
      return;
    }

    setOrderSuccess(true);
    setModalOpen(false);
    setDrawerOpen(true);
  };

  const handleConfirmConflict = () => {
    if (!pendingItem || !storefront) return;
    clearCart();
    addToCart(
      {
        productId: pendingItem.product.id,
        name: pendingItem.product.name,
        price: pendingItem.product.price,
        image: pendingItem.product.images[0] || '',
        stock: pendingItem.product.stock,
      },
      pendingItem.quantity,
      slug || '',
      storefront.storeName,
      true
    );
    setConflictModalOpen(false);
    setPendingItem(null);
    setModalOpen(false);
    setDrawerOpen(true);
  };

  const nextImage = (imagesLength: number) => {
    setCarouselIndex((prev) => (prev + 1) % imagesLength);
  };

  const prevImage = (imagesLength: number) => {
    setCarouselIndex((prev) => (prev - 1 + imagesLength) % imagesLength);
  };

  const filteredProducts = storefront
    ? storefront.products.filter(p => {
        const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
        const matchesStock = !onlyInStock || p.stock > 0;
        return matchesCategory && matchesStock;
      })
    : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 space-y-4">
        <Loader size="lg" />
        <p className="text-sm font-semibold text-gray-500">Loading storefront catalog...</p>
      </div>
    );
  }

  if (error || !storefront) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center space-y-4">
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-600">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Storefront Offline</h1>
        <p className="text-gray-500 max-w-md">{error || 'This storefront does not exist or has been disabled by the system administrator.'}</p>
        <a
          href="/login"
          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-all cursor-pointer"
        >
          Sign In to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Public Storefront Top Bar */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 py-6 px-6 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {storefront.storeName}
          </h1>
          <div className="flex items-center space-x-4">
            {/* Cart Icon Button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative p-2 text-gray-600 hover:text-emerald-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 cursor-pointer flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

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

            {isAuthenticated ? (
              <>
                {user?.role === 'CUSTOMER' ? (
                  <Link
                    to="/my-orders"
                    className="text-xs font-semibold text-gray-600 hover:text-emerald-700 bg-gray-50 hover:bg-gray-100 px-3.5 py-2 rounded-xl transition-all border border-gray-200"
                  >
                    My Purchases
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="text-xs font-semibold text-gray-600 hover:text-emerald-700 bg-gray-50 hover:bg-gray-100 px-3.5 py-2 rounded-xl transition-all border border-gray-200"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-rose-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-all border border-emerald-100"
              >
                Sign In
              </Link>
            )}
            <span className="hidden sm:inline text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-wider">
              Verified Merchant
            </span>
          </div>
        </div>
      </header>

      {/* Main Catalog View */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 space-y-8">
        
        {/* Category Chips Filters & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 gap-4">
          {storefront.categories.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                All Items
              </button>
              {storefront.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          ) : (
            <div />
          )}

          {/* In Stock Filter Checkbox */}
          <div className="flex items-center justify-center space-x-2">
            <label className="relative flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-all select-none shadow-sm">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8">
            <p className="text-base font-semibold text-gray-700">No items available</p>
            <p className="text-sm text-gray-400 mt-1">This store has not listed any catalog items for this selection yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => openProductModal(product)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-md hover:border-gray-200/80 transition-all duration-200 group"
              >
                {/* Product Image */}
                <div className="aspect-square bg-gray-50 overflow-hidden relative border-b border-gray-5 group-hover:opacity-95 transition-opacity">
                  <img
                    src={getProductImageUrl(product.images[0])}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500';
                    }}
                  />
                  {product.images.length > 1 && (
                    <span className="absolute top-2 right-2 bg-black/60 text-[10px] text-white font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {product.images.length} images
                    </span>
                  )}
                </div>
                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-lg font-extrabold text-gray-950 font-mono">
                      ₹{product.price.toFixed(2)}
                    </span>
                    {product.stock > 0 ? (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        In stock
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-600 bg-rose-50 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Out of stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Product Detail Modal with Custom Image Carousel */}
      {selectedProduct && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={selectedProduct.name}
        >
          <div className="space-y-6">
            {/* Carousel Container */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
              <img
                src={getProductImageUrl(selectedProduct.images[carouselIndex])}
                alt={`${selectedProduct.name} - image ${carouselIndex + 1}`}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Prev/Next Controls */}
              {selectedProduct.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage(selectedProduct.images.length);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white shadow-md border border-gray-100 text-gray-700 transition-all cursor-pointer flex items-center justify-center focus:outline-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage(selectedProduct.images.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white shadow-md border border-gray-100 text-gray-700 transition-all cursor-pointer flex items-center justify-center focus:outline-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Indicator dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    {selectedProduct.images.map((_, i) => (
                      <span
                        key={i}
                        className={`block h-1.5 w-1.5 rounded-full transition-all ${
                          carouselIndex === i ? 'bg-white scale-125' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Price & Description */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold text-gray-950 font-mono">
                  ₹{selectedProduct.price.toFixed(2)}
                </span>
                {selectedProduct.stock > 0 ? (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    Ready to Order
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                    Out of Stock
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Add premium style and function to your collection. This high-quality {selectedProduct.name} is now available in our catalog.
              </p>
            </div>

            {/* Ordering Actions */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              {orderSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold rounded-2xl">
                  Added to cart successfully!
                </div>
              )}
              {orderError && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-2xl">
                  {orderError}
                </div>
              )}
              
              {selectedProduct.stock > 0 ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden self-start sm:self-auto bg-white">
                    <button
                      type="button"
                      disabled={orderQuantity <= 1 || orderLoading}
                      onClick={() => setOrderQuantity(prev => prev - 1)}
                      className="px-3.5 py-2.5 hover:bg-gray-50 text-gray-600 disabled:opacity-30 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={selectedProduct.stock}
                      value={orderQuantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setOrderQuantity(Math.min(selectedProduct.stock, Math.max(1, val)));
                      }}
                      disabled={orderLoading}
                      className="w-12 text-center text-sm font-bold bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900"
                    />
                    <button
                      type="button"
                      disabled={orderQuantity >= selectedProduct.stock || orderLoading}
                      onClick={() => setOrderQuantity(prev => prev + 1)}
                      className="px-3.5 py-2.5 hover:bg-gray-50 text-gray-600 disabled:opacity-30 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={orderLoading}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold rounded-xl shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50 text-sm transition-all"
                  >
                    Add to Cart
                  </button>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-6 bg-gray-100 text-gray-400 font-semibold rounded-xl text-sm"
                >
                  Out of Stock
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Cart Conflict Confirmation Modal */}
      {conflictModalOpen && pendingItem && (
        <Modal
          isOpen={conflictModalOpen}
          onClose={() => {
            setConflictModalOpen(false);
            setPendingItem(null);
          }}
          title="Different Store Detected"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You already have items from another store in your cart. Shopping from a different store will clear your current cart.
            </p>
            <p className="text-sm font-semibold text-gray-800">
              Would you like to clear your cart and add this item instead?
            </p>
            <div className="flex items-center gap-3 pt-4 justify-end">
              <button
                onClick={() => {
                  setConflictModalOpen(false);
                  setPendingItem(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConflict}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer shadow-md transition-all"
              >
                Clear & Add Item
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Slide-out Cart Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Shopping Cart
                </h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Items list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {items.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Your cart is empty</p>
                      <p className="text-xs text-gray-400 mt-1">Browse and add items to your cart</p>
                    </div>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.productId} className="flex gap-4 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                      <img
                        src={getProductImageUrl(item.image)}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-xl border border-gray-100 bg-gray-50 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500';
                        }}
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{item.name}</h4>
                          <p className="text-sm font-extrabold text-gray-950 mt-1 font-mono">₹{item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="px-2 py-1 text-gray-500 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-gray-800">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="px-2 py-1 text-gray-500 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                              disabled={item.quantity >= item.stock}
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Subtotal</span>
                    <span className="text-xl font-black text-gray-950 font-mono">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  {user?.role === 'STORE_ADMIN' || user?.role === 'SUPER_ADMIN' ? (
                    <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 text-center font-medium">
                      Admin accounts cannot place orders.
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setDrawerOpen(false);
                        navigate('/checkout');
                      }}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold rounded-xl text-center shadow-lg shadow-emerald-500/10 transition-all cursor-pointer text-sm"
                    >
                      Proceed to Checkout
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-6 text-center text-xs text-gray-400">
        <div className="max-w-6xl mx-auto">
          <p className="font-semibold text-gray-500">{storefront.storeName}</p>
          <p className="mt-1">Powered by Shopify Lite Multi-tenant Platform</p>
        </div>
      </footer>
    </div>
  );
};

export default Storefront;
