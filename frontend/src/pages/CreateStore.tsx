import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as storesApi from '../api/stores';

const CreateStore = () => {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      setFormError('Slug must contain only lowercase letters, numbers, and hyphens');
      setIsSubmitting(false);
      return;
    }

    try {
      await storesApi.createStore({ name, slug });
      
      // Refresh user profile so AuthContext is aware of the new storeId
      await refreshProfile();
      
      // Redirect straight to Store Management page
      navigate('/manage');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create store. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-gray-950 tracking-tight">Create Your Storefront</h2>
          <p className="text-sm text-gray-500">Initialize your multi-tenant store to start managing products.</p>
        </div>

        {formError && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-xl font-medium animate-shake">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Store Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm text-gray-900 placeholder:text-gray-400"
              placeholder="e.g. Vintage Leather Co."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Slug URL Handle
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xs font-semibold text-gray-400 select-none font-mono">
                /store/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="w-full pl-20 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm text-gray-950 font-mono placeholder:text-gray-400"
                placeholder="vintage-leather-co"
              />
            </div>
            <p className="text-xs text-gray-400">
              Only lowercase letters, numbers, and hyphens. This forms your public storefront URL.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
          >
            {isSubmitting ? 'Initializing Store...' : 'Create Store'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateStore;
