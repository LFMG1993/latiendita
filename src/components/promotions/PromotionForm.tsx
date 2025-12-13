import {FC, useState, useEffect, useMemo, FormEvent} from 'react';
import {Product, NewPromotionData, PromotionItem, Promotion, UpdatePromotionData} from "../../types";
import Select from 'react-select';
import {addPromotion, updatePromotion} from "../../services/promotionServices.ts";
import {Trash} from "react-bootstrap-icons";

interface PromotionFormProps {
    products: Product[];
    onSubmit: () => void;
    shopId: string;
    promotionToEdit?: Promotion | null;
}

const daysOfWeek = [
    {value: 1, label: 'Lunes'}, {value: 2, label: 'Martes'}, {value: 3, label: 'Miércoles'},
    {value: 4, label: 'Jueves'}, {value: 5, label: 'Viernes'}, {value: 6, label: 'Sábado'}, {value: 0, label: 'Domingo'}
];

const PromotionForm: FC<PromotionFormProps> = ({shopId, products, onSubmit, promotionToEdit}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState(0);
    const [selectedItems, setSelectedItems] = useState<PromotionItem[]>([]);
    const [activeDays, setActiveDays] = useState<number[]>([]);
    const [isEnabled, setIsEnabled] = useState(true);
    const [loading, setLoading] = useState(false);

    const productOptions = useMemo(() => products.map(p => ({value: p.id, label: p.name, cost: p.cost})), [products]);

    useEffect(() => {
        if (promotionToEdit) {
            setName(promotionToEdit.name);
            setDescription(promotionToEdit.description || '');
            setPrice(promotionToEdit.price);
            setSelectedItems(promotionToEdit.items);
            setActiveDays(promotionToEdit.activeDays);
            setIsEnabled(promotionToEdit.isEnabled);
        } else {
            // Reset form
            setName('');
            setDescription('');
            setPrice(0);
            setSelectedItems([]);
            setActiveDays([]);
            setIsEnabled(true);
        }
    }, [promotionToEdit]);

    // Calculo de Rentabilidad
    const {totalCost, estimatedProfit} = useMemo(() => {
        const cost = selectedItems.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (product?.cost || 0) * item.quantity;
        }, 0);

        return {
            totalCost: cost,
            estimatedProfit: price - cost
        };
    }, [selectedItems, price, products]);

    const updateItemQuantity = (productId: string, change: number) => {
        setSelectedItems(prevItems => {
            const newItems = prevItems.map(item =>
                item.productId === productId ? {...item, quantity: Math.max(1, item.quantity + change)} : item
            );
            return newItems;
        });
    };

    const handleRemoveItem = (productId: string) => {
        setSelectedItems(prev => prev.filter(item => item.productId !== productId));
    };

    const handleAddItem = (selectedOption: any) => {
        const existingItem = selectedItems.find(item => item.productId === selectedOption.value);
        if (existingItem) {
            // Incrementar cantidad si ya existe
            setSelectedItems(selectedItems.map(item =>
                item.productId === selectedOption.value ? {...item, quantity: item.quantity + 1} : item
            ));
        } else {
            // Añadir nuevo item
            setSelectedItems([...selectedItems, {
                productId: selectedOption.value,
                productName: selectedOption.label,
                quantity: 1
            }]);
        }
    };

    const handleDayToggle = (dayValue: number) => {
        setActiveDays(prev =>
            prev.includes(dayValue) ? prev.filter(d => d !== dayValue) : [...prev, dayValue]
        );
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const promotionData: NewPromotionData | UpdatePromotionData = {
            name, description, price, items: selectedItems, activeDays, isEnabled,
            type: 'bundle', cost: totalCost, profit: estimatedProfit
        };
        const saveOperation = promotionToEdit
            ? updatePromotion(shopId, promotionToEdit.id, promotionData)
            : addPromotion(shopId, promotionData as NewPromotionData);

        saveOperation.then(() => {
            onSubmit();
        }).catch(console.error).finally(() => setLoading(false));
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="row">
                <div className="col-md-8">
                    <label htmlFor="name" className="form-label">Nombre de la Promoción</label>
                    <input type="text" id="name" className="form-control" value={name}
                           onChange={e => setName(e.target.value)} required/>
                </div>
                <div className="col-md-4">
                    <label htmlFor="price" className="form-label">Precio de Venta</label>
                    <input type="number" id="price" className="form-control" value={price}
                           onChange={e => setPrice(parseFloat(e.target.value) || 0)} required/>
                </div>
            </div>
            <div className="mb-3 mt-2">
                <label htmlFor="description" className="form-label">Descripción (Opcional)</label>
                <input type="text" id="description" className="form-control" value={description}
                       onChange={e => setDescription(e.target.value)}/>
            </div>

            <div className="mb-3">
                <label className="form-label">Productos en la Promoción</label>
                <Select options={productOptions} onChange={handleAddItem} placeholder="Busca y añade productos..."/>
                <ul className="list-group mt-3">
                    {selectedItems.map(item => (
                        <li key={item.productId}
                            className="list-group-item d-flex justify-content-between align-items-center">
                            <span>{item.productName}</span>
                            <div className="d-flex align-items-center">
                                <button type="button" className="btn btn-sm btn-outline-secondary"
                                        onClick={() => updateItemQuantity(item.productId, -1)}>-
                                </button>
                                <span className="mx-2">{item.quantity}</span>
                                <button type="button" className="btn btn-sm btn-outline-secondary"
                                        onClick={() => updateItemQuantity(item.productId, 1)}>+
                                </button>
                                <button type="button" className="btn btn-sm btn-danger ms-3"
                                        onClick={() => handleRemoveItem(item.productId)}><Trash/></button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mb-3">
                <label className="form-label">Días Activos</label>
                <div>
                    {daysOfWeek.map(day => (
                        <button type="button" key={day.value}
                                className={`btn btn-sm me-1 ${activeDays.includes(day.value) ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => handleDayToggle(day.value)}>
                            {day.label}
                        </button>
                    ))}
                </div>
            </div>

            <hr/>

            {/* Sección de Rentabilidad */}
            <div className="p-3 bg-light rounded">
                <h5 className="mb-3">Análisis de Rentabilidad</h5>
                <div className="d-flex justify-content-between">
                    <span>Costo Total Estimado:</span>
                    <strong>{new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP'
                    }).format(totalCost)}</strong>
                </div>
                <div
                    className={`d-flex justify-content-between fw-bold mt-2 ${estimatedProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                    <span>Ganancia Estimada:</span>
                    <strong>{new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP'
                    }).format(estimatedProfit)}</strong>
                </div>
            </div>

            <div className="form-check form-switch my-3">
                <input className="form-check-input" type="checkbox" role="switch" id="isEnabled" checked={isEnabled}
                       onChange={e => setIsEnabled(e.target.checked)}/>
                <label className="form-check-label" htmlFor="isEnabled">Promoción Habilitada</label>
            </div>

            <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Guardando...' : (promotionToEdit ? 'Actualizar Promoción' : 'Crear Promoción')}
                </button>
            </div>
        </form>
    );
};

export default PromotionForm;