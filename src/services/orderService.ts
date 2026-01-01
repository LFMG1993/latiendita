import {collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, increment, getDoc} from "firebase/firestore";
import {db} from "../firebase";
import {NewOrderData, Order, OrderStatus} from "../types/order.types";

const ORDERS_COLLECTION = "orders";

export const createOrder = async (orderData: NewOrderData): Promise<string> => {
    try {
        // Sanitizar datos para evitar errores de Firestore con campos 'undefined'
        const rawSanitized = JSON.parse(JSON.stringify(orderData));
        
        let finalOrderData = { ...rawSanitized };

        // 1. Lógica Refinada de Créditos
        if (orderData.paymentMethod === 'credit' && orderData.clientId) {
            const userRef = doc(db, "users", orderData.clientId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const currentCredits = userData.credits || 0;
                
                // Calculamos cuánto podemos cubrir con saldo a favor
                const usedCredits = Math.min(currentCredits, orderData.totalAmount);
                const pendingDebt = orderData.totalAmount - usedCredits;
                
                // Actualizamos los datos del pedido que se guardarán
                finalOrderData = {
                    ...finalOrderData,
                    usedCredits,
                    pendingDebt
                };

                // Descontamos los créditos del usuario inmediatamente si se usaron
                if (usedCredits > 0) {
                    await updateDoc(userRef, {
                        credits: increment(-usedCredits),
                        updatedAt: serverTimestamp()
                    });
                }
            }
        }

        // 2. Crear el pedido
        const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
            ...finalOrderData,
            status: 'pending', 
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return docRef.id;
    } catch (error) {
        console.error("Error creating order:", error);
        throw new Error("No se pudo crear el pedido.");
    }
};

export const getClientOrders = async (clientId: string, shopId?: string): Promise<Order[]> => {
    if (!clientId) {
        console.warn("getClientOrders called without clientId");
        return [];
    }
    try {
        let q;
        if (shopId) {
            // Caso Admin: Filtramos por shopId (seguridad) y luego clientId en memoria 
            // para evitar requerir un índice compuesto en Firestore.
            q = query(
                collection(db, ORDERS_COLLECTION), 
                where("shopId", "==", shopId)
            );
        } else {
            // Caso Cliente: Filtramos por su propio clientId
            q = query(
                collection(db, ORDERS_COLLECTION), 
                where("clientId", "==", clientId)
            );
        }

        const querySnapshot = await getDocs(q);
        let orders = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as any)
        })) as Order[];

        // Si es Admin, terminamos de filtrar por el cliente específico en memoria
        if (shopId) {
            orders = orders.filter(o => o.clientId === clientId);
        }

        // Ordenar en memoria por fecha descendente
        return orders.sort((a, b) => {
            const timeA = b.createdAt?.toMillis() || 0;
            const timeB = a.createdAt?.toMillis() || 0;
            return timeA - timeB;
        });
    } catch (error) {
        console.error("Error fetching client orders:", error);
        throw new Error("Error al obtener los pedidos.");
    }
};

export const getShopOrders = async (shopId: string): Promise<Order[]> => {
    try {
        const q = query(
            collection(db, ORDERS_COLLECTION), 
            where("shopId", "==", shopId)
        );
        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Order[];
        
        return orders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    } catch (error) {
        console.error("Error fetching shop orders:", error);
        throw new Error("Error al obtener los pedidos de la tienda.");
    }
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
    try {
        const orderRef = doc(db, ORDERS_COLLECTION, orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (!orderSnap.exists()) throw new Error("Pedido no encontrado.");
        const orderData = orderSnap.data() as Order;

        // 1. Lógica de Deuda: Si el estado cambia a 'delivered' y es un pedido a crédito
        if (status === 'delivered' && orderData.status !== 'delivered' && orderData.paymentMethod === 'credit') {
            
            // Recalculamos el total sumando items por si totalAmount falla
            const itemsSum = orderData.items?.reduce((acc, item) => {
                const price = Number(item.priceAtPurchase || item.product?.price || 0);
                return acc + (price * (item.quantity || 0));
            }, 0) || 0;

            const total = Number(orderData.totalAmount || itemsSum);
            const used = Number(orderData.usedCredits || 0);
            const pending = orderData.pendingDebt !== undefined ? Number(orderData.pendingDebt) : null;
            
            // El monto final a cobrar es el pendiente (si existe) o el total menos lo ya pagado con créditos
            let debtToAdd = (pending !== null && pending > 0) ? pending : (total - used);
            
            // Backup final: si sigue siendo 0 pero hay total, usamos el total
            if (debtToAdd <= 0 && total > 0) debtToAdd = total;

            const clientId = (orderData.clientId || '').trim();

            console.log(`[DEBUG-DEUDA] Procesando Pedido ${orderId}:`, {
                montoAFiar: debtToAdd,
                itemsSum,
                totalEnDoc: orderData.totalAmount,
                usado: used,
                cliente: clientId
            });

            if (debtToAdd > 0 && clientId) {
                const userRef = doc(db, "users", clientId);
                await updateDoc(userRef, {
                    debt: increment(debtToAdd),
                    updatedAt: serverTimestamp()
                });
                console.log(`[DEBUG-DEUDA] OK: Se sumaron ${debtToAdd} a la cuenta del cliente ${clientId}`);
            } else {
                console.warn(`[DEBUG-DEUDA] ERROR: No se pudo determinar monto o cliente.`, {debtToAdd, clientId});
            }
        }

        // 2. Actualizamos el estado del pedido (usamos updateDoc directo también por simplicidad y fiabilidad)
        await updateDoc(orderRef, {
            status,
            updatedAt: serverTimestamp()
        });

        console.log(`[Success] Pedido ${orderId} actualizado a ${status}.`);
    } catch (error) {
        console.error("Error en updateOrderStatus:", error);
        throw new Error("No se pudo actualizar el estado del pedido.");
    }
};
