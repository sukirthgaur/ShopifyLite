import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as ordersApi from '../api/orders';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import type { Order, OrderStatus } from '../types';

const MyOrders = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { storeSlug } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ordersApi.getOrders(page, limit);
      setOrders(res.data.orders);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const getStatusBadge = (status: OrderStatus) => {
    const configs: Record<OrderStatus, { text: string; classes: string }> = {
      PENDING: { text: 'Pending', classes: 'bg-amber-50 text-amber-700 border-amber-100' },
      PACKED: { text: 'Packed', classes: 'bg-blue-50 text-blue-700 border-blue-100' },
      SHIPPED: { text: 'Shipped', classes: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
      OUT_FOR_DELIVERY: { text: 'Out for Delivery', classes: 'bg-purple-50 text-purple-700 border-purple-100' },
      DELIVERED: { text: 'Delivered', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
      CANCELLED: { text: 'Cancelled', classes: 'bg-rose-50 text-rose-700 border-rose-100' },
    };

    const config = configs[status] || configs.PENDING;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.classes}`}>
        {config.text}
      </span>
    );
  };

  const columns = [
    {
      header: 'Products',
      accessor: (row: Order) => {
        if (row.items.length === 0) return 'No items';
        const firstItem = row.items[0].productName;
        if (row.items.length === 1) return firstItem;
        return `${firstItem} + ${row.items.length - 1} more`;
      },
      className: 'font-semibold text-gray-900',
    },
    {
      header: 'Total Items',
      accessor: (row: Order) => row.items.reduce((sum, item) => sum + item.quantity, 0),
      className: 'font-mono text-gray-600',
    },
    {
      header: 'Total Amount',
      accessor: (row: Order) => `₹${row.totalAmount.toFixed(2)}`,
      className: 'font-bold font-mono text-gray-950',
    },
    {
      header: 'Order Status',
      accessor: (row: Order) => getStatusBadge(row.status),
    },
    {
      header: 'Purchase Date',
      accessor: (row: Order) => new Date(row.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      className: 'text-gray-500 text-xs',
    },
    {
      header: 'Actions',
      accessor: (row: Order) => (
        <button
          onClick={() => {
            setSelectedOrder(row);
            setModalOpen(true);
          }}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-100 transition-all cursor-pointer shadow-sm"
        >
          Track Order
        </button>
      ),
    },
  ];

  const fallbackStoreSlug = orders.find((o) => o.store?.slug)?.store?.slug;
  const effectiveStoreSlug = storeSlug || fallbackStoreSlug;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Light Customer Top Navigation */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 py-5 px-6 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 bg-white transition-all flex items-center justify-center cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400 dark:hover:text-white"
              title="Go Back"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Shopify Lite
            </h1>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wide">
              Customer Hub
            </span>
            {effectiveStoreSlug && (
              <Link
                to={`/store/${effectiveStoreSlug}`}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-100 transition-all cursor-pointer"
              >
                Back to Shop
              </Link>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-xs font-semibold text-gray-500">
              Welcome, <strong className="text-gray-900">{user?.name}</strong>
            </span>
            <button
              onClick={logout}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-rose-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">My Orders</h2>
            <p className="text-sm text-gray-400 mt-1">Track purchase records and delivery progress</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-2xl">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
          <DataTable
            columns={columns}
            data={orders}
            isLoading={loading}
            emptyMessage="You have not placed any orders yet. Visit a storefront to make your first purchase!"
          />

          {!loading && totalPages > 1 && (
            <div className="mt-6 flex justify-end">
              <Pagination
                pagination={{ page, totalPages, total, limit }}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </main>

      {/* Order Tracking Modal */}
      {selectedOrder && (
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedOrder(null);
          }}
          title="Order Progress & Details"
        >
          <div className="space-y-6">
            {/* Reference & Date */}
            <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-100 pb-4 gap-2 text-sm text-gray-500">
              <div>
                <p className="font-semibold text-gray-400 text-[10px] uppercase tracking-wider">Order ID</p>
                <p className="font-mono text-gray-900 font-semibold mt-0.5 select-all text-xs">{selectedOrder.id}</p>
              </div>
              <div className="sm:text-right">
                <p className="font-semibold text-gray-400 text-[10px] uppercase tracking-wider">Date Placed</p>
                <p className="text-gray-900 font-semibold mt-0.5 text-xs">
                  {new Date(selectedOrder.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Stepper Status Tracking or Cancelled Banner */}
            <div>
              {selectedOrder.status === 'CANCELLED' ? (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0 text-rose-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">This order was cancelled</h4>
                    <p className="text-xs text-rose-600/80 mt-0.5">The items have been returned to store stock.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivery Progress</h4>
                  
                  {/* Responsive Stepper */}
                  <div className="relative">
                    {/* Stepper connecting line for desktop view */}
                    <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-100 -z-10 hidden sm:block" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-1">
                      {[
                        { status: 'PENDING', label: 'Pending', desc: 'Order received' },
                        { status: 'PACKED', label: 'Packed', desc: 'Ready to ship' },
                        { status: 'SHIPPED', label: 'Shipped', desc: 'In transit' },
                        { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Nearing arrival' },
                        { status: 'DELIVERED', label: 'Delivered', desc: 'Completed' },
                      ].map((step, idx) => {
                        const stepsOrder = ['PENDING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                        const currentIdx = stepsOrder.indexOf(selectedOrder.status);
                        const isCompleted = idx <= currentIdx;
                        const isCurrent = step.status === selectedOrder.status;

                        return (
                          <div key={step.status} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                            {/* Step circle */}
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all flex-shrink-0 ${
                                isCompleted
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-500/10'
                                  : 'bg-white border-gray-200 text-gray-400'
                              } ${isCurrent ? 'ring-4 ring-emerald-50 border-emerald-600 scale-105' : ''}`}
                            >
                              {isCompleted && !isCurrent ? (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                idx + 1
                              )}
                            </div>

                            {/* Label text */}
                            <div className="text-left sm:text-center">
                              <p className={`text-xs font-bold ${isCurrent ? 'text-emerald-700' : isCompleted ? 'text-gray-950 font-semibold' : 'text-gray-400'}`}>
                                {step.label}
                              </p>
                              <p className="text-[9px] text-gray-400 hidden sm:block mt-0.5">{step.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items list */}
            <div className="border-t border-gray-100 pt-5 space-y-3">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Items In Order</h4>
              <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-gray-900 text-xs">{item.productName}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Qty: {item.quantity} × ₹{item.priceAtPurchase.toFixed(2)}</p>
                    </div>
                    <span className="font-bold text-gray-950 font-mono text-xs">
                      ₹{(item.quantity * item.priceAtPurchase).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase">Total Paid</span>
              <span className="text-lg font-black text-gray-950 font-mono">₹{selectedOrder.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </Modal>
      )}

      <footer className="bg-white border-t border-gray-100 py-6 px-6 text-center text-xs text-gray-400">
        <p>© 2026 Shopify Lite Multi-tenant Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MyOrders;
