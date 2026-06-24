import {useState, useEffect, FC, useMemo} from "react";
import {useAuthStore} from "../../store/authStore.ts";
import FullScreenLoader from "../../components/shared/FullScreenLoader.tsx";
import Breadcrumbs from "../../components/shared/Breadcrumbs.tsx";
import {getProducts, deleteProduct, updateProduct} from "../../services/shop/productServices.ts";
import {Product, Ingredient, EnrichedProduct, Purchase, EnrichedIngredient} from "../../types";
import Modal from "../../components/shared/Modal.tsx";
import ProductForm from "../../components/shop/products/ProductForm.tsx";
import ProductTable from "../../components/shop/products/ProductTable.tsx";
import {getIngredients} from "../../services/shop/ingredientServices.ts";
import {getPurchases} from "../../services/shop/purchaseServices.ts";

const ProductsPage: FC = () => {
    const {activeShopId: shopId, loading: authLoading} = useAuthStore();
    const [pageLoading, setPageLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<EnrichedProduct | undefined>(undefined);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            if (!shopId) return;
            setPageLoading(true);
            try {
                // Ahora cargamos productos, ingredientes y compras en paralelo
                const [productsData, ingredientsData, purchasesData] = await Promise.all([
                    getProducts(shopId),
                    getIngredients(shopId),
                    getPurchases(shopId)
                ]);
                setProducts(productsData);
                setIngredients(ingredientsData);
                setPurchases(purchasesData);
            } catch (error) {
                console.error("Error al obtener datos de los productos:", error);
            } finally {
                setPageLoading(false);
            }
        };

        fetchData();
    }, [shopId, refetchTrigger]);

    // --- Lógica para enriquecer los productos con datos calculados ---
    const enrichedProducts = useMemo((): EnrichedProduct[] => {
        if (!products.length) return [];

        const ingredientsMap = new Map(ingredients.map(ing => [ing.id, ing]));

        // 1. Crear un mapa con el costo más reciente de cada ingrediente
        const ingredientCostMap = new Map<string, number>();
        // Ordenamos las compras de la más antigua a la más nueva para que la última sobrescriba
        const sortedPurchases = [...purchases].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        sortedPurchases.forEach(purchase => {
            purchase.items.forEach(item => {
                ingredientCostMap.set(item.ingredientId, item.unitCost);
            });
        });

        return products.map(product => {
            const recipeCost = (product.recipe || []).reduce((totalCost, item) => {
                if (item.ingredientId.startsWith('CATEGORY::')) {
                    const category = item.ingredientId.split('::')[1];
                    const ingredientsInCategory = ingredients.filter(ing => ing.category === category);

                    if (ingredientsInCategory.length === 0) return totalCost;

                    const costsPerConsumptionUnit = ingredientsInCategory.map(ing => {
                        const latestUnitCost = ingredientCostMap.get(ing.id) ?? 0;
                        return ing.consumptionUnitsPerPurchaseUnit > 0 ? latestUnitCost / ing.consumptionUnitsPerPurchaseUnit : 0;
                    });

                    const highestCost = Math.max(...costsPerConsumptionUnit);
                    return totalCost + (highestCost * item.quantity);

                } else {
                    const ingredient = ingredientsMap.get(item.ingredientId);
                    if (!ingredient || !ingredient.consumptionUnitsPerPurchaseUnit) return totalCost;

                    const latestUnitCost = ingredientCostMap.get(item.ingredientId) ?? 0;
                    const costPerConsumptionUnit = latestUnitCost / ingredient.consumptionUnitsPerPurchaseUnit;
                    return totalCost + (costPerConsumptionUnit * item.quantity);
                }
            }, 0);

            // Calcular cuántas unidades se pueden hacer (el cuello de botella) o usar el stock directo
            let availableUnits = 0;
            if (product.recipe && product.recipe.length > 0) {
                const unitsPerIngredient = product.recipe.map(item => {
                    // Si el ingrediente es variable, no limita la producción en esta vista.
                    if (item.ingredientId.startsWith('CATEGORY::')) return Infinity;

                    const ingredient = ingredientsMap.get(item.ingredientId);
                    if (!ingredient || !item.quantity) return Infinity;

                    const totalStockInConsumptionUnits = ingredient.stock ?? 0;
                    return Math.floor(totalStockInConsumptionUnits / item.quantity);
                });
                const minUnits = Math.min(...unitsPerIngredient);
                availableUnits = isFinite(minUnits) ? minUnits : 0;
            } else {
                availableUnits = product.stock ?? 0;
            }

            return {
                ...product,
                recipeCost,
                estimatedProfit: product.price - recipeCost,
                availableUnits,
            };
        });
    }, [products, ingredients, purchases]);

    // Preparamos los ingredientes con su costo más reciente para el formulario.
    const enrichedIngredientsForForm = useMemo((): EnrichedIngredient[] => {
        if (!ingredients.length) return [];

        const ingredientCostMap = new Map<string, number>();
        const sortedPurchases = [...purchases].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        sortedPurchases.forEach(purchase => {
            purchase.items.forEach(item => {
                ingredientCostMap.set(item.ingredientId, item.unitCost);
            });
        });

        return ingredients.map(ing => ({
            ...ing,
            cost: ingredientCostMap.get(ing.id) ?? 0 // Asigna el costo más reciente o 0 si no hay compras
        }));
    }, [ingredients, purchases]);

    // Se ejecuta después de que los productos y sus costos enriquecidos han sido calculados.
    useEffect(() => {
        if (pageLoading || !products.length || !enrichedProducts.length) {
            return; // No hacer nada si los datos no están listos.
        }

        const updatesToPerform: Promise<void>[] = [];
        const productsMap = new Map(products.map(p => [p.id, p]));

        enrichedProducts.forEach(enrichedProduct => {
            const originalProduct = productsMap.get(enrichedProduct.id);
            // Comparamos el costo almacenado con el recién calculado, redondeando para evitar errores de punto flotante.
            const storedCost = Math.round((originalProduct?.cost ?? -1) * 100); // Usamos -1 para forzar la actualización la primera vez.
            const calculatedCost = Math.round(enrichedProduct.recipeCost * 100);

            if (storedCost !== calculatedCost) {
                console.log(`Sincronizando costo para "${enrichedProduct.name}": ${storedCost / 100} -> ${calculatedCost / 100}`);
                updatesToPerform.push(updateProduct(shopId!, enrichedProduct.id, {cost: enrichedProduct.recipeCost}));
            }
        });

        if (updatesToPerform.length > 0) {
            Promise.all(updatesToPerform)
                .then(() => console.log(`${updatesToPerform.length} costos de producto sincronizados con éxito.`))
                .catch(error => console.error("Error durante la sincronización de costos:", error));
        }
    }, [enrichedProducts, products, pageLoading, shopId]);

    if (authLoading || pageLoading) return <FullScreenLoader/>;

    if (!shopId) {
        return <p>Por favor, selecciona una heladería para gestionar los productos.</p>;
    }

    const handleOpenAddModal = () => {
        setEditingProduct(undefined);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product: EnrichedProduct) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDeleteProduct = async (productId: string) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
            try {
                await deleteProduct(shopId!, productId);
                setRefetchTrigger(c => c + 1); // Recargar
            } catch (error) {
                console.error("Error al eliminar el producto:", error);
            }
        }
    };

    const handleFormSubmit = () => {
        setIsModalOpen(false);
        setRefetchTrigger(c => c + 1); // Recargar
    };

    return (
        <>
            <main className="px-md-4">
                <Breadcrumbs/>
                <div
                    className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 className="h2">Gestión de Productos</h1>
                    <div className="btn-toolbar mb-2 mb-md-0">
                        <button type="button" className="btn btn-sm btn-outline-primary"
                                onClick={handleOpenAddModal}>
                            + Crear Producto
                        </button>
                    </div>
                </div>
                <ProductTable products={enrichedProducts} onEdit={handleOpenEditModal} onDelete={handleDeleteProduct}/>
            </main>
            <Modal title={editingProduct ? "Editar Producto" : "Crear Nuevo Producto"} show={isModalOpen}
                   onClose={() => setIsModalOpen(false)}>
                <ProductForm
                    onFormSubmit={handleFormSubmit}
                    productToEdit={editingProduct}
                    shopId={shopId}
                    availableIngredients={enrichedIngredientsForForm}
                />
            </Modal>
        </>
    );
};

export default ProductsPage;