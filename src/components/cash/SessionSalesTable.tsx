import {FC} from "react";
import {Sale} from "../../types";

interface SessionSalesTableProps {
    sales: Sale[];
    onViewDetails: (sale: Sale) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(value);

const SessionSalesTable: FC<SessionSalesTableProps> = ({sales, onViewDetails}) => {
    return (
        <div className="card">
            <div className="card-header">
                <h5 className="mb-0">Ventas del Turno Actual</h5>
            </div>
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Total Venta</th>
                            <th>Ítems</th>
                            <th>Acción</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sales.map(sale => (
                            <tr key={sale.id}>
                                <td>{sale.createdAt.toDate().toLocaleTimeString()}</td>
                                <td>{formatCurrency(sale.total)}</td>
                                <td>{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                                <td>
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => onViewDetails(sale)}>
                                        Ver Detalles
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SessionSalesTable;