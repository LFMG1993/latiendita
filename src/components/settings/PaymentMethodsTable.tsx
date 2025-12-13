import {FC} from "react";
import {PaymentMethod} from "../../types";
import ActionButtons from "../general/ActionButtons.tsx";

interface PaymentMethodsTableProps {
    methods: PaymentMethod[];
    onEdit: (method: PaymentMethod) => void;
    onDelete: (methodId: string) => void;
}

const PaymentMethodsTable: FC<PaymentMethodsTableProps> = ({methods, onEdit, onDelete}) => {
    return (
        <div className="table-responsive">
            <table className="table table-hover">
                <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {methods.map(method => (
                    <tr key={method.id}>
                        <td>{method.name}</td>
                        <td>
                            <span className={`badge ${method.type === 'cash' ? 'bg-success' : 'bg-info'}`}>
                                {method.type === 'cash' ? 'Efectivo' : 'Electrónico'}
                            </span>
                        </td>
                        <td><span className={`badge ${method.enabled ? 'bg-primary' : 'bg-secondary'}`}>{method.enabled ? 'Activo' : 'Inactivo'}</span></td>
                        <td><ActionButtons onEdit={() => onEdit(method)} onDelete={() => onDelete(method.id)}/></td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default PaymentMethodsTable;