import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import StoreLogin from './pages/StoreLogin';
import StoreRegister from './pages/StoreRegister';
import Dashboard from './pages/Dashboard';
import StoreList from './pages/StoreList';
import UserList from './pages/UserList';
import CustomerList from './pages/CustomerList';
import CreateStore from './pages/CreateStore';
import StoreManagement from './pages/StoreManagement';
import Storefront from './pages/Storefront';
import CategoryManager from './pages/CategoryManager';
import MyOrders from './pages/MyOrders';
import Orders from './pages/Orders';
import Checkout from './pages/Checkout';

const FallbackRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'CUSTOMER') {
    const slug = user.store?.slug;
    return <Navigate to={slug ? `/store/${slug}/orders` : "/login"} replace />;
  }
  if (user?.role === 'STORE_ADMIN') {
    return <Navigate to={user.storeId ? "/manage" : "/create-store"} replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/store/:slug" element={<Storefront />} />
            <Route path="/store/:slug/login" element={<StoreLogin />} />
            <Route path="/store/:slug/register" element={<StoreRegister />} />

            {/* Customer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
              <Route path="/store/:slug/orders" element={<MyOrders />} />
              <Route path="/store/:slug/checkout" element={<Checkout />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/checkout" element={<Checkout />} />
            </Route>

            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                {/* SUPER_ADMIN & STORE_ADMIN shared routes */}
                <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'STORE_ADMIN']} />}>
                  <Route path="/customers" element={<CustomerList />} />
                </Route>

                {/* SUPER_ADMIN only */}
                <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/stores" element={<StoreList />} />
                  <Route path="/users" element={<UserList />} />
                </Route>

                {/* STORE_ADMIN only */}
                <Route element={<ProtectedRoute allowedRoles={['STORE_ADMIN']} requireStore />}>
                  <Route path="/manage" element={<StoreManagement />} />
                  <Route path="/categories" element={<CategoryManager />} />
                  <Route path="/orders" element={<Orders />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['STORE_ADMIN']} requireNoStore />}>
                  <Route path="/create-store" element={<CreateStore />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<FallbackRedirect />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
  );
}

export default App;
