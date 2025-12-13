import {FC, useState, useEffect, useMemo} from "react";
import {useAuthStore} from "../../store/authStore.ts";
import FullScreenLoader from "../../components/general/FullScreenLoader.tsx";
import {
    Product,
    Ingredient,
    SaleItem,
    IngredientUsage,
    NewSaleData,
    SellableProduct,
    PaymentMethod,
    SalePayment,
    CashSession,
    Promotion
} from "../../types";
import {getProducts} from "../../services/productServices.ts";
import {getIngredients} from "../../services/ingredientServices.ts";
import ProductGrid from "../../components/pos/ProductGrid.tsx";
import PromotionGrid from "../../components/pos/PromotionGrid.tsx";
import OrderSummary from "../../components/pos/OrderSummary.tsx";
import VariableIngredientModal from "../../components/pos/VariableIngredientModal.tsx";
import {registerSale} from "../../services/saleServices.ts";
import {getActivePaymentMethods} from "../../services/paymentMethodServices.ts";
import PaymentModal from "../../components/pos/PaymentModal.tsx";
import {getOpenCashSession} from "../../services/cashSessionServices.ts";
import {Link} from "react-router-dom";
import {getActivePromotionsForToday} from "../../services/promotionServices.ts";
import {usePersistentState} from "../../hooks/usePersistentState.ts";
import PendingOrdersTabs from "../../components/pos/PendingOrdersTabs.tsx";

const PointOfSalePage: FC = () => {
    const {activeIceCreamShopId: heladeriaId, loading: authLoading, user} = useAuthStore();
    const [pageLoading, setPageLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [openSession, setOpenSession] = useState<CashSession | null>(null);
    const [error, setError] = useState<string | null>(null);

    // --- Estado del Pedido Actual ---
    const [pendingOrders, setPendingOrders] = usePersistentState<Record<string, SaleItem[]>>('pos_pending_orders', {});
    const [activeOrderId, setActiveOrderId] = usePersistentState<string | null>('pos_active_order_id', null);
    const [productForVariableSelection, setProductForVariableSelection] = useState<Product | null>(null);
    const [variableSelectionsNeeded, setVariableSelectionsNeeded] = useState<IngredientUsage[]>([]);
    const [madeVariableSelections, setMadeVariableSelections] = useState<IngredientUsage[]>([]);
    const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // --- Estado para el flujo de selección de promociones ---
    const [promotionForVariableSelection, setPromotionForVariableSelection] = useState<Promotion | null>(null);
    const [promoVariableSelectionsNeeded, setPromoVariableSelectionsNeeded] = useState<IngredientUsage[]>([]);
    const [promoMadeVariableSelections, setPromoMadeVariableSelections] = useState<IngredientUsage[]>([]);

    // Derivamos el pedido actual a partir del ID activo para simplificar el resto del código
    const currentOrder = useMemo(() => {
        if (!activeOrderId || !pendingOrders[activeOrderId]) return [];
        return pendingOrders[activeOrderId];
    }, [activeOrderId, pendingOrders]);

    // Efecto para asegurar que siempre haya al menos un pedido activo
    useEffect(() => {
        if (Object.keys(pendingOrders).length === 0 && !pageLoading && openSession) {
            const newOrderId = Date.now().toString();
            setPendingOrders({[newOrderId]: []});
            setActiveOrderId(newOrderId);
        } else if (!activeOrderId || !pendingOrders[activeOrderId]) {
            // Si el ID activo se borró, selecciona el primero de la lista
            setActiveOrderId(Object.keys(pendingOrders)[0] || null);
        }
    }, [pendingOrders, activeOrderId, setPendingOrders, setActiveOrderId, pageLoading, openSession]);


    useEffect(() => {
        const fetchData = async () => {
            if (!heladeriaId) {
                setPageLoading(false);
                return;
            }
            setPageLoading(true);
            try {
                const today = new Date().getDay();
                const [productsData, ingredientsData, paymentMethodsData, sessionData, promotionsData] = await Promise.all([
                    getProducts(heladeriaId),
                    getIngredients(heladeriaId),
                    getActivePaymentMethods(heladeriaId),
                    getOpenCashSession(heladeriaId),
                    getActivePromotionsForToday(heladeriaId, today),
                ]);
                setProducts(productsData);
                setIngredients(ingredientsData);
                setPaymentMethods(paymentMethodsData);
                setOpenSession(sessionData);
                setPromotions(promotionsData);
            } catch (err) {
                console.error("Error al cargar datos para el POS:", err);
                setError("No se pudieron cargar los productos o ingredientes.");
            } finally {
                setPageLoading(false);
            }
        };

        fetchData();
    }, [heladeriaId]);

    const handleAddPromotionToOrder = (promotion: Promotion) => {
        // Expandimos la lista de ingredientes variables según la cantidad de la promoción.
        const allVariableItems = promotion.items.flatMap(promoItem => {
            const product = products.find(p => p.id === promoItem.productId);
            if (!product) return [];
            const variableRecipeItems = product.recipe.filter(item => item.ingredientId.startsWith('CATEGORY::'));
            // Repetimos los ítems variables por la cantidad especificada en la promoción.
            return Array(promoItem.quantity).fill(variableRecipeItems).flat();
        });

        if (allVariableItems.length > 0) {
            // Si hay ingredientes variables, iniciamos el flujo de selección.
            setPromotionForVariableSelection(promotion);
            setPromoVariableSelectionsNeeded(allVariableItems);
            setPromoMadeVariableSelections([]);
            setIsVariableModalOpen(true);
        } else {
            // Si no, añadimos la promoción directamente.
            const ingredientsUsed = promotion.items.flatMap(promoItem => {
                const product = products.find(p => p.id === promoItem.productId);
                return product ? Array(promoItem.quantity).fill(product.recipe).flat() : [];
            }).map(recipeItem => ({
                ingredientId: recipeItem.ingredientId,
                quantity: recipeItem.quantity
            }));

            const saleItem: SaleItem = {
                id: `${Date.now()}-${Math.random()}`,
                productId: `PROMO::${promotion.id}`,
                productName: promotion.name,
                quantity: 1,
                unitPrice: promotion.price,
                isPromotion: true,
                promotionId: promotion.id,
                ingredientsUsed
            };
            if (activeOrderId) {
                setPendingOrders(prev => ({...prev, [activeOrderId]: [...currentOrder, saleItem]}));
            }
        }
    };

    const consumedStock = useMemo(() => {
        const stockMap = new Map<string, number>();
        currentOrder.forEach(orderItem => {
            orderItem.ingredientsUsed.forEach(usage => {
                stockMap.set(usage.ingredientId, (stockMap.get(usage.ingredientId) || 0) + (usage.quantity * orderItem.quantity));
            });
        });
        return stockMap;
    }, [currentOrder]);

    // --- Lógica para determinar qué productos se pueden vender ---
    const sellableProducts = useMemo((): SellableProduct[] => {
        const ingredientsMap = new Map(ingredients.map(ing => [ing.id, ing]));

        // Determinar la disponibilidad de cada producto
        return products.map(product => {
            const unitsPerIngredient = product.recipe.map(recipeItem => {
                if (recipeItem.ingredientId.startsWith('CATEGORY::')) return Infinity;

                const ingredient = ingredientsMap.get(recipeItem.ingredientId);
                if (!ingredient || !recipeItem.quantity) return 0;

                const currentStock = ingredient.stock ?? 0;
                const stockAlreadyInCart = consumedStock.get(ingredient.id) || 0;
                const availableStockInConsumptionUnits = currentStock - stockAlreadyInCart;

                return Math.floor(availableStockInConsumptionUnits / recipeItem.quantity);
            });

            const availableUnits = Math.max(0, Math.min(...unitsPerIngredient));
            return {...product, isAvailable: availableUnits > 0, availableUnits};
        });
    }, [products, ingredients, currentOrder]);

    const addProductToOrder = (product: Product, variableIngredients: IngredientUsage[]) => {
        if (!activeOrderId) return;
        const ingredientsUsed: IngredientUsage[] = product.recipe
            .filter(item => !item.ingredientId.startsWith('CATEGORY::'))
            .map(item => ({ingredientId: item.ingredientId, quantity: item.quantity}));

        ingredientsUsed.push(...variableIngredients);

        const existingItemIndex = currentOrder.findIndex(item => item.productId === product.id && JSON.stringify(item.ingredientsUsed) === JSON.stringify(ingredientsUsed));

        if (existingItemIndex > -1) {
            // Si ya existe un ítem idéntico (mismo producto y mismos ingredientes variables), incrementa la cantidad
            const updatedOrder = [...currentOrder];
            updatedOrder[existingItemIndex].quantity += 1;
            setPendingOrders(prev => ({...prev, [activeOrderId]: updatedOrder}));
        } else {
            // Si no, añade un nuevo ítem al pedido
            const newItem: SaleItem = {
                id: `${Date.now()}-${Math.random()}`,
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unitPrice: product.price,
                ingredientsUsed,
            };
            setPendingOrders(prev => ({...prev, [activeOrderId]: [...currentOrder, newItem]}));
        }
    };

    const handleProductSelect = (product: Product) => {
        const variableItems = product.recipe
            .filter(item => item.ingredientId.startsWith('CATEGORY::'))
            .map(item => ({ingredientId: item.ingredientId, quantity: item.quantity}));

        if (variableItems.length > 0) {
            setProductForVariableSelection(product);
            setVariableSelectionsNeeded(variableItems);
            setMadeVariableSelections([]); // Reseteamos las selecciones hechas
            setIsVariableModalOpen(true);
        } else {
            addProductToOrder(product, []);
        }
    };

    const handleConfirmVariableSelection = (selectedIngredient: IngredientUsage) => {
        if (promotionForVariableSelection) {
            // Estamos en el flujo de una promoción
            const newSelections = [...promoMadeVariableSelections, selectedIngredient];
            setPromoMadeVariableSelections(newSelections);

            if (newSelections.length === promoVariableSelectionsNeeded.length) {
                // Todas las selecciones de la promo están hechas, la ensamblamos y añadimos.
                const baseIngredients = promotionForVariableSelection.items.flatMap(promoItem => {
                    const product = products.find(p => p.id === promoItem.productId);
                    const baseRecipeItems = product ? product.recipe.filter(r => !r.ingredientId.startsWith('CATEGORY::')) : [];
                    return Array(promoItem.quantity).fill(baseRecipeItems).flat();
                });

                const saleItem: SaleItem = {
                    id: `${Date.now()}-${Math.random()}`,
                    productId: `PROMO::${promotionForVariableSelection.id}`,
                    productName: promotionForVariableSelection.name,
                    quantity: 1,
                    unitPrice: promotionForVariableSelection.price,
                    isPromotion: true,
                    promotionId: promotionForVariableSelection.id,
                    ingredientsUsed: [...baseIngredients, ...newSelections]
                };

                if (activeOrderId) {
                    setPendingOrders(prev => ({...prev, [activeOrderId]: [...currentOrder, saleItem]}));
                }

                // Cerramos y reseteamos el flujo de la promoción
                setIsVariableModalOpen(false);
                setPromotionForVariableSelection(null);
            }
        } else if (productForVariableSelection) {
            // Estamos en el flujo de un producto individual
            const newSelections = [...madeVariableSelections, selectedIngredient];
            setMadeVariableSelections(newSelections);

            if (newSelections.length === variableSelectionsNeeded.length) {
                addProductToOrder(productForVariableSelection, newSelections);
                // Cerramos y reseteamos el flujo del producto
                setIsVariableModalOpen(false);
                setProductForVariableSelection(null);
            }
        }
    };

    const handleUpdateQuantity = (lineItemId: string, newQuantity: number) => {
        if (!activeOrderId) return;
        let updatedOrder: SaleItem[];
        if (newQuantity <= 0) {
            // Eliminar el ítem
            updatedOrder = currentOrder.filter(item => item.id !== lineItemId);
        } else {
            // Actualizar la cantidad
            updatedOrder = currentOrder.map(item => item.id === lineItemId ? {
                ...item,
                quantity: newQuantity
            } : item);
        }
        setPendingOrders(prev => ({...prev, [activeOrderId]: updatedOrder}));
    };

    const handleProcessPayment = async (payments: SalePayment[]) => {
        if (!heladeriaId || !user || !activeOrderId || !openSession || currentOrder.length === 0) return;

        const saleData: NewSaleData = {
            items: currentOrder,
            sessionId: openSession.id,
            payments,
            total: currentOrder.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0),
            employeeId: user.uid,
            employeeName: user.firstName || user.email,
        };

        try {
            await registerSale(heladeriaId, saleData);
            alert('¡Venta registrada con éxito!');
            // Limpiamos solo el pedido finalizado
            handleCloseOrder(activeOrderId);
            setIsPaymentModalOpen(false);
        } catch (err) {
            console.error("Error al registrar la venta:", err);
            alert('Ocurrió un error al registrar la venta.');
        }
    };

    // --- Nuevas funciones para gestionar los pedidos pendientes ---
    const handleCreateNewOrder = () => {
        const newOrderId = Date.now().toString();
        setPendingOrders(prev => ({...prev, [newOrderId]: []}));
        setActiveOrderId(newOrderId);
    };

    const handleSelectOrder = (orderId: string) => {
        setActiveOrderId(orderId);
    };

    const handleCloseOrder = (orderIdToClose: string) => {
        const newPendingOrders = {...pendingOrders};
        delete newPendingOrders[orderIdToClose];

        setPendingOrders(newPendingOrders);

        if (activeOrderId === orderIdToClose) {
            const remainingIds = Object.keys(newPendingOrders);
            if (remainingIds.length > 0) {
                setActiveOrderId(remainingIds[0]);
            } else {
                // Si no quedan pedidos, crea uno nuevo
                handleCreateNewOrder();
            }
        }
    };

    // Creamos un adaptador para que el modal siempre reciba un objeto con forma de 'Product'.
    const modalProductContext = useMemo(() => {
        if (productForVariableSelection) {
            return productForVariableSelection;
        }
        if (promotionForVariableSelection) {
            // Este es el objeto "adaptador". Satisface la interfaz 'Product' para el modal,
            // usando datos de la promoción.
            return {
                id: promotionForVariableSelection.id,
                name: promotionForVariableSelection.name,
                recipe: promoVariableSelectionsNeeded, // El modal necesita una 'receta' para encontrar el item variable
                price: promotionForVariableSelection.price,
                category: 'Promoción',
                createdAt: promotionForVariableSelection.createdAt,
                cost: promotionForVariableSelection.cost,
            } as Product; // Forzamos el tipo para satisfacer a TypeScript
        }
        return null;
    }, [productForVariableSelection, promotionForVariableSelection, promoVariableSelectionsNeeded]);


    if (authLoading || pageLoading) return <FullScreenLoader/>;

    if (!heladeriaId) {
        return <div className="container mt-4 alert alert-warning">Por favor, selecciona una heladería para empezar a
            vender.</div>;
    }

    if (error) {
        return <div className="container mt-4 alert alert-danger">{error}</div>;
    }

    // Verifica si la sesión de caja está abierta y pertenece al usuario actual
    if (openSession && user && openSession.employeeId !== user.uid) {
        return (
            <div className="container mt-4 text-center">
                <div className="alert alert-danger">
                    <h4>Caja Ocupada</h4>
                    <p>La sesión de caja actual fue iniciada por <strong>{openSession.employeeName}</strong>.</p>
                    <p>Solo esa persona puede registrar ventas o cerrar la caja.</p>
                </div>
            </div>
        );
    }

    // Si no hay sesión de caja abierta, bloqueamos el acceso al POS
    if (!openSession) {
        return (
            <div className="container mt-4 text-center">
                <div className="alert alert-warning">
                    <h4>Caja Cerrada</h4>
                    <p>Debes abrir una sesión de caja para poder registrar ventas.</p>
                    <Link to="/cash-session" className="btn btn-primary">Ir a Gestión de Caja</Link>
                </div>
            </div>
        );
    }
    return (
        <div className="container-fluid mt-4">
            <div className="row">
                <div className="col-lg-8 col-xl-9">
                    <PendingOrdersTabs
                        orders={pendingOrders}
                        activeOrderId={activeOrderId}
                        onSelectOrder={handleSelectOrder}
                        onCreateNewOrder={handleCreateNewOrder}
                        onCloseOrder={handleCloseOrder}
                    />
                    {/*  Solo mostramos la sección de promociones si hay alguna disponible. */}
                    {promotions.length > 0 && (
                        <>
                            <h4 className="mb-3">Promociones del Día</h4>
                            <PromotionGrid promotions={promotions} onSelect={handleAddPromotionToOrder}/>
                            <hr className="my-4"/>
                        </>
                    )}
                    <ProductGrid products={sellableProducts} ingredients={ingredients}
                                 onProductSelect={handleProductSelect}/>
                </div>
                <div className="col-lg-4 col-xl-3">
                    <div className="position-sticky" style={{top: '1rem'}}>
                        <OrderSummary
                            orderItems={currentOrder}
                            ingredients={ingredients}
                            onUpdateQuantity={handleUpdateQuantity}
                            onProceedToPayment={() => setIsPaymentModalOpen(true)}
                        />
                    </div>
                </div>
                <VariableIngredientModal
                    show={isVariableModalOpen}
                    onClose={() => setIsVariableModalOpen(false)}
                    product={modalProductContext}
                    ingredients={ingredients}
                    consumedStock={consumedStock}
                    selectionIndex={
                        promotionForVariableSelection ? promoMadeVariableSelections.length : madeVariableSelections.length
                    }
                    totalSelections={
                        promotionForVariableSelection ? promoVariableSelectionsNeeded.length : variableSelectionsNeeded.length
                    }
                    onConfirm={handleConfirmVariableSelection}
                />
                <PaymentModal
                    show={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    orderTotal={currentOrder.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)}
                    paymentMethods={paymentMethods}
                    onConfirmPayment={handleProcessPayment}
                />
            </div>
        </div>
    );
};

export default PointOfSalePage;