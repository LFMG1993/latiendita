import {FC, useState, FormEvent, useMemo} from "react";

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(value);

interface CloseCashSessionFormProps {
    onSubmit: (data: { closingBalance: number, notes: string | undefined }) => void;
    loading: boolean;
    sessionTotals: {
        cashSales: number,
        electronicSales: number,
        totalSales: number,
        totalPurchaseExpenses: number,
        totalOperationalExpenses: number
    };
    openingBalance: number;
}

const CloseCashSessionForm: FC<CloseCashSessionFormProps> = ({onSubmit, loading, sessionTotals, openingBalance}) => {
    const [closingBalance, setClosingBalance] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const finalBalance = parseFloat(closingBalance);

        if (isNaN(finalBalance) || finalBalance < 0) {
            // Podríamos mostrar un error aquí si quisiéramos
            return;
        }
        onSubmit({closingBalance: finalBalance, notes});
    };

    const expectedCashInBox = useMemo(() => {
        // El efectivo esperado es la base + ventas en efectivo - todos los gastos pagados con la caja.
        return openingBalance + sessionTotals.cashSales - sessionTotals.totalPurchaseExpenses - sessionTotals.totalOperationalExpenses;
    }, [openingBalance, sessionTotals.cashSales, sessionTotals.totalPurchaseExpenses, sessionTotals.totalOperationalExpenses]);

    const difference = useMemo(() => {
        const finalBalance = parseFloat(closingBalance);
        if (isNaN(finalBalance)) return 0;
        return finalBalance - expectedCashInBox;
    }, [closingBalance, expectedCashInBox]);

    return (
        <form onSubmit={handleSubmit}>
            <div className="row">
                <div className="col-md-6">
                    <h5>Resumen del Turno</h5>
                    <ul className="list-group">
                        <li className="list-group-item d-flex justify-content-between align-items-center">
                            Base Inicial
                            <span>{formatCurrency(openingBalance)}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between align-items-center">
                            Ventas en Efectivo
                            <span className="text-success">+{formatCurrency(sessionTotals.cashSales)}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between align-items-center">
                            Compras del Turno
                            <span className="text-danger">-{formatCurrency(sessionTotals.totalPurchaseExpenses)}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between align-items-center">
                            Gastos del Turno
                            <span
                                className="text-danger">-{formatCurrency(sessionTotals.totalOperationalExpenses)}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between align-items-center">
                            Ventas Electrónicas
                            <span>{formatCurrency(sessionTotals.electronicSales)}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between align-items-center fw-bold">
                            Efectivo Esperado en Caja
                            <span>{formatCurrency(expectedCashInBox)}</span>
                        </li>
                    </ul>
                </div>
                <div className="col-md-6">
                    <h5>Reconciliación</h5>
                    <div className="mb-3">
                        <label htmlFor="closingBalance" className="form-label">Conteo Final de Efectivo</label>
                        <input
                            type="number"
                            id="closingBalance"
                            className="form-control"
                            value={closingBalance}
                            onChange={e => setClosingBalance(e.target.value)}
                            required
                            autoFocus
                            min="0"
                            step="any"
                        />
                        <small className="form-text text-muted">Ingresa el monto total de efectivo que hay en la caja al
                            final
                            del turno.</small>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="notes" className="form-label">Observaciones (Opcional)</label>
                        <textarea id="notes" className="form-control" value={notes}
                                  onChange={e => setNotes(e.target.value)}
                                  rows={3}></textarea>
                        <small className="form-text text-muted">Añade cualquier nota relevante sobre el turno.</small>
                    </div>
                    <div className="mt-3 p-3 rounded"
                         style={{backgroundColor: difference === 0 ? '#e9ecef' : (difference > 0 ? '#d1e7dd' : '#f8d7da')}}>
                        <div className="d-flex justify-content-between align-items-center fw-bold">
                            <span>Diferencia:</span>
                            <span>{formatCurrency(difference)}</span>
                        </div>
                        <small
                            className="text-muted d-block text-center">{difference === 0 ? 'Caja cuadrada' : (difference > 0 ? 'Sobrante' : 'Faltante')}</small>
                    </div>
                </div>
            </div>
            <div className="d-flex justify-content-end mt-4">
                <button type="submit" className="btn btn-danger" disabled={loading}>
                    {loading ? 'Cerrando...' : 'Confirmar y Cerrar Caja'}
                </button>
            </div>
        </form>
    );
};

export default CloseCashSessionForm;