import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as storefrontApi from '../api/storefront';
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

/**
 * Public Storefront Catalog View Page
 * Accessible anonymously. Renders active categories, filtering, and products with carousel modal.
 */
const Storefront = () => {
  const { slug } = useParams<{ slug: string }>();
  const [storefront, setStorefront] = useState<PublicStorefront | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Category selection and modal carousel states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

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
    setModalOpen(true);
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
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
            Verified Merchant
          </span>
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
                    src={product.images[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500'}
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
                src={selectedProduct.images[carouselIndex] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500'}
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
          </div>
        </Modal>
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
