import {FC} from "react";
import {Expense} from "../../types";

interface SessionExpensesTableProps {
    expenses: Expense[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(value);

const SessionExpensesTable: FC<SessionExpensesTableProps> = ({expenses}) => {
    return (
        <div className="card">
            <div className="card-header">
                <h5 className="mb-0">Gastos del Turno</h5>
            </div>
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Descripción</th>
                            <th>Monto</th>
                        </tr>
                        </thead>
                        <tbody>
                        {expenses.map(expense => (
                            <tr key={expense.id}>
                                <td>{expense.createdAt.toDate().toLocaleTimeString()}</td>
                                <td>{expense.description}</td>
                                <td>{formatCurrency(expense.amount)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SessionExpensesTable;