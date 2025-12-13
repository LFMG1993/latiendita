import {useState, useEffect, FC, FormEvent} from 'react';
import {NewIngredientData, Ingredient, UpdateIngredientData} from "../../types";
import {addIngredient, updateIngredient} from '../../services/ingredientServices';
import {unitCategories, getUnitsForCategory, UnitCategory} from '../../data/unitConfig';
import {Tooltip} from 'bootstrap';

interface AddIngredientFormProps {
    heladeriaId: string;
    onFormSubmit: () => void;
    ingredientToEdit?: Ingredient;
}

const AddIngredientForm: FC<AddIngredientFormProps> = ({heladeriaId, onFormSubmit, ingredientToEdit}) => {
    const initialState: NewIngredientData = {
        name: '',
        category: '',
        purchaseUnit: 'Unidad',
        consumptionUnit: 'Unidad',
        stock: 0,
        consumptionUnitsPerPurchaseUnit: 0,
    };

    const [formData, setFormData] = useState<NewIngredientData>(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPurchaseCategory, setSelectedPurchaseCategory] = useState<UnitCategory>(unitCategories[0]);
    const [selectedConsumptionCategory, setSelectedConsumptionCategory] = useState<UnitCategory>(unitCategories[0]);

    // Función de ayuda para encontrar la categoría de una unidad específica
    const findCategoryForUnit = (unitToFind: string): UnitCategory | undefined => {
        for (const category of unitCategories) {
            if (getUnitsForCategory(category).includes(unitToFind)) {
                return category;
            }
        }
        return undefined;
    };

    useEffect(() => {
        if (ingredientToEdit) {
            setFormData({
                name: ingredientToEdit.name,
                category: ingredientToEdit.category,
                purchaseUnit: ingredientToEdit.purchaseUnit,
                consumptionUnit: ingredientToEdit.consumptionUnit,
                stock: ingredientToEdit.stock || 0,
                consumptionUnitsPerPurchaseUnit: ingredientToEdit.consumptionUnitsPerPurchaseUnit,
            });
            const purchaseCat = findCategoryForUnit(ingredientToEdit.purchaseUnit);
            const consumptionCat = findCategoryForUnit(ingredientToEdit.consumptionUnit);
            setSelectedPurchaseCategory(purchaseCat || unitCategories[0]);
            setSelectedConsumptionCategory(consumptionCat || unitCategories[0]);
        } else {
            setFormData(initialState);
            setSelectedPurchaseCategory(unitCategories[0]);
            setSelectedConsumptionCategory(unitCategories[0]);
        }
    }, [ingredientToEdit]);

    // Efecto para actualizar la unidad de compra cuando la categoría de compra cambia
    useEffect(() => {
        if (!ingredientToEdit) { // Solo aplica para nuevos ingredientes para no sobreescribir la edición
            const newUnits = getUnitsForCategory(selectedPurchaseCategory);
            setFormData(prev => ({
                ...prev,
                purchaseUnit: newUnits[0] || '' // Selecciona la primera unidad de la nueva categoría
            }));
        }
    }, [selectedPurchaseCategory, ingredientToEdit]);

    // Efecto para actualizar la unidad de consumo cuando la categoría de consumo cambia
    useEffect(() => {
        if (!ingredientToEdit) {
            const newUnits = getUnitsForCategory(selectedConsumptionCategory);
            setFormData(prev => ({
                ...prev,
                consumptionUnit: newUnits[0] || ''
            }));
        }
    }, [selectedConsumptionCategory, ingredientToEdit]);

    // Efecto para inicializar los tooltips de Bootstrap cuando el componente se monta
    useEffect(() => {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new Tooltip(tooltipTriggerEl);
        });
        // Función de limpieza para destruir los tooltips cuando el componente se desmonte
        return () => {
            tooltipList.forEach(tooltip => tooltip.dispose());
        };
    }, [ingredientToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        // Aseguramos que los campos numéricos siempre se traten como números
        const numericValue = ['consumptionUnitsPerPurchaseUnit'].includes(name) ? parseFloat(value) || 0 : value;
        setFormData(prev => ({
            ...prev,
            [name]: numericValue,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (ingredientToEdit?.id) {
                // Si estamos editando, usamos el servicio de actualización
                const dataToUpdate: UpdateIngredientData = {...formData};
                await updateIngredient(heladeriaId, ingredientToEdit.id, dataToUpdate);
            } else {
                // Si no, usamos el servicio para añadir uno nuevo
                await addIngredient(heladeriaId, formData);
            }
            onFormSubmit(); // Notificamos al padre que la operación fue exitosa
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <div className="mb-3">
                <label htmlFor="name" className="form-label">Nombre del Ingrediente</label>
                <input type="text" className="form-control" id="name" name="name" value={formData.name || ''}
                       onChange={handleChange} required/>
            </div>
            <div className="mb-3">
                <label htmlFor="category" className="form-label">Categoría</label>
                <input type="text" className="form-control" id="category" name="category"
                       value={formData.category || ''}
                       onChange={handleChange} placeholder="Ej: Helados, Toppings, Bases" required/>
            </div>
            <div className="row">
                <div className="col-md-4 mb-3">
                    <label htmlFor="purchaseCategory" className="form-label">Categoría de U. Compra</label>
                    <select id="purchaseCategory" className="form-select" value={selectedPurchaseCategory}
                            onChange={e => setSelectedPurchaseCategory(e.target.value as UnitCategory)}>
                        {unitCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className="col-md-4 mb-3">
                    <label htmlFor="purchaseUnit" className="form-label">U. de Compra</label>
                    <select id="purchaseUnit" name="purchaseUnit" className="form-select" value={formData.purchaseUnit}
                            onChange={handleChange} required>
                        <option value="" disabled>Selecciona...</option>
                        {getUnitsForCategory(selectedPurchaseCategory).map(unit => <option key={unit}
                                                                                           value={unit}>{unit}</option>)}
                    </select>
                </div>
            </div>
            <div className="row">
                <div className="col-md-4 mb-3">
                    <label htmlFor="consumptionCategory" className="form-label">Categoría de U. Consumo</label>
                    <select id="consumptionCategory" className="form-select" value={selectedConsumptionCategory}
                            onChange={e => setSelectedConsumptionCategory(e.target.value as UnitCategory)}>
                        {unitCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className="col-md-4 mb-3">
                    <label htmlFor="consumptionUnit" className="form-label">U. de Consumo</label>
                    <select id="consumptionUnit" name="consumptionUnit" className="form-select"
                            value={formData.consumptionUnit} onChange={handleChange} required>
                        <option value="" disabled>Selecciona...</option>
                        {getUnitsForCategory(selectedConsumptionCategory).map(unit => <option key={unit}
                                                                                              value={unit}>{unit}</option>)}
                    </select>
                </div>
                <div className="col-md-4 mb-3">
                    <label htmlFor="consumptionUnitsPerPurchaseUnit" className="form-label d-flex align-items-center">
                        Ratio de Conversión
                        <span className="ms-2" data-bs-toggle="tooltip" data-bs-placement="top"
                              title="¿Cuántas Unidades de Consumo caben en 1 Unidad de Compra? (Ej: 1 Litro = 1000 mililitros)">
                             <i className="bi bi-info-circle-fill text-primary"></i>
                         </span>
                    </label>
                    <input type="number" className="form-control" id="consumptionUnitsPerPurchaseUnit"
                           name="consumptionUnitsPerPurchaseUnit"
                           value={formData.consumptionUnitsPerPurchaseUnit || 0} onChange={handleChange} required/>
                </div>
            </div>
            <div className="d-flex justify-content-end mt-3">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            {' '}Guardando...
                        </>
                    ) : (ingredientToEdit ? 'Actualizar Ingrediente' : 'Añadir Ingrediente')}
                </button>
            </div>
        </form>
    );
};

export default AddIngredientForm;