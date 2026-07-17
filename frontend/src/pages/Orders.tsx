import { useEffect, useState } from 'react';
import * as ordersApi from '../api/orders';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import type { Order, OrderStatus } from '../types';

const Orders = () => {
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
      setError(err?.message || 'Failed to retrieve store orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic UI update
    const previousOrders = [...orders];
    setOrders(prev =>
      prev.map(order => (order.id === orderId ? { ...order, status: newStatus } : order))
    );

    try {
      await ordersApi.updateOrderStatus(orderId, newStatus);
    } catch (err: any) {
      // Revert if API fails
      setOrders(previousOrders);
      alert(err?.message || 'Failed to update order status.');
    }
  };

  const columns = [
    {
      header: 'Customer',
      accessor: (row: Order) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-gray-900 text-sm">{row.customer?.name}</div>
          <div className="text-xs text-gray-400 font-mono">{row.customer?.email}</div>
        </div>
      ),
    },
    {
      header: 'Items',
      accessor: (row: Order) => (
        <div className="space-y-1 max-w-xs">
          {row.items.map((item) => (
            <div key={item.id} className="text-xs">
              <span className="font-semibold text-gray-900">{item.productName}</span>
              <span className="text-gray-400 font-medium ml-1.5">× {item.quantity}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      header: 'Total Amount',
      accessor: (row: Order) => `₹${row.totalAmount.toFixed(2)}`,
      className: 'font-bold font-mono text-gray-950',
    },
    {
      header: 'Order Status',
      accessor: (row: Order) => {
        const selectColorMap: Record<OrderStatus, string> = {
          PENDING: 'border-amber-200 text-amber-700 bg-amber-50 focus:ring-amber-500/20 focus:border-amber-500',
          PACKED: 'border-blue-200 text-blue-700 bg-blue-50 focus:ring-blue-500/20 focus:border-blue-500',
          SHIPPED: 'border-indigo-200 text-indigo-700 bg-indigo-50 focus:ring-indigo-500/20 focus:border-indigo-500',
          OUT_FOR_DELIVERY: 'border-purple-200 text-purple-700 bg-purple-50 focus:ring-purple-500/20 focus:border-purple-500',
          DELIVERED: 'border-emerald-200 text-emerald-700 bg-emerald-50 focus:ring-emerald-500/20 focus:border-emerald-500',
          CANCELLED: 'border-rose-200 text-rose-700 bg-rose-50 focus:ring-rose-500/20 focus:border-rose-500',
        };

        const currentStyle = selectColorMap[row.status] || selectColorMap.PENDING;

        return (
          <select
            value={row.status}
            onChange={(e) => handleStatusChange(row.id, e.target.value as OrderStatus)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 transition-all cursor-pointer ${currentStyle}`}
          >
            <option value="PENDING">Pending</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        );
      },
    },
    {
      header: 'Date Created',
      accessor: (row: Order) => new Date(row.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      className: 'text-gray-500 text-xs',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Order Management</h2>
        <p className="text-sm text-gray-400 mt-1">Review orders placed by customers and update shipping statuses</p>
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
          emptyMessage="No customer orders have been received yet."
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
    </div>
  );
};

export default Orders;
