import {FC, useMemo} from 'react';
import {CashSession, Purchase, Sale, Expense} from '../../types';

interface ProfitReportProps {
    sales: Sale[];
    purchases: Purchase[];
    expenses: Expense[];
    sessions: CashSession[];
    loading: boolean;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(value);

const ProfitReport: FC<ProfitReportProps> = ({sales, purchases, expenses, sessions, loading}) => {

    const totalRevenue = useMemo(() => sales.reduce((sum, sale) => sum + sale.total, 0), [sales]);
    const totalPurchases = useMemo(() => purchases.reduce((sum, purchase) => sum + purchase.total, 0), [purchases]);
    const totalOperationalExpenses = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);
    const totalDifference = useMemo(() => sessions.reduce((sum, session) => sum + (session.difference || 0), 0), [sessions]);

    const netProfit = useMemo(() => {
        // Ganancia Neta = Ingresos Totales + (Sobrantes/Faltantes) - Egresos Totales
        const totalExpenses = totalPurchases + totalOperationalExpenses;
        return totalRevenue + totalDifference - totalExpenses;
    }, [totalRevenue, totalPurchases, totalOperationalExpenses, totalDifference]);

    if (loading) {
        return <div className="text-center p-5">
            <div className="spinner-border" role="status"><span className="visually-hidden">Cargando...</span></div>
        </div>;
    }

    if (sales.length === 0 && purchases.length === 0 && sessions.length === 0 && expenses.length === 0 && !loading) {
        return <div className="alert alert-light text-center">Selecciona un rango de fechas y haz clic en "Generar
            Reporte" para ver los datos.</div>;
    }

    return (
        <>
            <div className="row">
                {/* Ingresos */}
                <div className="col-lg-3 mb-3">
                    <div className="card text-center h-100">
                        <div className="card-body">
                            <h6 className="card-title text-muted">Ingresos Totales (Ventas)</h6>
                            <p className="card-text fs-4 fw-bold text-success">{formatCurrency(totalRevenue)}</p>
                        </div>
                    </div>
                </div>

                {/* Egresos */}
                <div className="col-lg-3 mb-3">
                    <div className="card text-center h-100">
                        <div className="card-body">
                            <h6 className="card-title text-muted">Egresos (Compras)</h6>
                            <p className="card-text fs-4 fw-bold text-danger">{formatCurrency(totalPurchases)}</p>
                        </div>
                    </div>
                </div>

                {/* Gastos Operativos */}
                <div className="col-lg-3 mb-3">
                    <div className="card text-center h-100">
                        <div className="card-body">
                            <h6 className="card-title text-muted">Egresos (Gastos Op.)</h6>
                            <p className="card-text fs-4 fw-bold text-danger">{formatCurrency(totalOperationalExpenses)}</p>
                        </div>
                    </div>
                </div>

                {/* Diferencias de Caja */}
                <div className="col-lg-3 mb-3">
                    <div className="card text-center h-100">
                        <div className="card-body">
                            <h6 className="card-title text-muted">Sobrantes / Faltantes</h6>
                            <p className={`card-text fs-4 fw-bold ${totalDifference >= 0 ? 'text-success' : 'text-danger'}`}>
                                {formatCurrency(totalDifference)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ganancia Neta */}
                <div className="col-12 mt-3">
                    <div className="card text-center h-100 bg-primary text-white">
                        <div className="card-body">
                            <h6 className="card-title">Ganancia Neta Estimada</h6>
                            <p className={`card-text fs-4 fw-bold ${netProfit < 0 ? 'text-warning' : ''}`}>{formatCurrency(netProfit)}</p>
                        </div>
                    </div>
                </div>
            </div>

                {/* Aquí podrías añadir más detalles, como gráficos comparativos */}
            <div className="mt-4">
                {/* Por ejemplo, un gráfico de barras comparando ingresos y egresos */}
            </div>
        </>
    );
};

export default ProfitReport;