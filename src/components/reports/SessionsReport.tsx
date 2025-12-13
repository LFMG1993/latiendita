import {FC, useEffect, useMemo, useState} from 'react';
import {CashSession, Purchase, Sale, Expense} from '../../types';
import SessionReportTable from "./SessionReportTable.tsx";
import {useAuthStore} from "../../store/authStore.ts";
import {getSalesBySessionId} from "../../services/saleServices.ts";
import {getPurchasesForSession} from "../../services/dashboardService.ts";
import {getExpensesForSession} from "../../services/expenseServices.ts";

interface SessionsReportProps {
    sessions: CashSession[];
    loading: boolean;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(value);

const SessionsReport: FC<SessionsReportProps> = ({sessions, loading}) => {
    const {activeIceCreamShop} = useAuthStore();
    const [selectedSession, setSelectedSession] = useState<CashSession | null>(null);
    const [sessionDetails, setSessionDetails] = useState<{
        sales: Sale[],
        purchases: Purchase[],
        expenses: Expense[]
    } | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!selectedSession || !activeIceCreamShop?.id) return;

            setDetailsLoading(true);
            try {
                const [sales, purchases, expenses] = await Promise.all([
                    getSalesBySessionId(activeIceCreamShop.id, selectedSession.id),
                    getPurchasesForSession(activeIceCreamShop.id, selectedSession.employeeId, selectedSession.startTime.toDate(), selectedSession.endTime!.toDate()),
                    getExpensesForSession(activeIceCreamShop.id, selectedSession.id)
                ]);
                setSessionDetails({sales, purchases, expenses});
            } catch (error) {
                console.error("Error al cargar detalles de la sesión:", error);
                setSessionDetails(null);
            } finally {
                setDetailsLoading(false);
            }
        };

        fetchDetails();
    }, [selectedSession, activeIceCreamShop]);

    const bestSellingProduct = useMemo(() => {
        if (!sessionDetails?.sales) return null;
        const productMap = new Map<string, { name: string, quantity: number }>();
        sessionDetails.sales.forEach(sale => {
            sale.items.forEach(item => {
                const existing = productMap.get(item.productId);
                if (existing) {
                    existing.quantity += item.quantity;
                } else {
                    productMap.set(item.productId, {name: item.productName, quantity: item.quantity});
                }
            });
        });
        return Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity)[0];
    }, [sessionDetails]);

    const totalOperationalExpenses = useMemo(() => {
        if (!sessionDetails?.expenses) return 0;
        return sessionDetails.expenses.reduce((sum, e) => sum + e.amount, 0);
    }, [sessionDetails]);

    const bestHour = useMemo(() => {
        if (!sessionDetails?.sales) return null;
        const hourMap = new Array(24).fill(0);
        sessionDetails.sales.forEach(sale => {
            const hour = sale.createdAt.toDate().getHours();
            hourMap[hour] += sale.total;
        });
        const maxRevenue = Math.max(...hourMap);
        const bestHourIndex = hourMap.indexOf(maxRevenue);
        return bestHourIndex >= 0 ? `${bestHourIndex}:00 - ${bestHourIndex + 1}:00` : 'N/A';
    }, [sessionDetails]);

    const salesByPaymentMethod = useMemo(() => {
        if (!sessionDetails?.sales) return [];
        const paymentMap = new Map<string, number>();

        sessionDetails.sales.forEach(sale => {
            sale.payments.forEach(payment => {
                const currentAmount = paymentMap.get(payment.methodName) || 0;
                paymentMap.set(payment.methodName, currentAmount + payment.amount);
            });
        });

        return Array.from(paymentMap.entries()).map(([method, total]) => ({method, total}));
    }, [sessionDetails]);

    const totalPurchases = useMemo(() => {
        if (!sessionDetails?.purchases) return 0;
        return sessionDetails.purchases.reduce((sum, p) => sum + p.total, 0);
    }, [sessionDetails]);

    const estimatedProfit = useMemo(() => {
        if (!selectedSession) return 0;
        // Ganancia = Ventas Totales + Diferencia (Sobrante/Faltante) - (Compras + Gastos)
        const totalSales = selectedSession.totalSales || 0;
        const difference = selectedSession.difference || 0;
        return totalSales + difference - totalPurchases - totalOperationalExpenses;
    }, [selectedSession, totalPurchases, totalOperationalExpenses]);

    if (loading) {
        return <div className="text-center p-5">
            <div className="spinner-border" role="status"/>
        </div>;
    }

    if (sessions.length === 0 && !loading) {
        return <div className="alert alert-light text-center">No hay sesiones de caja cerradas en este período.</div>;
    }

    return (
        <>
            <SessionReportTable sessions={sessions} onViewDetails={setSelectedSession}/>

            {selectedSession && (
                <div className="card mt-4">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Análisis de la Sesión de {selectedSession.employeeName}</h5>
                        <button type="button" className="btn-close" onClick={() => setSelectedSession(null)}></button>
                    </div>
                    <div className="card-body">
                        {detailsLoading ? (
                            <div className="text-center p-3">
                                <div className="spinner-border spinner-border-sm"/>
                            </div>
                        ) : (
                            <table className="table table-borderless table-sm">
                                <tbody>
                                <tr>
                                    <td className="fw-bold" style={{width: '40%'}}>Producto Estrella</td>
                                    <td>{bestSellingProduct?.name || 'N/A'} ({bestSellingProduct?.quantity || 0} unidades)</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold">Mejor Hora de Venta</td>
                                    <td>{bestHour}</td>
                                </tr>
                                {salesByPaymentMethod.map(({method, total}) => (
                                    <tr key={method}>
                                        <td className="fw-bold">Ventas {method}</td>
                                        <td>{formatCurrency(total)}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td className="fw-bold border-top pt-2">Compras de Inventario</td>
                                    <td className="text-danger border-top pt-2">
                                        {formatCurrency(totalPurchases)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="fw-bold">Gastos del Turno</td>
                                    <td className="text-danger">
                                        {formatCurrency(totalOperationalExpenses)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="fw-bold">Sobrante / Faltante</td>
                                    <td className={(selectedSession.difference || 0) >= 0 ? 'text-success' : 'text-danger'}>
                                        {formatCurrency(selectedSession.difference || 0)}
                                    </td>
                                </tr>
                                <tr className="table-group-divider">
                                    <td className="fw-bold fs-5">Ganancia Estimada</td>
                                    <td className={`fs-5 fw-bold ${estimatedProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {formatCurrency(estimatedProfit)}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default SessionsReport;