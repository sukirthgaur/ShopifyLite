import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StoreList from './pages/StoreList';
import UserList from './pages/UserList';
import CreateStore from './pages/CreateStore';
import StoreManagement from './pages/StoreManagement';
import Storefront from './pages/Storefront';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/store/:slug" element={<Storefront />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* SUPER_ADMIN only */}
              <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/stores" element={<StoreList />} />
                <Route path="/users" element={<UserList />} />
              </Route>

              {/* STORE_ADMIN only */}
              <Route element={<ProtectedRoute allowedRoles={['STORE_ADMIN']} requireStore />}>
                <Route path="/manage" element={<StoreManagement />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['STORE_ADMIN']} requireNoStore />}>
                <Route path="/create-store" element={<CreateStore />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
