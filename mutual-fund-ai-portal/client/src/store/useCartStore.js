import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],

      // Add item to cart
      addToCart: (item) => set((state) => {
        // Check if already in cart, if so, update it
        const existingIndex = state.cartItems.findIndex(i => i.schemeCode === item.schemeCode);
        if (existingIndex >= 0) {
          const updatedItems = [...state.cartItems];
          updatedItems[existingIndex] = { ...updatedItems[existingIndex], ...item };
          return { cartItems: updatedItems };
        }
        return { cartItems: [...state.cartItems, item] };
      }),

      // Remove item from cart
      removeFromCart: (schemeCode) => set((state) => ({
        cartItems: state.cartItems.filter((item) => item.schemeCode !== schemeCode)
      })),

      // Clear entire cart
      clearCart: () => set({ cartItems: [] }),

      // Get total cost
      getTotalCost: () => {
        return get().cartItems.reduce((total, item) => total + (Number(item.amount) || 0), 0);
      }
    }),
    {
      name: 'cart-storage',
    }
  )
);

export default useCartStore;
