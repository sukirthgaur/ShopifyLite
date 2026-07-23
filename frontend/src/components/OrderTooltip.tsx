import { useState, type ReactNode } from 'react';
import type { OrderItem } from '../types';

interface OrderTooltipProps {
  orderNumber: number;
  items: OrderItem[];
  children?: ReactNode;
}

export const OrderTooltip = ({ orderNumber, items, children }: OrderTooltipProps) => {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 6,
      left: Math.max(12, rect.left),
    });
  };

  const handleMouseLeave = () => {
    setCoords(null);
  };

  const itemSummary = items.map((i) => `${i.productName} (x${i.quantity})`).join(', ');

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline-block relative cursor-pointer"
      title={itemSummary}
    >
      {children || (
        <span className="font-extrabold font-mono text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-100/80 text-xs transition-colors">
          #{orderNumber}
        </span>
      )}

      {coords && (
        <div
          style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
          className="fixed z-50 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-2xl min-w-[220px] max-w-xs pointer-events-none border border-slate-700"
        >
          <p className="font-bold border-b border-slate-700 pb-1.5 mb-1.5 text-[10px] text-gray-400 uppercase tracking-wider">
            Items Summary ({items.reduce((s, i) => s + i.quantity, 0)} total)
          </p>
          <div className="space-y-1">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center gap-3 text-xs py-0.5">
                <span className="truncate text-gray-200">{item.productName}</span>
                <span className="font-bold text-emerald-400 font-mono flex-shrink-0">×{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTooltip;
