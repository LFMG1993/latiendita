import {FC, useState, useEffect, useMemo} from "react";
import Breadcrumbs from "../../components/shared/Breadcrumbs.tsx";
import {useAuthStore} from "../../store/authStore.ts";
import FullScreenLoader from "../../components/shared/FullScreenLoader.tsx";
import {CashSession, Sale, Purchase, Expense, NewExpenseData} from "../../types";
import {getOpenCashSession, startCashSession, closeCashSession} from "../../services/shop/cashSessionServices.ts";
import Modal from "../../components/shared/Modal.tsx";
import OpenCashSessionForm from "../../components/shop/cash/OpenCashSessionForm.tsx";
import CloseCashSessionForm from "../../components/shop/cash/CloseCashSessionForm.tsx";
import {getSalesByDateRange} from "../../services/shop/saleServices.ts";
import {getPurchasesForSession} from "../../services/shop/purchaseServices.ts";
import {addExpense, getExpensesForSession} from "../../services/shop/expenseServices.ts";
import SessionSalesTable from "../../components/shop/cash/SessionSalesTable.tsx";
import SaleDetailModal from "../../components/shop/cash/SaleDetailModal.tsx";
import SessionPurchasesTable from "../../components/shop/cash/SessionPurchasesTable.tsx";
import AddPurchaseForm from "../../components/shop/purchases/AddPurchaseForm.tsx";
import SessionExpensesTable from "../../components/shop/cash/SessionExpensesTable.tsx";
import ExpenseForm from "../../components/shop/expenses/ExpenseForm.tsx";

const CashSessionPage: FC = () => {
    const {activeShop: shop, user, loading: authLoading} = useAuthStore();
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
    const [showElectronicModal, setShowElectronicModal] = useState(false);
    const [showGastosModal, setShowGastosModal] = useState(false);

    const loadOpenSession = async () => {
        if (!shop?.id) return;
        setPageLoading(true);
        try {
            const session = await getOpenCashSession(shop.id);
            setOpenSession(session);
            if (session) {
                // Cargar ventas y compras del turno en paralelo
                const [sales, purchases, expenses] = await Promise.all([
                    getSalesByDateRange(shop.id, new Date(session.startTime), new Date()),
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
                employeeId: user.uid!,
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

        console.log("Calculando totales de sesión. Ventas raw:", sessionSales);

        sessionSales.forEach(sale => {
            sale.payments.forEach(payment => {
                const amount = Number(payment.amount);
                console.log(`Pago: ${payment.amount} (Type: ${typeof payment.amount}) -> Parsed: ${amount}`);
                if (payment.type === 'cash') {
                    cashSales += amount;
                } else {
                    electronicSales += amount;
                }
            });
        });

        const totalPurchaseExpenses = sessionPurchases.reduce((sum, purchase) => sum + Number(purchase.total), 0);
        const totalOperationalExpenses = sessionExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

        console.log("Totales calculados:", {
            cashSales,
            electronicSales,
            totalPurchaseExpenses,
            totalOperationalExpenses
        });

        return {
            cashSales,
            electronicSales,
            totalSales: cashSales + electronicSales,
            totalPurchaseExpenses,
            totalOperationalExpenses,
        };
    }, [sessionSales, sessionPurchases]);

    if (authLoading || pageLoading) return <FullScreenLoader/>;

    const fmt = (v: number) => new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP', maximumFractionDigits: 0}).format(v);

    return (
        <>
            <main className="px-md-4">
                <Breadcrumbs/>
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-4 border-bottom">
                    <h1 className="h2 fw-bold">Gestión de Caja</h1>
                </div>

                {/* ── Card de estado de caja ── */}
                {openSession ? (
                    <div className="card border-0 shadow-sm mb-4 overflow-hidden">
                        <div className="card-body p-0">
                            <div className="d-flex flex-column flex-md-row align-items-stretch">
                                {/* Franja de estado */}
                                <div
                                    className="d-flex flex-column align-items-center justify-content-center px-4 py-4 text-white"
                                    style={{background: 'linear-gradient(135deg,#16a34a,#15803d)', minWidth: 200}}
                                >
                                    <span style={{fontSize: 40}}>🟢</span>
                                    <span className="fw-bold fs-5 mt-2">Caja Abierta</span>
                                    <span className="opacity-75 small mt-1">{openSession.employeeName}</span>
                                </div>

                                {/* Estadísticas rápidas */}
                                <div className="flex-grow-1 p-4">
                                    <div className="row g-3 mb-3">
                                        <div className="col-6 col-md-3">
                                            <div className="bg-body-tertiary rounded-3 p-3 text-center h-100">
                                                <div className="text-muted small mb-1">Base Inicial</div>
                                                <div className="fw-bold">{fmt(openSession.openingBalance)}</div>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <div className="rounded-3 p-3 text-center h-100" style={{background:'rgba(22,163,74,0.1)'}}>
                                                <div className="text-muted small mb-1">Ventas Efectivo</div>
                                                <div className="fw-bold text-success">{fmt(sessionTotals.cashSales)}</div>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <button
                                                className="rounded-3 p-3 text-center h-100 w-100 border-0 d-block"
                                                style={{background:'rgba(13,110,253,0.08)', cursor:'pointer', transition:'filter 0.15s'}}
                                                onClick={() => setShowElectronicModal(true)}
                                                title="Ver detalle de ventas electrónicas"
                                                onMouseEnter={e => (e.currentTarget.style.filter='brightness(0.93)')}
                                                onMouseLeave={e => (e.currentTarget.style.filter='none')}
                                            >
                                                <div className="text-muted small mb-1">Ventas Electrónicas</div>
                                                <div className="fw-bold" style={{color:'#0d6efd'}}>{fmt(sessionTotals.electronicSales)}</div>
                                                <div className="small mt-1" style={{color:'#0d6efd', opacity:0.7}}>Ver detalle →</div>
                                            </button>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <button
                                                className="rounded-3 p-3 text-center h-100 w-100 border-0 d-block"
                                                style={{background:'rgba(220,53,69,0.08)', cursor:'pointer', transition:'filter 0.15s'}}
                                                onClick={() => setShowGastosModal(true)}
                                                title="Ver detalle de gastos y compras"
                                                onMouseEnter={e => (e.currentTarget.style.filter='brightness(0.93)')}
                                                onMouseLeave={e => (e.currentTarget.style.filter='none')}
                                            >
                                                <div className="text-muted small mb-1">Gastos y Compras</div>
                                                <div className="fw-bold text-danger">-{fmt(sessionTotals.totalPurchaseExpenses + sessionTotals.totalOperationalExpenses)}</div>
                                                <div className="small mt-1 text-danger" style={{opacity:0.7}}>Ver detalle →</div>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-end">
                                        <button
                                            className="btn fw-bold px-4 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2"
                                            onClick={() => setIsClosingModalOpen(true)}
                                            style={{background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', border:'none'}}
                                        >
                                            🔐 Cerrar Caja
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card border-0 shadow-sm mb-4 overflow-hidden">
                        <div className="card-body p-0">
                            <div className="d-flex flex-column flex-md-row align-items-stretch">
                                <div
                                    className="d-flex flex-column align-items-center justify-content-center px-4 py-4 text-white"
                                    style={{background: 'linear-gradient(135deg,#6c757d,#495057)', minWidth: 200}}
                                >
                                    <span style={{fontSize: 40}}>⭕</span>
                                    <span className="fw-bold fs-5 mt-2">Caja Cerrada</span>
                                    <span className="opacity-75 small mt-1">Sin sesión activa</span>
                                </div>
                                <div className="flex-grow-1 p-4 d-flex flex-column align-items-center justify-content-center gap-2">
                                    <p className="text-body-secondary mb-3">No hay ninguna sesión de caja activa en este momento.</p>
                                    <button
                                        className="btn fw-bold px-5 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2"
                                        onClick={() => setIsOpeningModalOpen(true)}
                                        style={{background:'linear-gradient(135deg,#16a34a,#15803d)', color:'#fff', border:'none'}}
                                    >
                                        💰 Abrir Caja
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                                <button
                                    className="btn btn-outline-secondary rounded-pill fw-semibold"
                                    onClick={() => setIsPurchaseModalOpen(true)}
                                >
                                    🛒 Registrar Compra de Inventario
                                </button>
                                <SessionExpensesTable expenses={sessionExpenses}/>
                                <button
                                    className="btn btn-outline-secondary rounded-pill fw-semibold"
                                    onClick={() => setIsExpenseModalOpen(true)}
                                >
                                    📋 Registrar Gasto de Turno
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Modal title="Abrir Sesión de Caja" show={isOpeningModalOpen} onClose={() => setIsOpeningModalOpen(false)} headerIcon="💰" headerColor="#16a34a">
                <OpenCashSessionForm onSubmit={handleOpenSession} loading={isSubmitting}/>
            </Modal>

            <Modal title="Cerrar Sesión de Caja" show={isClosingModalOpen} onClose={() => setIsClosingModalOpen(false)} size="lg" headerIcon="🔐" headerColor="#ef4444">
                <CloseCashSessionForm
                    onSubmit={handleCloseSession}
                    loading={isSubmitting}
                    sessionTotals={sessionTotals}
                    openingBalance={openSession?.openingBalance || 0}
                />
            </Modal>
            <Modal title="Registrar Nueva Compra" show={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} size="lg" headerIcon="🛒" headerColor="#0d6efd">
                <AddPurchaseForm onFormSubmit={handlePurchaseFormSubmit} shopId={shop?.id!}/>
            </Modal>
            <Modal title="Registrar Gasto de Turno" show={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} headerIcon="📋" headerColor="#f59e0b">
                <ExpenseForm onSave={handleExpenseFormSubmit} isSubmitting={isSubmitting}/>
            </Modal>
            <SaleDetailModal sale={selectedSaleForDetail} onClose={() => setSelectedSaleForDetail(null)}/>

            {/* Modal: Ventas Electrónicas */}
            <Modal title="Detalle de Ventas Electrónicas" show={showElectronicModal} onClose={() => setShowElectronicModal(false)} size="lg" headerIcon="💳" headerColor="#0d6efd">
                {(() => {
                    const electronicSales = sessionSales.filter(s => s.payments.some(p => p.type !== 'cash'));
                    if (electronicSales.length === 0) return <p className="text-muted text-center py-4">No hay ventas electrónicas en este turno.</p>;
                    return (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="small text-uppercase text-muted border-bottom">
                                    <tr>
                                        <th>Hora</th>
                                        <th>Cliente</th>
                                        <th>Método</th>
                                        <th className="text-end">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {electronicSales.map(sale => (
                                        sale.payments.filter(p => p.type !== 'cash').map((pay, i) => (
                                            <tr key={`${sale.id}-${i}`}>
                                                <td className="small text-muted">{sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</td>
                                                <td className="fw-semibold">{sale.clientName || 'Cliente general'}</td>
                                                <td><span className="badge rounded-pill" style={{background:'rgba(13,110,253,0.12)', color:'#0d6efd'}}>{pay.type}</span></td>
                                                <td className="text-end fw-bold" style={{color:'#0d6efd'}}>{fmt(Number(pay.amount))}</td>
                                            </tr>
                                        ))
                                    ))}
                                </tbody>
                                <tfoot className="border-top">
                                    <tr>
                                        <td colSpan={3} className="fw-bold">Total Electrónico</td>
                                        <td className="text-end fw-bold fs-6" style={{color:'#0d6efd'}}>{fmt(sessionTotals.electronicSales)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    );
                })()}
            </Modal>

            {/* Modal: Gastos y Compras */}
            <Modal title="Detalle de Gastos y Compras" show={showGastosModal} onClose={() => setShowGastosModal(false)} size="lg" headerIcon="📊" headerColor="#ef4444">
                <div className="d-flex flex-column gap-4">
                    {/* Compras */}
                    <div>
                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                            <span>🛒</span> Compras de Inventario
                            <span className="badge bg-danger rounded-pill ms-1">{sessionPurchases.length}</span>
                        </h6>
                        {sessionPurchases.length === 0 ? (
                            <p className="text-muted small">Sin compras en este turno.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0">
                                    <thead className="small text-uppercase text-muted border-bottom">
                                        <tr><th>Proveedor</th><th>Factura</th><th className="text-end">Total</th></tr>
                                    </thead>
                                    <tbody>
                                        {sessionPurchases.map(p => (
                                            <tr key={p.id}>
                                                <td className="fw-semibold">{p.supplierName}</td>
                                                <td className="text-muted small">{p.invoiceNumber || p.internalInvoiceNumber}</td>
                                                <td className="text-end fw-bold text-danger">-{fmt(Number(p.total))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-top">
                                        <tr>
                                            <td colSpan={2} className="fw-bold">Subtotal compras</td>
                                            <td className="text-end fw-bold text-danger">-{fmt(sessionTotals.totalPurchaseExpenses)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    <hr className="my-0"/>

                    {/* Gastos operacionales */}
                    <div>
                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                            <span>📋</span> Gastos Operacionales
                            <span className="badge bg-danger rounded-pill ms-1">{sessionExpenses.length}</span>
                        </h6>
                        {sessionExpenses.length === 0 ? (
                            <p className="text-muted small">Sin gastos en este turno.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0">
                                    <thead className="small text-uppercase text-muted border-bottom">
                                        <tr><th>Descripción</th><th>Categoría</th><th className="text-end">Monto</th></tr>
                                    </thead>
                                    <tbody>
                                        {sessionExpenses.map(e => (
                                            <tr key={e.id}>
                                                <td className="fw-semibold">{e.description}</td>
                                                <td><span className="badge bg-secondary bg-opacity-25 text-body rounded-pill small">{e.category}</span></td>
                                                <td className="text-end fw-bold text-danger">-{fmt(Number(e.amount))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-top">
                                        <tr>
                                            <td colSpan={2} className="fw-bold">Subtotal gastos</td>
                                            <td className="text-end fw-bold text-danger">-{fmt(sessionTotals.totalOperationalExpenses)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="rounded-3 p-3 d-flex justify-content-between align-items-center fw-bold" style={{background:'rgba(220,53,69,0.08)', border:'1.5px solid rgba(220,53,69,0.2)'}}>
                        <span>Total Salidas de Caja</span>
                        <span className="fs-6 text-danger">-{fmt(sessionTotals.totalPurchaseExpenses + sessionTotals.totalOperationalExpenses)}</span>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default CashSessionPage;