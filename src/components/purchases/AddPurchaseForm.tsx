import {useState, useEffect, useRef, FC, ChangeEvent, FormEvent} from 'react';
import {addPurchase, updatePurchase} from '../../services/purchaseServices';
import {getIngredients} from '../../services/ingredientServices';
import Alert from '../general/Alert';
import {Ingredient, Purchase, NewPurchaseData, PurchaseItem, Supplier, UpdatePurchaseData} from "../../types";
import {getSuppliers} from "../../services/supplierService";
import Modal from "../general/Modal";
import {useAuthStore} from "../../store/authStore";
import SupplierForm from "../suppliers/SupplierForm";
import {usePermissions} from "../../hooks/usePermissions.ts";

interface AddPurchaseFormProps {
    onFormSubmit: () => void;
    heladeriaId: string;
    purchaseToEdit?: Purchase;
}

interface FormDataState {
    supplierId: string;
    invoiceNumber: string;
    items: PurchaseItem[];
}

interface CurrentItemState {
    ingredientId: string;
    quantity: string;
    itemTotalCost: string;
    selectedUnit: string;
}

const AddPurchaseForm: FC<AddPurchaseFormProps> = ({onFormSubmit, heladeriaId, purchaseToEdit}) => {
    const {user} = useAuthStore();
    const {hasPermission} = usePermissions();
    const canCreateSupplier = hasPermission('suppliers_create');
    const initialState: FormDataState = {
        supplierId: '',
        invoiceNumber: '',
        items: [],
    };

    const [formData, setFormData] = useState<FormDataState>(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextInternalInvoice, setNextInternalInvoice] = useState<string>('----');
    const [success, setSuccess] = useState<string | null>(null);

    // --- Estados para la gestión de proveedores ---
    const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

    // Estados para la selección de ítems individuales
    const initialItemState: CurrentItemState = {ingredientId: '', quantity: '', itemTotalCost: '', selectedUnit: ''};
    const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
    const [currentItem, setCurrentItem] = useState<CurrentItemState>(initialItemState);
    const ingredientSelectRef = useRef<HTMLSelectElement>(null);

    // Cargar datos iniciales (ingredientes y proveedores)
    const fetchData = async () => {
        try {
            // Usamos Promise.all para cargar ambos recursos en paralelo, mejorando la eficiencia.
            const [ingredients, suppliers] = await Promise.all([
                getIngredients(heladeriaId),
                getSuppliers(heladeriaId)
            ]);
            setAvailableIngredients(ingredients);
            setAvailableSuppliers(suppliers);
        } catch (err) {
            setError('No se pudieron cargar los datos iniciales (ingredientes/proveedores).');
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
    }, [heladeriaId, purchaseToEdit]);

    // Efecto para calcular y mostrar el siguiente número de factura interno
    useEffect(() => {
        if (formData.supplierId) {
            const selectedSupplier = availableSuppliers.find(s => s.id === formData.supplierId);
            const nextCount = (selectedSupplier?.purchaseCount || 0) + 1;
            setNextInternalInvoice(String(nextCount).padStart(4, '0'));
        } else {
            setNextInternalInvoice('----');
        }
    }, [formData.supplierId, availableSuppliers]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleCurrentItemChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        const updatedItem = {...currentItem, [name]: value};

        if (name === 'ingredientId') {
            const ingredient = availableIngredients.find(ing => ing.id === value);
            updatedItem.selectedUnit = ingredient ? ingredient.purchaseUnit : '';
        }
        setCurrentItem(updatedItem);
    };

    const handleAddItem = () => {
        const quantity = parseFloat(currentItem.quantity);
        const totalCost = parseFloat(currentItem.itemTotalCost);

        if (!currentItem.ingredientId || isNaN(quantity) || quantity <= 0 || totalCost <= 0) {
            setError('Por favor, selecciona un ingrediente y especifica cantidad y costo unitario válidos.');
            return;
        }

        // Prevenir añadir el mismo ingrediente dos veces
        if (formData.items.some(item => item.ingredientId === currentItem.ingredientId)) {
            setError('Este ingrediente ya ha sido añadido a la compra. Puedes removerlo y volver a añadirlo si la cantidad es incorrecta.');
            return;
        }

        const ingredient = availableIngredients.find(ing => ing.id === currentItem.ingredientId);
        if (!ingredient) {
            setError('Ingrediente seleccionado no válido.');
            return;
        }

        // Calculamos el costo unitario a partir del total
        const unitCost = totalCost / quantity;

        const newItem: PurchaseItem = {
            ingredientId: ingredient.id,
            name: ingredient.name,
            purchaseUnit: ingredient.purchaseUnit,
            quantity: quantity,
            unitCost: unitCost,
            consumptionUnitsPerPurchaseUnit: ingredient.consumptionUnitsPerPurchaseUnit,
        };

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));

        // Limpiar campos de adición de ítem
        setCurrentItem(initialItemState);
        setError('');
        ingredientSelectRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevenir el envío del formulario
            handleAddItem();
        }
    };

    const handleRemoveItem = (indexToRemove: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleSupplierFormSubmit = () => {
        setIsSupplierModalOpen(false); // Cierra el modal de proveedores
        fetchData(); // Vuelve a cargar los datos para que el nuevo proveedor aparezca en la lista
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (formData.items.length === 0) {
            setError('La compra debe contener al menos un ítem.');
            setLoading(false);
            return;
        }

        const selectedSupplier = availableSuppliers.find(s => s.id === formData.supplierId);
        if (!selectedSupplier) {
            setError("Por favor, selecciona un proveedor válido.");
            setLoading(false);
            return;
        }
        try {
            if (purchaseToEdit) {
                const dataToUpdate: UpdatePurchaseData = {
                    ...formData,
                    supplierName: selectedSupplier.name,
                    total: formData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)
                };
                await updatePurchase(heladeriaId, purchaseToEdit.id, dataToUpdate);
                setSuccess('¡Compra actualizada con éxito!');
            } else {
                const dataToSave: NewPurchaseData = {
                    ...formData,
                    supplierName: selectedSupplier.name,
                    purchasedByEmployeeId: user!.uid,
                    total: formData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
                    internalInvoiceNumber: 'PENDING', // Valor temporal
                };
                await addPurchase(heladeriaId, dataToSave);
                setSuccess('¡Compra registrada con éxito!');
            }

            setTimeout(() => {
                onFormSubmit(); // Notificar al padre para que recargue la lista y cierre el modal
            }, 1200);

        } catch (err: any) {
            setError(err.message || 'Error al registrar la compra. Por favor, revisa los datos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {error && <Alert type="danger" message={error}/>}
            {success && <Alert type="success" message={success}/>}
            <form onSubmit={handleSubmit}>
                {/* Datos Generales de la Compra */}
                <h5>Detalles de la Compra</h5>
                <div className="row mb-3">
                    <div className="col-md-6">
                        <label htmlFor="supplierId" className="form-label">Proveedor</label>
                        <div className="input-group">
                            <select className="form-select" id="supplierId" name="supplierId"
                                    value={formData.supplierId}
                                    onChange={(e) => setFormData(prev => ({...prev, supplierId: e.target.value}))}
                                    required>
                                <option value="">Selecciona un proveedor...</option>
                                {availableSuppliers.map(sup => (
                                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                                ))}
                            </select>
                            {canCreateSupplier && (
                                <button className="btn btn-outline-secondary" type="button"
                                        onClick={() => setIsSupplierModalOpen(true)} title="Añadir Nuevo Proveedor">
                                    +
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="col-md-3">
                        <label htmlFor="invoiceNumber" className="form-label">Número de Factura</label>
                        <input type="text" className="form-control" id="invoiceNumber" name="invoiceNumber"
                               value={formData.invoiceNumber} onChange={handleChange} required/>
                    </div>
                    <div className="col-md-3">
                        <label htmlFor="internalInvoiceNumber" className="form-label">N° Interno</label>
                        <input type="text" className="form-control" id="internalInvoiceNumber"
                               value={nextInternalInvoice} readOnly disabled/>
                    </div>
                </div>

                {/* Añadir Ítems a la Compra */}
                <h5 className="mt-4">Ítems de la Compra</h5>
                <div className="card bg-light p-3 mb-3">
                    <div className="row">
                        <div className="col-md-7 mb-3">
                            <label htmlFor="selectedIngredient" className="form-label">Ingrediente</label>
                            <select ref={ingredientSelectRef} className="form-select" name="ingredientId"
                                    value={currentItem.ingredientId} onChange={handleCurrentItemChange}>
                                <option value="">Selecciona un ingrediente...</option>
                                {availableIngredients.map(ing => (
                                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-5 mb-3">
                            <div className="row">
                                <div className="col-6">
                                    <label htmlFor="itemQuantity" className="form-label">Cantidad
                                        ({currentItem.selectedUnit || 'Unidad'})</label>
                                    <input type="number" step="0.01" className="form-control" name="quantity"
                                           value={currentItem.quantity} onChange={handleCurrentItemChange}
                                           onKeyDown={handleKeyDown} min="0.01"/>
                                </div>
                                <div className="col-6">
                                    <label htmlFor="itemTotalCost" className="form-label">Costo Total del Ítem</label>
                                    <input type="number" step="0.01" className="form-control" name="itemTotalCost"
                                           value={currentItem.itemTotalCost} onChange={handleCurrentItemChange}
                                           onKeyDown={handleKeyDown} min="0.00"/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12 d-flex justify-content-end">
                            <button type="button" className="btn btn-primary" onClick={handleAddItem}>+ Añadir
                                Ítem a la Compra
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lista de Ítems Añadidos */}
                <h6>Ítems Añadidos ({formData.items.length})</h6>
                {formData.items.length > 0 ? (
                    <ul className="list-group mb-3">
                        {formData.items.map((item, index) => (
                            <li key={index}
                                className="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <span className="fw-bold">{item.name}</span>
                                    <br/>
                                    <small className="text-muted">{item.quantity} {item.purchaseUnit} a
                                        ${new Intl.NumberFormat('es-CO').format(item.unitCost)} c/u</small>
                                </div>
                                <div className="fw-bold">
                                    ${new Intl.NumberFormat('es-CO').format(item.quantity * item.unitCost)}
                                </div>
                                <button type="button" className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleRemoveItem(index)}>X
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted">Aún no has añadido ítems a esta compra.</p>
                )}

                <div className="d-flex justify-content-end mt-3">
                    <button className="btn btn-primary" type="submit"
                            disabled={loading || !!success || formData.items.length === 0}>
                        {loading ? 'Guardando...' : (purchaseToEdit ? 'Actualizar Compra' : 'Registrar Compra')}
                    </button>
                </div>
            </form>
            {/* Modal para añadir proveedor rápidamente. */}
            <Modal title="Añadir Nuevo Proveedor" show={isSupplierModalOpen}
                   onClose={() => setIsSupplierModalOpen(false)}>
                <SupplierForm
                    shopId={heladeriaId}
                    onFormSubmit={handleSupplierFormSubmit}
                />
            </Modal>
        </>
    );
};

export default AddPurchaseForm;