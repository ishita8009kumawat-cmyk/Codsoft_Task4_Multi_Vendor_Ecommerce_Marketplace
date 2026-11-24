import { createContext, useContext, useState, useCallback, useMemo } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { product_id, name, price, qty, store_name, stock }

  const addItem = useCallback((product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((i) => (i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...prev,
        { product_id: product.id, name: product.name, price: product.price, qty: 1, store_name: product.store_name, stock: product.stock },
      ];
    });
  }, []);

  const decrementItem = useCallback((productId) => {
    setItems((prev) => prev.map((i) => (i.product_id === productId ? { ...i, qty: i.qty - 1 } : i)).filter((i) => i.qty > 0));
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items]);
  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  const groupedByVendor = useMemo(() => {
    const map = {};
    for (const i of items) {
      if (!map[i.store_name]) map[i.store_name] = [];
      map[i.store_name].push(i);
    }
    return map;
  }, [items]);

  return (
    <CartContext.Provider value={{ items, addItem, decrementItem, removeItem, clearCart, total, count, groupedByVendor }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
