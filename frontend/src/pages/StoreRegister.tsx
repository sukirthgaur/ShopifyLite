import { useState } from 'react';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StoreRegister = () => {
  const { slug } = useParams<{ slug: string }>();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(name, email, password, 'CUSTOMER', slug);
      navigate(redirectUrl || `/store/${slug}/orders`);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Try a different email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-emerald-950 via-teal-900 to-emerald-900 px-4 py-8">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
        <div className="text-center mb-8">
          <Link to={`/store/${slug}`} className="inline-block text-xs font-semibold text-emerald-600 hover:text-emerald-700 mb-2">
            ← Return to Shop
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-900 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign up for a customer account at <strong className="text-gray-700 capitalize">{slug}</strong>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900"
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900"
              placeholder="e.g. jane@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Password (min 8 chars)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account at this store?{' '}
          <Link
            to={redirectUrl ? `/store/${slug}/login?redirect=${encodeURIComponent(redirectUrl)}` : `/store/${slug}/login`}
            className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default StoreRegister;
