import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as storefrontApi from '../api/storefront';
import Loader from '../components/Loader';

interface PublicProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

interface PublicStorefront {
  storeName: string;
  products: PublicProduct[];
}

const Storefront = () => {
  const { slug } = useParams<{ slug: string }>();
  const [storefront, setStorefront] = useState<PublicStorefront | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {storefront.products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8">
            <p className="text-base font-semibold text-gray-700">No items available</p>
            <p className="text-sm text-gray-400 mt-1">This store has not listed any catalog items yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {storefront.products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Product Image */}
                <div className="aspect-square bg-gray-50 overflow-hidden relative border-b border-gray-50">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500';
                    }}
                  />
                </div>
                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-lg font-extrabold text-gray-950 font-mono">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      Instock
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

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
