"use client"

import { createContext, useContext, useReducer, useEffect, useState, ReactNode } from "react"
import posthog from "posthog-js"

// Types
export interface CartItem {
  productId: string
  name: string
  provider: string
  price: number
  originalPrice?: number | null
  dataAmount?: number | null
  dataUnit?: string | null
  validityDays?: number | null
  image?: string
  quantity: number
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] }

interface CartContextType extends CartState {
  isHydrated: boolean
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  isInCart: (productId: string) => boolean
  getItemQuantity: (productId: string) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "mobial_cart"

// Calculate totals
function calculateTotals(items: CartItem[]): { total: number; itemCount: number } {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  return { total, itemCount }
}

// Initial state
const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
}

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingIndex = state.items.findIndex(
        (item) => item.productId === action.payload.productId
      )

      let newItems: CartItem[]

      if (existingIndex > -1) {
        // Item exists, update quantity
        newItems = state.items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        )
      } else {
        // New item
        newItems = [...state.items, action.payload]
      }

      const { total, itemCount } = calculateTotals(newItems)
      return { ...state, items: newItems, total, itemCount }
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.productId !== action.payload)
      const { total, itemCount } = calculateTotals(newItems)
      return { ...state, items: newItems, total, itemCount }
    }

    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        const newItems = state.items.filter((item) => item.productId !== action.payload.productId)
        const { total, itemCount } = calculateTotals(newItems)
        return { ...state, items: newItems, total, itemCount }
      }

      const newItems = state.items.map((item) =>
        item.productId === action.payload.productId
          ? { ...item, quantity: action.payload.quantity }
          : item
      )
      const { total, itemCount } = calculateTotals(newItems)
      return { ...state, items: newItems, total, itemCount }
    }

    case "CLEAR_CART":
      return initialState

    case "LOAD_CART": {
      const { total, itemCount } = calculateTotals(action.payload)
      return { ...state, items: action.payload, total, itemCount }
    }

    default:
      return state
  }
}

// Provider
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        const items = JSON.parse(savedCart) as CartItem[]
        dispatch({ type: "LOAD_CART", payload: items })
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Save cart to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error)
    }
  }, [state.items])

  const addItem = (item: Omit<CartItem, "quantity">) => {
    dispatch({ type: "ADD_ITEM", payload: { ...item, quantity: 1 } })
    posthog.capture("add_to_cart", {
      product_id: item.productId,
      product_name: item.name,
      price: item.price,
      provider: item.provider,
    })
  }

  const removeItem = (productId: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: productId })
    posthog.capture("remove_from_cart", { product_id: productId })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" })
  }

  const isInCart = (productId: string) => {
    return state.items.some((item) => item.productId === productId)
  }

  const getItemQuantity = (productId: string) => {
    const item = state.items.find((item) => item.productId === productId)
    return item?.quantity || 0
  }

  return (
    <CartContext.Provider
      value={{
        ...state,
        isHydrated,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Hook
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
