import {FC, useState, useEffect, useMemo} from "react";
import Breadcrumbs from "../../components/general/Breadcrumbs.tsx";
import {useAuthStore} from "../../store/authStore.ts";
import FullScreenLoader from "../../components/general/FullScreenLoader.tsx";
import {CashSession, Sale, Purchase, Expense, NewExpenseData} from "../../types";
import {getOpenCashSession, startCashSession, closeCashSession} from "../../services/cashSessionServices.ts";
import Modal from "../../components/general/Modal.tsx";
import OpenCashSessionForm from "../../components/cash/OpenCashSessionForm.tsx";
import CloseCashSessionForm from "../../components/cash/CloseCashSessionForm.tsx";
import {getSalesByDateRange} from "../../services/saleServices.ts";
import {getPurchasesForSession} from "../../services/purchaseServices.ts";
import {addExpense, getExpensesForSession} from "../../services/expenseServices.ts";
import SessionSalesTable from "../../components/cash/SessionSalesTable.tsx";
import SaleDetailModal from "../../components/cash/SaleDetailModal.tsx";
import SessionPurchasesTable from "../../components/cash/SessionPurchasesTable.tsx";
import AddPurchaseForm from "../../components/purchases/AddPurchaseForm.tsx";
import SessionExpensesTable from "../../components/cash/SessionExpensesTable.tsx";
import ExpenseForm from "../../components/expenses/ExpenseForm.tsx";

const CashSessionPage: FC = () => {
    const {activeIceCreamShop: shop, user, loading: authLoading} = useAuthStore();
    const [pageLoading, setPageLoading] = useState(true);
    const [openSession, setOpenSession] = useState<CashSession | null>(null);
    const [sessionSales, setSessionSales] = useState<Sale[]>([]);
    const [sessionPurchases, setSessionPurchases] = useState<Purchase[]>([]);
    const [sessionExpenses, setSessionExpenses] = useState<Expense[]>([]);
    const [selectedSaleForDetail, setSelectedSaleForDetail] = useState<Sale | null>(null);
    const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
    const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadOpenSession = async () => {
        if (!shop?.id) return;
        setPageLoading(true);
        try {
            const session = await getOpenCashSession(shop.id);
            setOpenSession(session);
            if (session) {
                // Cargar ventas y compras del turno en paralelo
                const [sales, purchases, expenses] = await Promise.all([
                    getSalesByDateRange(shop.id, session.startTime.toDate(), new Date()),
                    getPurchasesForSession(shop.id, session.startTime, session.employeeId),
                    getExpensesForSession(shop.id, session.id) // <-- Cargamos los gastos de la sesión
                ]);
                setSessionSales(sales);
                setSessionPurchases(purchases);
                setSessionExpenses(expenses);
            } else {
                setSessionSales([]);
                setSessionPurchases([]);
                setSessionExpenses([]);
            }
        } catch (error) {
            console.error("Error al obtener la sesión de caja:", error);
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        loadOpenSession();
    }, [shop?.id]);

    const handleOpenSession = async (openingBalance: number) => {
        if (!shop?.id || !user) return;
        setIsSubmitting(true);
        try {
            await startCashSession(shop.id, {
                employeeId: user.uid,
                employeeName: user.firstName || user.email,
                openingBalance
            });
            setIsOpeningModalOpen(false);
            await loadOpenSession();
        } catch (error) {
            console.error("Error al abrir la caja:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseSession = async (closingData: { closingBalance: number, notes: string | undefined }) => {
        if (!shop?.id || !openSession) return;
        setIsSubmitting(true);
        try {
            await closeCashSession(shop.id, openSession, closingData);
            setIsClosingModalOpen(false);
            await loadOpenSession();
        } catch (error) {
            console.error("Error al cerrar la caja:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePurchaseFormSubmit = () => {
        setIsPurchaseModalOpen(false);
        loadOpenSession(); // Recargar los datos de la sesión para reflejar la nueva compra
    };

    const handleExpenseFormSubmit = async (data: NewExpenseData) => {
        if (!shop?.id || !user?.uid || !shop.owner || !openSession) return;
        setIsSubmitting(true);

        const expenseData = {
            ...data,
            recordedByEmployeeId: user.uid,
            owner: shop.owner,
            sessionId: openSession.id, // <-- Vinculamos el gasto a la sesión
        };

        try {
            await addExpense(shop.id, expenseData);
            setIsExpenseModalOpen(false);
            loadOpenSession(); // Recargamos para ver el nuevo gasto
        } catch (error) {
            console.error("Error al registrar el gasto:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Totales calculados para pasar al formulario de cierre
    const sessionTotals = useMemo(() => {
        let cashSales = 0;
        let electronicSales = 0;

        sessionSales.forEach(sale => {
            sale.payments.forEach(payment => {
                if (payment.type === 'cash') {
                    cashSales += payment.amount;
                } else {
                    electronicSales += payment.amount;
                }
            });
        });

        const totalPurchaseExpenses = sessionPurchases.reduce((sum, purchase) => sum + purchase.total, 0);
        const totalOperationalExpenses = sessionExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        return {
            cashSales,
            electronicSales,
            totalSales: cashSales + electronicSales,
            totalPurchaseExpenses,
            totalOperationalExpenses,
        };
    }, [sessionSales, sessionPurchases]);

    if (authLoading || pageLoading) return <FullScreenLoader/>;

    return (
        <>
            <main className="px-md-4">
                <Breadcrumbs/>
                <div
                    className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 className="h2">Gestión de Caja</h1>
                </div>

                <div className="card mb-4">
                    <div className="card-body text-center">
                        {openSession ? (
                            <div>
                                <h5 className="card-title">Caja Abierta</h5>
                                <p>Sesión iniciada por <strong>{openSession.employeeName}</strong>.</p>
                                <p>Base inicial: <strong>{new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP'
                                }).format(openSession.openingBalance)}</strong></p>
                                <button className="btn btn-danger" onClick={() => setIsClosingModalOpen(true)}>Cerrar
                                    Caja
                                </button>
                            </div>
                        ) : (
                            <div>
                                <h5 className="card-title">Caja Cerrada</h5>
                                <p>No hay ninguna sesión de caja activa en este momento.</p>
                                <button className="btn btn-success" onClick={() => setIsOpeningModalOpen(true)}>Abrir
                                    Caja
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {openSession && (
                    <div className="row g-4">
                        <div className="col-lg-8">
                            <SessionSalesTable
                                sales={sessionSales}
                                onViewDetails={(sale) => setSelectedSaleForDetail(sale)}
                            />
                        </div>
                        <div className="col-lg-4">
                            <div className="d-grid gap-3">
                                <SessionPurchasesTable purchases={sessionPurchases}/>
                                <button className="btn btn-outline-secondary"
                                        onClick={() => setIsPurchaseModalOpen(true)}>+ Registrar Compra de Inventario
                                </button>

                                <SessionExpensesTable expenses={sessionExpenses}/>
                                <button className="btn btn-outline-secondary"
                                        onClick={() => setIsExpenseModalOpen(true)}>+ Registrar Gasto de Turno
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Modal title="Abrir Sesión de Caja" show={isOpeningModalOpen} onClose={() => setIsOpeningModalOpen(false)}>
                <OpenCashSessionForm onSubmit={handleOpenSession} loading={isSubmitting}/>
            </Modal>

            <Modal title="Cerrar Sesión de Caja" show={isClosingModalOpen} onClose={() => setIsClosingModalOpen(false)}
                   size="lg">
                <CloseCashSessionForm
                    onSubmit={handleCloseSession}
                    loading={isSubmitting}
                    sessionTotals={sessionTotals}
                    openingBalance={openSession?.openingBalance || 0}
                />
            </Modal>
            <Modal title="Registrar Nueva Compra" show={isPurchaseModalOpen}
                   onClose={() => setIsPurchaseModalOpen(false)} size="lg">
                <AddPurchaseForm onFormSubmit={handlePurchaseFormSubmit} heladeriaId={shop?.id!}/>
            </Modal>
            <Modal title="Registrar Gasto de Turno" show={isExpenseModalOpen}
                   onClose={() => setIsExpenseModalOpen(false)}>
                <ExpenseForm onSave={handleExpenseFormSubmit} isSubmitting={isSubmitting}/>
            </Modal>
            <SaleDetailModal sale={selectedSaleForDetail} onClose={() => setSelectedSaleForDetail(null)}/>
        </>
    );
};

export default CashSessionPage;