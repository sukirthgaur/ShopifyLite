import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === 'CUSTOMER') {
        navigate(redirectUrl || '/my-orders');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const isCustomerIntent = redirectUrl?.includes('/store/') || redirectUrl?.includes('/checkout') || searchParams.get('role') === 'customer';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-emerald-950 via-teal-900 to-emerald-900 px-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 dark:bg-slate-900/90 dark:border-slate-800">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Shopify Lite
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {isCustomerIntent ? 'Sign in to continue shopping' : 'Sign in to your merchant dashboard'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-xl dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              placeholder={isCustomerIntent ? "e.g. customer@demo.com" : "e.g. admin@shopifylite.com"}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 space-y-2 flex flex-col items-center">
          <span>Don't have an account?</span>
          <div className="flex flex-wrap gap-3 mt-1 text-xs justify-center items-center">
            <Link
              to={redirectUrl ? `/register?role=customer&redirect=${encodeURIComponent(redirectUrl)}` : "/register?role=customer"}
              className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Create customer account
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link
              to="/register"
              className="font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              Register your store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
