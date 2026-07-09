import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="h-16 border-b border-gray-100 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-2">
        <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          Shopify Lite
        </span>
        <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-md">
          MVP
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-3 text-right">
            <div>
              <p className="text-sm font-semibold text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
              user.role === 'SUPER_ADMIN' 
                ? 'bg-rose-50 text-rose-600 border-rose-100' 
                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              {user.role.replace('_', ' ')}
            </span>
          </div>
        )}

        <button
          onClick={logout}
          className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
