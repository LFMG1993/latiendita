import {FC} from "react";
import {Purchase} from "../../../types";

interface SessionPurchasesTableProps {
    purchases: Purchase[];
    // Podríamos añadir un onViewDetails si fuera necesario en el futuro
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(value);

const SessionPurchasesTable: FC<SessionPurchasesTableProps> = ({purchases}) => {
    return (
        <div className="card">
            <div className="card-header">
                <h5 className="mb-0">Compras del Turno</h5>
            </div>
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Proveedor</th>
                            <th>Total Compra</th>
                        </tr>
                        </thead>
                        <tbody>
                        {purchases.map(purchase => (
                            <tr key={purchase.id}>
                                <td>{purchasnew Date(e.createdAt).toLocaleTimeString()}</td>
                                <td>{purchase.supplierName}</td>
                                <td>{formatCurrency(purchase.total)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SessionPurchasesTable;