import {createContext, useContext, useState, useEffect, ReactNode, FC} from 'react';
import {PublicProduct} from '../types/public.types';

export interface CartItem {
    product: PublicProduct;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: PublicProduct) => void;
    removeFromCart: (productId: string) => void;
    decreaseQuantity: (productId: string) => void;
    clearCart: () => void;
    totalAmount: number;
    totalItems: number;
    shopId: string | null; // Para asegurar que el carrito sea de una sola tienda
    initializeCart: (shopId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: FC<{children: ReactNode}> = ({children}) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [shopId, setShopId] = useState<string | null>(null);

    // Persistencia: Cargar carrito al inicio
    useEffect(() => {
        const storedCart = localStorage.getItem('public_cart');
        const storedShopId = localStorage.getItem('public_cart_shop_id');
        if (storedCart) {
            try {
                setItems(JSON.parse(storedCart));
            } catch (e) {
                console.error("Error parsing cart", e);
            }
        }
        if (storedShopId) {
            setShopId(storedShopId);
        }
    }, []);

    // Persistencia: Guardar cambios
    useEffect(() => {
        localStorage.setItem('public_cart', JSON.stringify(items));
        if (shopId) {
            localStorage.setItem('public_cart_shop_id', shopId);
        } else {
            localStorage.removeItem('public_cart_shop_id');
        }
    }, [items, shopId]);

    const initializeCart = (newShopId: string) => {
        // Si cambiamos de tienda, limpiar carrito?? 
        // Por ahora, si hay items de otra tienda, advertir o limpiar.
        // Asumiremos limpieza automática si el shopId es diferente y hay items.
        if (shopId && shopId !== newShopId && items.length > 0) {
            // Decisión simple: Resetear si es otra tienda para evitar mezclar pedidos
            setItems([]);
        }
        setShopId(newShopId);
    };

    const addToCart = (product: PublicProduct) => {
        setItems(currentItems => {
            const existingItem = currentItems.find(item => item.product.id === product.id);
            if (existingItem) {
                return currentItems.map(item => 
                    item.product.id === product.id 
                    ? {...item, quantity: item.quantity + 1}
                    : item
                );
            }
            return [...currentItems, {product, quantity: 1}];
        });
    };

    const decreaseQuantity = (productId: string) => {
        setItems(currentItems => {
            const existingItem = currentItems.find(item => item.product.id === productId);
            if (existingItem && existingItem.quantity > 1) {
                 return currentItems.map(item => 
                    item.product.id === productId 
                    ? {...item, quantity: item.quantity - 1}
                    : item
                );
            }
            // Si es 1, lo removemos
            return currentItems.filter(item => item.product.id !== productId);
        });
    };

    const removeFromCart = (productId: string) => {
        setItems(currentItems => currentItems.filter(item => item.product.id !== productId));
    };

    const clearCart = () => {
        setItems([]);
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            items, 
            addToCart, 
            removeFromCart, 
            decreaseQuantity, 
            clearCart, 
            totalAmount, 
            totalItems,
            shopId,
            initializeCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
