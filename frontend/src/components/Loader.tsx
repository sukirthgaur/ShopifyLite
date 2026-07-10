interface LoaderProps {
  // Configures loading indicator size preset
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Shared Spinning Loading Placeholder Component
 * Renders an animated spinning circle with tailwind.
 */
const Loader = ({ size = 'md' }: LoaderProps) => {
  // Mapping size parameters to tailwind dimensions and border widths
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`animate-spin rounded-full border-t-emerald-600 border-gray-200 ${sizeClasses[size]}`} />
  );
};

export default Loader;
