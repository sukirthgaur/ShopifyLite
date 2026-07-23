import { useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import * as ordersApi from '../api/orders';
import { getProductImageUrl } from './Storefront';

const Checkout = () => {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const { user, logout } = useAuth();
  const { items, cartTotal, clearCart, storeSlug, storeName } = useCart();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const effectiveSlug = routeSlug || storeSlug || user?.store?.slug;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);

    const orderItems = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    try {
      const res = await ordersApi.placeOrder(orderItems);
      setSuccessOrder(res.data);
      clearCart();
    } catch (err: any) {
      setError(err?.message || 'Failed to place order. Please check item stock levels.');
    } finally {
      setLoading(false);
    }
  };

  // If order was successfully placed, render Success Confirmation state
  if (successOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 py-5 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Shopify Lite</h1>
            <div className="flex items-center space-x-3">
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
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 uppercase tracking-wide">
                Fulfillment Hub
              </span>
            </div>
          </div>
        </header>

        {/* Success content */}
        <main className="flex-1 max-w-md mx-auto w-full px-6 py-16 flex flex-col items-center text-center justify-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-md">
            <svg className="w-10 h-10 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-gray-900">Order Confirmed!</h2>
            <p className="text-sm text-gray-500">Thank you for your purchase. Your order is now being processed.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full text-left space-y-4">
            <div className="flex justify-between border-b border-gray-100 pb-3 text-xs text-gray-400 font-medium">
              <span>Order Reference</span>
              <span className="font-mono text-gray-900 select-all font-semibold">#{successOrder.orderNumber || successOrder.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Total Paid</span>
              <span className="font-extrabold text-gray-950 font-mono">₹{successOrder.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Status</span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wide">
                {successOrder.status}
              </span>
            </div>
          </div>

          <div className="flex flex-col w-full gap-3">
            <Link
              to={effectiveSlug ? `/store/${effectiveSlug}/orders` : "/my-orders"}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-center shadow-md transition-all text-sm"
            >
              Track Order Status
            </Link>
            {effectiveSlug && (
              <Link
                to={`/store/${effectiveSlug}`}
                className="w-full py-3 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-semibold rounded-xl text-center transition-all text-sm"
              >
                Continue Shopping
              </Link>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-100 py-6 px-6 text-center text-xs text-gray-400">
          <p>© 2026 Shopify Lite Multi-tenant Platform. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 py-5 px-6 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {storeSlug ? (
              <Link
                to={`/store/${storeSlug}`}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 bg-white transition-all flex items-center justify-center cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
            ) : (
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 bg-white transition-all flex items-center justify-center cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-extrabold text-gray-950 tracking-tight">Checkout</h1>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wide">
              {storeName || 'Store'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs font-semibold text-gray-500">
              Customer: <strong className="text-gray-900">{user?.name}</strong>
            </span>

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

            <button
              onClick={logout}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-100 transition-all cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Review and Checkout Columns */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Your cart is empty</p>
              <p className="text-xs text-gray-400 mt-1">Please return to the store and add items before placing an order.</p>
            </div>
            {storeSlug && (
              <Link
                to={`/store/${storeSlug}`}
                className="inline-block mt-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 rounded-xl shadow-md transition-all"
              >
                Back to Shop
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Review column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Review Items</h3>
                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <img
                        src={getProductImageUrl(item.image)}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl border border-gray-100 bg-gray-50 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500';
                        }}
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">Quantity: {item.quantity}</p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">₹{item.price.toFixed(2)} each</span>
                          <span className="text-sm font-extrabold text-gray-950 font-mono">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right checkout widget column */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Order Summary</h3>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium rounded-xl leading-relaxed">
                    {error}
                  </div>
                )}

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span className="font-bold text-gray-900 font-mono">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="text-emerald-600 font-bold uppercase tracking-wider text-xs">Free</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-3 text-base text-gray-950">
                    <span className="font-bold">Total Amount</span>
                    <span className="font-black font-mono text-lg">₹{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold rounded-xl text-center shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50 text-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Placing Order...
                    </>
                  ) : (
                    'Place Order (Atomically)'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 px-6 text-center text-xs text-gray-400">
        <p>© 2026 Shopify Lite Multi-tenant Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Checkout;
