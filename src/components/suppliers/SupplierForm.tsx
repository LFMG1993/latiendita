import {FC, useState, useEffect, FormEvent} from 'react';
import {Supplier, NewSupplierData} from "../../types";
import {addSupplier, updateSupplier} from "../../services/supplierService.ts";

interface SupplierFormProps {
    shopId: string;
    onFormSubmit: () => void;
    supplierToEdit?: Supplier | null;
}

const SupplierForm: FC<SupplierFormProps> = ({shopId, onFormSubmit, supplierToEdit}) => {
    const [formData, setFormData] = useState<NewSupplierData>({
        name: '',
        contactPerson: '',
        phone: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (supplierToEdit) {
            setFormData({
                name: supplierToEdit.name,
                contactPerson: supplierToEdit.contactPerson || '',
                phone: supplierToEdit.phone || '',
                email: supplierToEdit.email || '',
            });
        } else {
            setFormData({name: '', contactPerson: '', phone: '', email: ''});
        }
    }, [supplierToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (supplierToEdit) {
                await updateSupplier(shopId, supplierToEdit.id, formData);
            } else {
                await addSupplier(shopId, formData);
            }
            onFormSubmit();
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al guardar el proveedor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="mb-3">
                <label htmlFor="name" className="form-label">Nombre del Proveedor</label>
                <input type="text" id="name" name="name" className="form-control" value={formData.name}
                       onChange={handleChange} required autoFocus/>
            </div>
            <div className="mb-3">
                <label htmlFor="contactPerson" className="form-label">Persona de Contacto (Opcional)</label>
                <input type="text" id="contactPerson" name="contactPerson" className="form-control"
                       value={formData.contactPerson} onChange={handleChange}/>
            </div>
            <div className="mb-3">
                <label htmlFor="phone" className="form-label">Teléfono (Opcional)</label>
                <input type="tel" id="phone" name="phone" className="form-control" value={formData.phone}
                       onChange={handleChange}/>
            </div>
            <div className="mb-3">
                <label htmlFor="email" className="form-label">Email (Opcional)</label>
                <input type="email" id="email" name="email" className="form-control" value={formData.email}
                       onChange={handleChange}/>
            </div>
            <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Proveedor'}
                </button>
            </div>
        </form>
    );
};

export default SupplierForm;