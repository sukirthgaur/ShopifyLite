import { createContext, useContext, useState, type ReactNode } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
}

interface AddToCartResult {
  success: boolean;
  conflict?: boolean;
  existingStoreName?: string | null;
}

interface CartContextType {
  items: CartItem[];
  storeSlug: string | null;
  storeName: string | null;
  addToCart: (
    item: Omit<CartItem, 'quantity'>,
    quantity: number,
    storeSlug: string,
    storeName: string,
    force?: boolean
  ) => AddToCartResult;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);

  const clearCart = () => {
    setItems([]);
    setStoreSlug(null);
    setStoreName(null);
  };

  const addToCart = (
    item: Omit<CartItem, 'quantity'>,
    quantity: number,
    itemStoreSlug: string,
    itemStoreName: string,
    force = false
  ): AddToCartResult => {
    // Check if there is a store conflict
    if (storeSlug && storeSlug !== itemStoreSlug && items.length > 0) {
      if (!force) {
        return { success: false, conflict: true, existingStoreName: storeName };
      }
      // Force clear cart for the new store
      setItems([{ ...item, quantity }]);
      setStoreSlug(itemStoreSlug);
      setStoreName(itemStoreName);
      return { success: true };
    }

    // Initialize store info if cart was empty
    if (items.length === 0) {
      setStoreSlug(itemStoreSlug);
      setStoreName(itemStoreName);
    }

    // Add or update item
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.productId === item.productId);
      if (existingItem) {
        return prevItems.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(i.stock, i.quantity + quantity) }
            : i
        );
      }
      return [...prevItems, { ...item, quantity }];
    });

    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => {
      const updated = prevItems.filter((i) => i.productId !== productId);
      if (updated.length === 0) {
        setStoreSlug(null);
        setStoreName(null);
      }
      return updated;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prevItems) =>
      prevItems.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(i.stock, quantity)) } : i
      )
    );
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        storeSlug,
        storeName,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
