import { useState, useEffect, useRef, FC, ChangeEvent, FormEvent } from 'react';
import { addPurchase, updatePurchase } from '../../../services/shop/purchaseServices';
import { getIngredients } from '../../../services/shop/ingredientServices';
import { getProducts } from '../../../services/shop/productServices';
import Alert from '../../shared/Alert';
import { Ingredient, Purchase, NewPurchaseData, PurchaseItem, Supplier, UpdatePurchaseData, Product } from "../../../types";
import { getSuppliers } from "../../../services/shop/supplierService";
import Modal from "../../shared/Modal";
import { useAuthStore } from "../../../store/authStore";
import SupplierForm from "../suppliers/SupplierForm";
import { usePermissions } from "../../../hooks/usePermissions.ts";
import { Trash } from "react-bootstrap-icons";

interface AddPurchaseFormProps {
    onFormSubmit: () => void;
    shopId: string;
    purchaseToEdit?: Purchase;
}

interface FormDataState {
    supplierId: string;
    invoiceNumber: string;
    items: PurchaseItem[];
}

interface CurrentItemState {
    itemId: string;
    itemType: 'ingredient' | 'product' | '';
    quantity: string;
    itemTotalCost: string;
    selectedUnit: string;
    // Proveedor por ítem (modo multi-proveedor)
    itemSupplierId: string;
}

const fmt = (v: number) => new Intl.NumberFormat('es-CO').format(v);

const AddPurchaseForm: FC<AddPurchaseFormProps> = ({ onFormSubmit, shopId, purchaseToEdit }) => {
    const { user } = useAuthStore();
    const { hasPermission } = usePermissions();
    const canCreateSupplier = hasPermission('suppliers_create');

    const initialState: FormDataState = { supplierId: '', invoiceNumber: '', items: [] };
    const initialItemState: CurrentItemState = {
        itemId: '', itemType: '', quantity: '', itemTotalCost: '', selectedUnit: '', itemSupplierId: ''
    };

    const [formData, setFormData] = useState<FormDataState>(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [nextInternalInvoice, setNextInternalInvoice] = useState<string>('----');

    const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [currentItem, setCurrentItem] = useState<CurrentItemState>(initialItemState);
    const [selectionType, setSelectionType] = useState<'ingredient' | 'product'>('ingredient');
    const [purchaseMode, setPurchaseMode] = useState<'unit' | 'package'>('unit');

    // NUEVO: modo de proveedor
    const [supplierMode, setSupplierMode] = useState<'single' | 'multi'>('single');

    // CORREGIDO: precio por paquete (no por unidad)
    const [packageDetails, setPackageDetails] = useState({
        numPackages: '',
        unitsPerPackage: '',
        pricePerPackage: '' // ← Ahora es precio por paquete
    });

    const ingredientSelectRef = useRef<HTMLSelectElement>(null);

    const fetchData = async () => {
        try {
            const [ingredients, suppliers, products] = await Promise.all([
                getIngredients(shopId),
                getSuppliers(shopId),
                getProducts(shopId)
            ]);
            setAvailableIngredients(ingredients);
            setAvailableSuppliers(suppliers);
            setAvailableProducts(products);
        } catch {
            setError('No se pudieron cargar los datos iniciales.');
        }
    };

    useEffect(() => {
        fetchData();
        if (purchaseToEdit) {
            setFormData({
                supplierId: purchaseToEdit.supplierId,
                invoiceNumber: purchaseToEdit.invoiceNumber || '',
                items: purchaseToEdit.items,
            });
        } else {
            setFormData(initialState);
        }
    }, [shopId, purchaseToEdit]);

    useEffect(() => {
        if (formData.supplierId) {
            const s = availableSuppliers.find(s => s.id === formData.supplierId);
            setNextInternalInvoice(String((s?.purchaseCount || 0) + 1).padStart(4, '0'));
        } else {
            setNextInternalInvoice('----');
        }
    }, [formData.supplierId, availableSuppliers]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCurrentItemChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'itemSelection') {
            if (!value) {
                setCurrentItem({ ...currentItem, itemId: '', itemType: '', selectedUnit: '' });
                return;
            }
            const [type, id] = value.split('::');
            let unit = '';
            if (type === 'ingredient') {
                const ing = availableIngredients.find(i => i.id === id);
                unit = ing ? ing.purchaseUnit : '';
            } else {
                unit = 'Unidad';
            }
            setCurrentItem({ ...currentItem, itemId: id, itemType: type as 'ingredient' | 'product', selectedUnit: unit });
        } else {
            setCurrentItem({ ...currentItem, [name]: value });
        }
    };

    // Calculo en tiempo real para el modo paquete
    const pkgTotal = (() => {
        const n = parseFloat(packageDetails.numPackages);
        const u = parseFloat(packageDetails.unitsPerPackage);
        const p = parseFloat(packageDetails.pricePerPackage);
        if (!isNaN(n) && !isNaN(u) && !isNaN(p) && n > 0 && u > 0 && p > 0) {
            const totalUnits = n * u;
            const totalCost = n * p;
            const pricePerUnit = p / u;
            return { totalUnits, totalCost, pricePerUnit, valid: true };
        }
        return { totalUnits: 0, totalCost: 0, pricePerUnit: 0, valid: false };
    })();

    const getItemSupplier = (itemSupplierId: string) => {
        if (supplierMode === 'single') return { id: formData.supplierId, name: availableSuppliers.find(s => s.id === formData.supplierId)?.name || '' };
        const sup = availableSuppliers.find(s => s.id === itemSupplierId);
        return { id: itemSupplierId, name: sup?.name || '' };
    };

    const handleAddItem = () => {
        setError('');

        // --- MODO PAQUETE ---
        if (selectionType === 'product' && purchaseMode === 'package') {
            if (!currentItem.itemId || !pkgTotal.valid) {
                setError('Completa todos los campos del paquete con valores válidos.');
                return;
            }
            if (supplierMode === 'multi' && !currentItem.itemSupplierId) {
                setError('Selecciona el proveedor para este ítem.');
                return;
            }
            if (formData.items.some(i => i.productId === currentItem.itemId)) {
                setError('Este producto ya fue añadido.');
                return;
            }
            const product = availableProducts.find(p => p.id === currentItem.itemId);
            if (!product) { setError('Producto no válido.'); return; }

            const sup = getItemSupplier(currentItem.itemSupplierId);
            const newItem: PurchaseItem = {
                itemType: 'product',
                productId: currentItem.itemId,
                name: `${product.name} (Paquete x${packageDetails.unitsPerPackage})`,
                purchaseUnit: 'Unidad',
                quantity: pkgTotal.totalUnits,
                unitCost: pkgTotal.pricePerUnit,
                consumptionUnitsPerPurchaseUnit: 1,
                ...(supplierMode === 'multi' && { supplierId: sup.id, supplierName: sup.name }),
            };

            setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
            setCurrentItem(initialItemState);
            setPackageDetails({ numPackages: '', unitsPerPackage: '', pricePerPackage: '' });
            ingredientSelectRef.current?.focus();
            return;
        }

        // --- MODO UNIDAD ---
        const quantity = parseFloat(currentItem.quantity);
        const totalCost = parseFloat(currentItem.itemTotalCost);

        if (!currentItem.itemId || isNaN(quantity) || quantity <= 0 || isNaN(totalCost) || totalCost <= 0) {
            setError('Selecciona un ítem y especifica cantidad y costo total válidos.');
            return;
        }
        if (supplierMode === 'multi' && !currentItem.itemSupplierId) {
            setError('Selecciona el proveedor para este ítem.');
            return;
        }
        if (formData.items.some(i =>
            (i.ingredientId === currentItem.itemId && currentItem.itemType === 'ingredient') ||
            (i.productId === currentItem.itemId && currentItem.itemType === 'product')
        )) {
            setError('Este ítem ya fue añadido.');
            return;
        }

        let name = '', purchaseUnit = '', consumptionUnitsPerPurchaseUnit = 1;
        if (currentItem.itemType === 'ingredient') {
            const ing = availableIngredients.find(i => i.id === currentItem.itemId);
            if (!ing) { setError('Ingrediente no válido.'); return; }
            name = ing.name;
            purchaseUnit = ing.purchaseUnit;
            consumptionUnitsPerPurchaseUnit = ing.consumptionUnitsPerPurchaseUnit;
        } else {
            const prod = availableProducts.find(p => p.id === currentItem.itemId);
            if (!prod) { setError('Producto no válido.'); return; }
            name = prod.name;
            purchaseUnit = 'Unidad';
        }

        const sup = getItemSupplier(currentItem.itemSupplierId);
        const newItem: PurchaseItem = {
            itemType: currentItem.itemType as 'ingredient' | 'product',
            name, purchaseUnit,
            quantity,
            unitCost: totalCost / quantity,
            consumptionUnitsPerPurchaseUnit,
            ...(currentItem.itemType === 'ingredient' ? { ingredientId: currentItem.itemId } : { productId: currentItem.itemId }),
            ...(supplierMode === 'multi' && { supplierId: sup.id, supplierName: sup.name }),
        };

        setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
        setCurrentItem(initialItemState);
        ingredientSelectRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); }
    };

    const handleRemoveItem = (idx: number) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (formData.items.length === 0) {
            setError('Añade al menos un ítem a la compra.');
            setLoading(false);
            return;
        }

        // En modo single, el proveedor global es requerido
        if (supplierMode === 'single' && !formData.supplierId) {
            setError('Selecciona un proveedor.');
            setLoading(false);
            return;
        }

        const selectedSupplier = availableSuppliers.find(s => s.id === formData.supplierId);
        const total = formData.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

        try {
            if (purchaseToEdit) {
                const dataToUpdate: UpdatePurchaseData = {
                    ...formData,
                    supplierName: selectedSupplier?.name || 'Varios',
                    total
                };
                await updatePurchase(shopId, purchaseToEdit.id, dataToUpdate);
                setSuccess('¡Compra actualizada con éxito!');
            } else {
                const dataToSave: NewPurchaseData = {
                    ...formData,
                    supplierId: formData.supplierId || 'MULTI',
                    supplierName: selectedSupplier?.name || 'Varios Proveedores',
                    purchasedByEmployeeId: user!.uid!,
                    total,
                    internalInvoiceNumber: 'PENDING',
                };
                await addPurchase(shopId, dataToSave);
                setSuccess('¡Compra registrada con éxito!');
            }
            setTimeout(() => onFormSubmit(), 1200);
        } catch (err: any) {
            setError(err.message || 'Error al registrar la compra.');
        } finally {
            setLoading(false);
        }
    };

    const totalCompra = formData.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

    return (
        <>
            {error && <Alert type="danger" message={error} />}
            {success && <Alert type="success" message={success} />}
            <form onSubmit={handleSubmit}>

                {/* ── MODO DE PROVEEDOR ── */}
                <div className="mb-4">
                    <label className="form-label fw-bold">Tipo de Compra</label>
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            className={`btn btn-sm rounded-pill px-3 ${supplierMode === 'single' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setSupplierMode('single')}
                        >
                            🏪 Un solo proveedor
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm rounded-pill px-3 ${supplierMode === 'multi' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => { setSupplierMode('multi'); setFormData(prev => ({ ...prev, supplierId: '' })); }}
                        >
                            🏬 Varios proveedores
                        </button>
                    </div>
                </div>

                {/* ── DETALLES GENERALES ── */}
                <h5 className="mb-3">Detalles de la Compra</h5>
                <div className="row mb-4 g-3">
                    {supplierMode === 'single' && (
                        <div className="col-md-6">
                            <label className="form-label">Proveedor</label>
                            <div className="input-group">
                                <select
                                    className="form-select"
                                    value={formData.supplierId}
                                    onChange={e => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                                    required={supplierMode === 'single'}
                                >
                                    <option value="">Selecciona un proveedor...</option>
                                    {availableSuppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                {canCreateSupplier && (
                                    <button className="btn btn-outline-secondary" type="button"
                                        onClick={() => setIsSupplierModalOpen(true)} title="Nuevo proveedor">+
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    <div className={supplierMode === 'single' ? 'col-md-3' : 'col-md-6'}>
                        <label className="form-label">Número de Factura</label>
                        <input type="text" className="form-control" name="invoiceNumber"
                            value={formData.invoiceNumber} onChange={handleChange} required />
                    </div>
                    {supplierMode === 'single' && (
                        <div className="col-md-3">
                            <label className="form-label">N° Interno</label>
                            <input type="text" className="form-control" value={nextInternalInvoice} readOnly disabled />
                        </div>
                    )}
                </div>

                {/* ── AÑADIR ÍTEMS ── */}
                <h5 className="mb-3">Ítems de la Compra</h5>
                <div
                    className="rounded-3 p-3 mb-3"
                    style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}
                >
                    {/* Selectores de tipo y modo alineados en una sola fila */}
                    <div className="row mb-3 g-3">
                        <div className={selectionType === 'product' ? "col-md-6" : "col-12"}>
                            <label className="form-label small fw-bold text-muted text-uppercase d-block mb-2">Tipo de Ítem</label>
                            <div className="btn-group w-100" role="group">
                                <input type="radio" className="btn-check" name="selType" id="selIng" autoComplete="off"
                                    checked={selectionType === 'ingredient'}
                                    onChange={() => { setSelectionType('ingredient'); setCurrentItem(initialItemState); }} />
                                <label className="btn btn-outline-primary btn-sm flex-fill py-2" htmlFor="selIng">Ingrediente / Insumo</label>

                                <input type="radio" className="btn-check" name="selType" id="selProd" autoComplete="off"
                                    checked={selectionType === 'product'}
                                    onChange={() => { setSelectionType('product'); setCurrentItem(initialItemState); }} />
                                <label className="btn btn-outline-primary btn-sm flex-fill py-2" htmlFor="selProd">Producto Terminado</label>
                            </div>
                        </div>

                        {/* Modo compra (solo productos) */}
                        {selectionType === 'product' && (
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted text-uppercase d-block mb-2">Modo de Compra</label>
                                <div className="btn-group w-100" role="group">
                                    <input type="radio" className="btn-check" name="pMode" id="mUnit" autoComplete="off"
                                        checked={purchaseMode === 'unit'}
                                        onChange={() => { setPurchaseMode('unit'); setPackageDetails({ numPackages: '', unitsPerPackage: '', pricePerPackage: '' }); }} />
                                    <label className="btn btn-outline-secondary btn-sm flex-fill py-2" htmlFor="mUnit">🛒 Por Unidad</label>

                                    <input type="radio" className="btn-check" name="pMode" id="mPkg" autoComplete="off"
                                        checked={purchaseMode === 'package'}
                                        onChange={() => { setPurchaseMode('package'); setCurrentItem(prev => ({ ...prev, quantity: '', itemTotalCost: '' })); }} />
                                    <label className="btn btn-outline-secondary btn-sm flex-fill py-2" htmlFor="mPkg">📦 Por Paquete</label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="row g-2 align-items-end">
                        {/* Selector de producto/ingrediente */}
                        <div className="col-md-4">
                            <label className="form-label small">
                                {selectionType === 'ingredient' ? 'Ingrediente' : 'Producto'}
                            </label>
                            <select
                                ref={ingredientSelectRef}
                                className="form-select form-select-sm"
                                name="itemSelection"
                                value={currentItem.itemId ? `${currentItem.itemType}::${currentItem.itemId}` : ''}
                                onChange={handleCurrentItemChange}
                            >
                                <option value="">Selecciona...</option>
                                {selectionType === 'ingredient' && availableIngredients.map(ing => (
                                    <option key={ing.id} value={`ingredient::${ing.id}`}>{ing.name}</option>
                                ))}
                                {selectionType === 'product' && availableProducts.map(p => (
                                    <option key={p.id} value={`product::${p.id}`}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Proveedor por ítem (solo multi) */}
                        {supplierMode === 'multi' && (
                            <div className="col-md-3">
                                <label className="form-label small">Proveedor del Ítem</label>
                                <select
                                    className="form-select form-select-sm"
                                    name="itemSupplierId"
                                    value={currentItem.itemSupplierId}
                                    onChange={handleCurrentItemChange}
                                >
                                    <option value="">Selecciona proveedor...</option>
                                    {availableSuppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Campos de cantidad/costo por UNIDAD */}
                        {(selectionType === 'ingredient' || purchaseMode === 'unit') && (
                            <>
                                <div className="col">
                                    <label className="form-label small">
                                        Cantidad ({currentItem.selectedUnit || 'Unidad'})
                                    </label>
                                    <input type="number" step="0.01" className="form-control form-control-sm"
                                        name="quantity" value={currentItem.quantity}
                                        onChange={handleCurrentItemChange} onKeyDown={handleKeyDown} min="0.01" />
                                </div>
                                <div className="col">
                                    <label className="form-label small">Costo Total del Ítem</label>
                                    <input type="number" step="0.01" className="form-control form-control-sm"
                                        name="itemTotalCost" value={currentItem.itemTotalCost}
                                        onChange={handleCurrentItemChange} onKeyDown={handleKeyDown} min="0" />
                                </div>
                            </>
                        )}

                        {/* Campos de PAQUETE */}
                        {selectionType === 'product' && purchaseMode === 'package' && (
                            <>
                                <div className="col">
                                    <label className="form-label small"># Paquetes</label>
                                    <input type="number" className="form-control form-control-sm" min="1"
                                        placeholder="Ej: 3"
                                        value={packageDetails.numPackages}
                                        onChange={e => setPackageDetails(p => ({ ...p, numPackages: e.target.value }))} />
                                </div>
                                <div className="col">
                                    <label className="form-label small">Unid./Paquete</label>
                                    <input type="number" className="form-control form-control-sm" min="1"
                                        placeholder="Ej: 12"
                                        value={packageDetails.unitsPerPackage}
                                        onChange={e => setPackageDetails(p => ({ ...p, unitsPerPackage: e.target.value }))} />
                                </div>
                                <div className="col">
                                    <label className="form-label small">Precio/Paquete</label>
                                    <input type="number" className="form-control form-control-sm" min="0"
                                        placeholder="Ej: 18000"
                                        value={packageDetails.pricePerPackage}
                                        onChange={e => setPackageDetails(p => ({ ...p, pricePerPackage: e.target.value }))} />
                                </div>
                            </>
                        )}

                        {/* Botón añadir */}
                        <div className="col-auto">
                            <button type="button" className="btn btn-primary btn-sm w-100" onClick={handleAddItem}>
                                + Añadir
                            </button>
                        </div>
                    </div>

                    {/* Resumen paquete en tiempo real */}
                    {selectionType === 'product' && purchaseMode === 'package' && pkgTotal.valid && (
                        <div
                            className="mt-3 rounded-2 px-3 py-2 small d-flex align-items-center justify-content-between"
                            style={{ background: 'var(--bs-info-bg-subtle)', border: '1px solid var(--bs-info-border-subtle)' }}
                        >
                            <span>
                                📦 <strong>{fmt(parseFloat(packageDetails.numPackages))} paquetes</strong>
                                {' × '}<strong>{packageDetails.unitsPerPackage} u/paq.</strong>
                                {' = '}<strong>{fmt(pkgTotal.totalUnits)} unidades en total</strong>
                            </span>
                            <span>
                                Costo/u: <strong>${fmt(pkgTotal.pricePerUnit)}</strong>
                                {'  |  '}
                                <span className="fw-bold text-primary">Total: ${fmt(pkgTotal.totalCost)}</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* ── LISTA DE ÍTEMS ── */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Ítems Añadidos ({formData.items.length})</h6>
                    {formData.items.length > 0 && (
                        <span className="fw-bold text-primary">Total: ${fmt(totalCompra)}</span>
                    )}
                </div>

                {formData.items.length > 0 ? (
                    <div className="rounded-3 overflow-hidden border mb-4">
                        {formData.items.map((item, idx) => (
                            <div
                                key={idx}
                                className="d-flex align-items-center justify-content-between px-3 py-2"
                                style={{ borderBottom: idx < formData.items.length - 1 ? '1px solid var(--bs-border-color)' : 'none' }}
                            >
                                <div>
                                    <div className="fw-semibold">{item.name}</div>
                                    <div className="small text-muted">
                                        {fmt(item.quantity)} {item.purchaseUnit}
                                        {' · '}${fmt(item.unitCost)}/u
                                        {item.supplierName && (
                                            <span className="ms-2 badge bg-secondary rounded-pill">{item.supplierName}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    <span className="fw-bold">${fmt(item.quantity * item.unitCost)}</span>
                                    <button type="button" className="btn btn-sm btn-link text-danger p-0"
                                        onClick={() => handleRemoveItem(idx)}>
                                        <Trash size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div
                            className="px-3 py-2 d-flex justify-content-end fw-bold"
                            style={{ background: 'var(--bs-tertiary-bg)' }}
                        >
                            Total Compra: ${fmt(totalCompra)}
                        </div>
                    </div>
                ) : (
                    <p className="text-muted small mb-4">Aún no has añadido ítems a esta compra.</p>
                )}

                <div className="d-flex justify-content-end">
                    <button
                        className="btn btn-primary px-4 fw-bold"
                        type="submit"
                        disabled={loading || !!success || formData.items.length === 0}
                    >
                        {loading ? 'Guardando...' : (purchaseToEdit ? 'Actualizar Compra' : 'Registrar Compra')}
                    </button>
                </div>
            </form>

            <Modal title="Añadir Nuevo Proveedor" show={isSupplierModalOpen}
                onClose={() => setIsSupplierModalOpen(false)}>
                <SupplierForm shopId={shopId} onFormSubmit={() => { setIsSupplierModalOpen(false); fetchData(); }} />
            </Modal>
        </>
    );
};

export default AddPurchaseForm;