import {useState, useEffect, FC, useMemo, useRef} from "react";
import {useAuthStore} from "../../store/authStore.ts";
import FullScreenLoader from "../../components/general/FullScreenLoader.tsx";
import Breadcrumbs from "../../components/general/Breadcrumbs.tsx";
import {getProducts, deleteProduct, updateProduct, addProduct} from "../../services/productServices.ts";
import {Product, Ingredient, EnrichedProduct, Purchase, EnrichedIngredient} from "../../types";
import Modal from "../../components/general/Modal.tsx";
import ProductForm from "../../components/products/ProductForm.tsx";
import ProductTable from "../../components/products/ProductTable.tsx";
import {getIngredients} from "../../services/ingredientServices.ts";
import {getPurchases} from "../../services/purchaseServices.ts";
import {searchMasterProducts, createProductRequest} from "../../services/masterProductService.ts";
import {MasterProduct} from "../../types/masterProduct.types.ts";
import {useToast} from "../../context/ToastContext.tsx";
import {Search, Tag, Send, PlusCircle, ArrowLeft} from 'react-bootstrap-icons';

const ProductsPage: FC = () => {
    const {activeIceCreamShopId: heladeriaId, loading: authLoading} = useAuthStore();
    const {showToast} = useToast();
    const [pageLoading, setPageLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<EnrichedProduct | undefined>(undefined);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    // --- Catalog search state ---
    const [showCatalogModal, setShowCatalogModal] = useState(false);
    const [catalogSearch, setCatalogSearch] = useState('');
    const [catalogResults, setCatalogResults] = useState<MasterProduct[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedMasterProduct, setSelectedMasterProduct] = useState<MasterProduct | null>(null);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [localPrice, setLocalPrice] = useState('');
    const [localCost, setLocalCost] = useState('');
    const [initialStock, setInitialStock] = useState('');
    // Request form
    const [reqName, setReqName] = useState('');
    const [reqBrand, setReqBrand] = useState('');
    const [reqBarcode, setReqBarcode] = useState('');
    const [reqCategory, setReqCategory] = useState('');
    const [submittingReq, setSubmittingReq] = useState(false);
    const [addingProduct, setAddingProduct] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!heladeriaId) return;
            setPageLoading(true);
            try {
                // Ahora cargamos productos, ingredientes y compras en paralelo
                const [productsData, ingredientsData, purchasesData] = await Promise.all([
                    getProducts(heladeriaId),
                    getIngredients(heladeriaId),
                    getPurchases(heladeriaId)
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
    }, [heladeriaId, refetchTrigger]);

    // --- Lógica para enriquecer los productos con datos calculados ---
    const enrichedProducts = useMemo((): EnrichedProduct[] => {
        if (!products.length) return [];

        const ingredientsMap = new Map(ingredients.map(ing => [ing.id, ing]));

        // 1. Crear un mapa con el costo más reciente de cada ingrediente
        const ingredientCostMap = new Map<string, number>();
        // Ordenamos las compras de la más antigua a la más nueva para que la última sobrescriba
        const sortedPurchases = [...purchases].sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
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
        const sortedPurchases = [...purchases].sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
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
                updatesToPerform.push(updateProduct(heladeriaId!, enrichedProduct.id, {cost: enrichedProduct.recipeCost}));
            }
        });

        if (updatesToPerform.length > 0) {
            Promise.all(updatesToPerform)
                .then(() => console.log(`${updatesToPerform.length} costos de producto sincronizados con éxito.`))
                .catch(error => console.error("Error durante la sincronización de costos:", error));
        }
    }, [enrichedProducts, products, pageLoading, heladeriaId]);

    if (authLoading || pageLoading) return <FullScreenLoader/>;

    if (!heladeriaId) {
        return <p>Por favor, selecciona una heladería para gestionar los productos.</p>;
    }

    // --- Catalog search handlers ---
    const handleCatalogSearchChange = (q: string) => {
        setCatalogSearch(q);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (!q.trim()) { setCatalogResults([]); return; }
        searchTimeout.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const results = await searchMasterProducts(q);
                setCatalogResults(results);
            } finally {
                setSearchLoading(false);
            }
        }, 400);
    };

    const openCatalogModal = () => {
        setCatalogSearch('');
        setCatalogResults([]);
        setSelectedMasterProduct(null);
        setShowRequestForm(false);
        setLocalPrice('');
        setLocalCost('');
        setInitialStock('0');
        setReqName(''); setReqBrand(''); setReqBarcode(''); setReqCategory('');
        setShowCatalogModal(true);
    };

    const handleSelectFromCatalog = (mp: MasterProduct) => {
        setSelectedMasterProduct(mp);
        setCatalogResults([]);
        setLocalPrice('');
        setLocalCost('');
        setInitialStock('0');
    };

    const handleAddProductFromCatalog = async () => {
        if (!selectedMasterProduct || !heladeriaId) return;
        const price = parseFloat(localPrice);
        if (isNaN(price) || price <= 0) {
            showToast('Ingresa un precio de venta válido', 'warning');
            return;
        }
        setAddingProduct(true);
        try {
            await addProduct(heladeriaId, {
                master_product_id: selectedMasterProduct.id,
                name: selectedMasterProduct.name,
                category: selectedMasterProduct.category,
                image_url: selectedMasterProduct.image_url,
                description: selectedMasterProduct.description,
                price,
                cost: parseFloat(localCost) || 0,
                stock: parseFloat(initialStock) || 0,
                is_available: true,
            } as any);
            showToast(`"${selectedMasterProduct.name}" añadido a tu catálogo ✓`, 'success');
            setShowCatalogModal(false);
            setRefetchTrigger(c => c + 1);
        } catch (e: any) {
            showToast(e?.message || 'Error al añadir producto', 'danger');
        } finally {
            setAddingProduct(false);
        }
    };

    const handleSubmitRequest = async () => {
        if (!reqName.trim() || !heladeriaId) {
            showToast('El nombre del producto es obligatorio', 'warning');
            return;
        }
        setSubmittingReq(true);
        try {
            await createProductRequest(heladeriaId, {
                requested_name: reqName,
                requested_brand: reqBrand || undefined,
                requested_barcode: reqBarcode || undefined,
                requested_category: reqCategory || undefined,
            });
            showToast('✅ Solicitud enviada. El administrador la revisará pronto.', 'success');
            setShowCatalogModal(false);
        } catch {
            showToast('Error al enviar la solicitud', 'danger');
        } finally {
            setSubmittingReq(false);
        }
    };

    const handleOpenAddModal = () => openCatalogModal();

    const handleOpenEditModal = (product: EnrichedProduct) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDeleteProduct = async (productId: string) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
            try {
                await deleteProduct(heladeriaId!, productId);
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
                        <button type="button" className="btn btn-sm btn-primary d-flex align-items-center gap-2 rounded-pill px-3"
                                onClick={handleOpenAddModal}>
                            <PlusCircle size={16}/> Añadir Producto del Catálogo
                        </button>
                    </div>
                </div>
                <ProductTable products={enrichedProducts} onEdit={handleOpenEditModal} onDelete={handleDeleteProduct}/>
            </main>

            {/* Modal Editar Producto (stock bloqueado) */}
            <Modal title="Editar Producto" show={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="alert alert-info small py-2 mb-3 d-flex align-items-center gap-2">
                    📦 <span>El <strong>stock</strong> se actualiza automáticamente con las Compras y Ventas. No se puede editar aquí.</span>
                </div>
                <ProductForm
                    onFormSubmit={handleFormSubmit}
                    productToEdit={editingProduct}
                    shopId={heladeriaId}
                    availableIngredients={enrichedIngredientsForForm}
                    lockStock={true}
                />
            </Modal>

            {/* Modal Catálogo Maestro */}
            {showCatalogModal && (
                <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.6)'}}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                                    <Tag className="text-primary" size={20}/>
                                    {showRequestForm ? '📋 Solicitar Nuevo Producto' : selectedMasterProduct ? `Añadir: ${selectedMasterProduct.name}` : '🔍 Buscar en el Catálogo Oficial'}
                                </h5>
                                <button className="btn-close" onClick={() => setShowCatalogModal(false)} />
                            </div>
                            <div className="modal-body">
                                {/* STEP 1: Search */}
                                {!selectedMasterProduct && !showRequestForm && (
                                    <>
                                        <p className="text-secondary small mb-3">Escribe el nombre o código de barras del producto que quieres añadir a tu tienda.</p>
                                        <div className="input-group mb-3">
                                            <span className="input-group-text bg-transparent"><Search size={16}/></span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Ej: Coca-Cola 1.5L, 7702001090762..."
                                                value={catalogSearch}
                                                onChange={e => handleCatalogSearchChange(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        {searchLoading && <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-primary" /></div>}
                                        {catalogResults.length > 0 && (
                                            <div className="list-group">
                                                {catalogResults.map(mp => (
                                                    <button
                                                        key={mp.id}
                                                        className="list-group-item list-group-item-action d-flex align-items-center gap-3"
                                                        onClick={() => handleSelectFromCatalog(mp)}
                                                    >
                                                        {mp.image_url
                                                            ? <img src={mp.image_url} alt={mp.name} style={{width:40,height:40,objectFit:'cover',borderRadius:6}} />
                                                            : <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{width:40,height:40}}><Tag size={16} className="text-muted"/></div>
                                                        }
                                                        <div>
                                                            <div className="fw-semibold">{mp.name}</div>
                                                            <div className="small text-muted">{mp.brand && <span>{mp.brand} · </span>}<span className="badge bg-light text-dark">{mp.category}</span></div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {catalogSearch.length > 2 && !searchLoading && catalogResults.length === 0 && (
                                            <div className="text-center py-4">
                                                <p className="text-secondary">No se encontró <strong>"{catalogSearch}"</strong> en el catálogo.</p>
                                                <button className="btn btn-outline-warning rounded-pill px-4 d-flex align-items-center gap-2 mx-auto" onClick={() => { setReqName(catalogSearch); setShowRequestForm(true); }}>
                                                    <Send size={16}/> Solicitar que se añada este producto
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* STEP 2: Set local price */}
                                {selectedMasterProduct && !showRequestForm && (
                                    <>
                                        <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-body-tertiary rounded-3">
                                            {selectedMasterProduct.image_url && <img src={selectedMasterProduct.image_url} alt={selectedMasterProduct.name} style={{width:64,height:64,objectFit:'cover',borderRadius:10}} />}
                                            <div>
                                                <div className="fw-bold fs-6">{selectedMasterProduct.name}</div>
                                                {selectedMasterProduct.brand && <div className="text-muted small">{selectedMasterProduct.brand}</div>}
                                                <span className="badge bg-primary bg-opacity-10 text-primary">{selectedMasterProduct.category}</span>
                                            </div>
                                        </div>
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold small text-secondary">Precio de Venta (COP) *</label>
                                                <input type="number" className="form-control" placeholder="Ej: 2500" min="0" value={localPrice} onChange={e => setLocalPrice(e.target.value)} autoFocus />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold small text-secondary">Costo (COP)</label>
                                                <input type="number" className="form-control" placeholder="Ej: 1800" min="0" value={localCost} onChange={e => setLocalCost(e.target.value)} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold small text-secondary">Stock Inicial</label>
                                                <input type="number" className="form-control" placeholder="Ej: 50" min="0" value={initialStock} onChange={e => setInitialStock(e.target.value)} />
                                                <div className="form-text">Después el stock se mueve solo con Ventas y Compras.</div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* STEP 3: Request form */}
                                {showRequestForm && (
                                    <>
                                        <p className="text-secondary small mb-3">Completa los datos que conozcas. El administrador lo revisará y lo añadirá al catálogo oficial.</p>
                                        {[{k:'reqName', l:'Nombre del producto *', pl:'Ej: Coca-Cola 1.5L', val: reqName, set: setReqName},
                                          {k:'reqBrand', l:'Marca', pl:'Ej: Coca-Cola', val: reqBrand, set: setReqBrand},
                                          {k:'reqBarcode', l:'Código de barras (si lo tienes)', pl:'Ej: 7702001090762', val: reqBarcode, set: setReqBarcode},
                                          {k:'reqCategory', l:'Categoría sugerida', pl:'Ej: Bebidas', val: reqCategory, set: setReqCategory},
                                        ].map(({k, l, pl, val, set}) => (
                                            <div key={k} className="mb-3">
                                                <label className="form-label small fw-semibold text-secondary">{l}</label>
                                                <input type="text" className="form-control" placeholder={pl} value={val} onChange={e => set(e.target.value)} />
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                            <div className="modal-footer border-0">
                                {showRequestForm ? (
                                    <>
                                        <button className="btn btn-outline-secondary rounded-pill" onClick={() => setShowRequestForm(false)}><ArrowLeft size={14} className="me-1"/>Volver</button>
                                        <button className="btn btn-warning rounded-pill px-4 fw-bold" onClick={handleSubmitRequest} disabled={submittingReq}>
                                            {submittingReq ? <><span className="spinner-border spinner-border-sm me-2"/>Enviando...</> : <><Send size={14} className="me-1"/>Enviar Solicitud</>}
                                        </button>
                                    </>
                                ) : selectedMasterProduct ? (
                                    <>
                                        <button className="btn btn-outline-secondary rounded-pill" onClick={() => setSelectedMasterProduct(null)}><ArrowLeft size={14} className="me-1"/>Volver al catálogo</button>
                                        <button className="btn btn-primary rounded-pill px-4 fw-bold" onClick={handleAddProductFromCatalog} disabled={addingProduct}>
                                            {addingProduct ? <><span className="spinner-border spinner-border-sm me-2"/>Añadiendo...</> : 'Añadir a mi Tienda'}
                                        </button>
                                    </>
                                ) : (
                                    <button className="btn btn-outline-secondary rounded-pill" onClick={() => setShowCatalogModal(false)}>Cancelar</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductsPage;