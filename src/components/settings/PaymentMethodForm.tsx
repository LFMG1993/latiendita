import {FC, useState, useEffect, FormEvent} from 'react';
import {PaymentMethod, NewPaymentMethodData} from "../../types";
import {addPaymentMethod, updatePaymentMethod} from "../../services/paymentMethodServices.ts";

interface PaymentMethodFormProps {
    shopId: string;
    onFormSubmit: () => void;
    methodToEdit?: PaymentMethod | null;
}

const PaymentMethodForm: FC<PaymentMethodFormProps> = ({shopId, onFormSubmit, methodToEdit}) => {
    const [formData, setFormData] = useState<NewPaymentMethodData>({
        name: '',
        type: 'cash',
        enabled: true,
        accountDetails: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (methodToEdit) {
            setFormData({
                name: methodToEdit.name,
                type: methodToEdit.type,
                enabled: methodToEdit.enabled,
                accountDetails: methodToEdit.accountDetails || ''
            });
        } else {
            setFormData({name: '', type: 'cash', enabled: true, accountDetails: ''});
        }
    }, [methodToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value, type, checked} = e.target as HTMLInputElement;
        setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value}));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const dataToSave = { ...formData };
            if (dataToSave.type !== 'electronic') {
                delete dataToSave.accountDetails; // Solo guardar detalles de cuenta para electrónicos
            }

            if (methodToEdit) {
                await updatePaymentMethod(shopId, methodToEdit.id, dataToSave);
            } else {
                await addPaymentMethod(shopId, dataToSave);
            }
            onFormSubmit();
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al guardar el método de pago.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="mb-3">
                <label htmlFor="name" className="form-label">Nombre del Método de Pago</label>
                <input type="text" id="name" name="name" className="form-control" value={formData.name}
                       onChange={handleChange} required autoFocus/>
            </div>
            <div className="mb-3">
                <label htmlFor="type" className="form-label">Tipo</label>
                <select id="type" name="type" className="form-select" value={formData.type} onChange={handleChange}>
                    <option value="cash">Efectivo (Afecta la caja)</option>
                    <option value="electronic">Electrónico (No afecta la caja)</option>
                    <option value="credit">Crédito / Fiado (Genera deuda al cliente)</option>
                </select>
            </div>
            {formData.type === 'electronic' && (
                <div className="mb-3">
                    <label htmlFor="accountDetails" className="form-label">Detalles de la cuenta (Opcional)</label>
                    <input type="text" id="accountDetails" name="accountDetails" className="form-control" 
                           value={formData.accountDetails || ''} onChange={handleChange} 
                           placeholder="Ej: Número Nequi: 3123456789"/>
                    <small className="form-text text-muted">El cliente verá este dato al momento de pagar.</small>
                </div>
            )}
            <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="enabled" name="enabled"
                       checked={formData.enabled} onChange={handleChange}/>
                <label className="form-check-label" htmlFor="enabled">
                    Habilitado en el Punto de Venta
                </label>
            </div>
            <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Método de Pago'}
                </button>
            </div>
        </form>
    );
};

export default PaymentMethodForm;