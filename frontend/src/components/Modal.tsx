import { ReactNode } from 'react';

/**
 * Shared Modal Properties Interface
 */
interface ModalProps {
  // Flag indicating if overlay layout should render
  isOpen: boolean;
  
  // Callback invoked to close modal
  onClose: () => void;
  
  // Header title text displayed in modal top bar
  title: string;
  
  // Body node containing forms or details
  children: ReactNode;
  
  // Optional button footer node
  footer?: ReactNode;
}

/**
 * Shared Reusable Modal Overlay Component
 * Renders a backdrop-blur overlay container that nests content inside a center card.
 */
const Modal = ({ isOpen, onClose, title, children, footer }: ModalProps) => {
  // If closed, return null to completely remove the nodes from DOM
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose} // Clicking outer backdrop calls onClose
    >
      <div
        className="w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Prevents clicks inside the modal card from bubble closing
      >
        {/* Top Header Section */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Body Content Section */}
        <div className="p-6">{children}</div>
        
        {/* Optional Action Button Footer Section */}
        {footer && (
          <div className="px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
