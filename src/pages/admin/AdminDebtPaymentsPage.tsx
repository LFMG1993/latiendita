import { FC, useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { DebtPaymentRequest } from '../../types';
import { getPendingDebtPayments, approveDebtPayment, rejectDebtPayment, updateClientCreditLimit } from '../../services/debtPaymentService';
import FullScreenLoader from '../../components/general/FullScreenLoader';
import { CheckLg, XLg, Receipt, Wallet2, PersonCheck } from 'react-bootstrap-icons';
import { useToast } from '../../context/ToastContext';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

// ============ Modal de aprobación ============
interface ApproveModalProps {
    payment: DebtPaymentRequest;
    onClose: () => void;
    onApproved: (debtCleared: boolean, payment: DebtPaymentRequest) => void;
}

const ApproveModal: FC<ApproveModalProps> = ({ payment, onClose, onApproved }) => {
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleApprove = async () => {
        setLoading(true);
        try {
            const newDebt = await approveDebtPayment(payment.id, payment.clientId, payment.amount);
            onApproved(newDebt === 0, payment);
        } catch (error) {
            console.error("Error al aprobar:", error);
            showToast("Error al aprobar el pago. Inténtalo de nuevo.", "danger");
            setLoading(false);
        }
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div className="modal-header border-0 bg-success bg-opacity-10 px-4 pt-4 pb-2">
                        <h5 className="modal-title fw-bold text-success">Confirmar Aprobación de Pago</h5>
                        <button className="btn-close" onClick={onClose} disabled={loading} />
                    </div>
                    <div className="modal-body px-4 py-3">
                        <div className="mb-3">
                            <p className="mb-1 text-secondary small">Cliente:</p>
                            <p className="fw-bold fs-6 mb-0">{payment.clientName}</p>
                        </div>
                        <div className="bg-body-tertiary rounded-3 p-3 mb-3">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted small">Monto del abono:</span>
                                <span className="fw-bold text-success">{formatCurrency(payment.amount)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted small">Método de pago:</span>
                                <span className="fw-medium">{payment.paymentMethodName}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span className="text-muted small">Comprobante:</span>
                                <span className="fw-medium text-break text-end" style={{ maxWidth: '60%' }}>{payment.voucherNumber}</span>
                            </div>
                        </div>
                        <div className="alert alert-warning py-2 small mb-0">
                            ⚠️ Al aprobar, se restará <strong>{formatCurrency(payment.amount)}</strong> de la deuda del cliente automáticamente.
                        </div>
                    </div>
                    <div className="modal-footer border-0 px-4 pb-4 pt-2 gap-2">
                        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button className="btn btn-success rounded-pill px-4 fw-bold d-flex align-items-center gap-2" onClick={handleApprove} disabled={loading}>
                            {loading ? <span className="spinner-border spinner-border-sm" /> : <CheckLg size={18} />}
                            {loading ? 'Aprobando...' : 'Sí, Aprobar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============ Modal de Crédito (cuando deuda queda en 0) ============
interface CreditModalProps {
    payment: DebtPaymentRequest;
    onClose: () => void;
    onSaved: () => void;
}

const CreditModal: FC<CreditModalProps> = ({ payment, onClose, onSaved }) => {
    const [creditAction, setCreditAction] = useState<'keep' | 'restore' | 'change'>('restore');
    const [newCreditAmount, setNewCreditAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleSave = async () => {
        setLoading(true);
        try {
            if (creditAction === 'restore') {
                // Habilitamos crédito al cliente (lo dejamos en 0 pero isCreditEnabled = true)
                await updateClientCreditLimit(payment.clientId, 0);
            } else if (creditAction === 'change') {
                const amount = parseFloat(newCreditAmount);
                if (isNaN(amount) || amount < 0) {
                    showToast('Ingresa un monto válido.', 'warning');
                    setLoading(false);
                    return;
                }
                await updateClientCreditLimit(payment.clientId, amount);
            }
            onSaved();
        } catch (error) {
            console.error("Error actualizando crédito:", error);
            showToast("Error al actualizar el crédito.", "danger");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div className="modal-header border-0 px-4 pt-4 pb-2" style={{ background: 'linear-gradient(135deg, #6610f220, transparent)' }}>
                        <div>
                            <h5 className="modal-title fw-bold mb-0">🎉 ¡Deuda Saldada!</h5>
                            <p className="text-muted small mb-0 mt-1">
                                <strong>{payment.clientName}</strong> pagó su deuda completa.
                            </p>
                        </div>
                    </div>
                    <div className="modal-body px-4 py-3">
                        <p className="text-secondary small mb-3">¿Qué deseas hacer con el crédito de este cliente?</p>
                        <div className="d-flex flex-column gap-2">
                            <label className={`d-flex align-items-start gap-3 p-3 rounded-3 border-2 cursor-pointer ${creditAction === 'restore' ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                                style={{ cursor: 'pointer' }} onClick={() => setCreditAction('restore')}>
                                <input type="radio" className="form-check-input mt-1 flex-shrink-0" checked={creditAction === 'restore'} readOnly />
                                <div>
                                    <p className="mb-0 fw-semibold">Restaurar crédito al estado original</p>
                                    <p className="mb-0 small text-muted">El cliente podrá seguir comprando fiado con el mismo límite de antes.</p>
                                </div>
                            </label>
                            <label className={`d-flex align-items-start gap-3 p-3 rounded-3 border-2 cursor-pointer ${creditAction === 'change' ? 'border-success bg-success bg-opacity-10' : 'border-light'}`}
                                style={{ cursor: 'pointer' }} onClick={() => setCreditAction('change')}>
                                <input type="radio" className="form-check-input mt-1 flex-shrink-0" checked={creditAction === 'change'} readOnly />
                                <div className="w-100">
                                    <p className="mb-0 fw-semibold">Cambiar el límite de crédito</p>
                                    <p className="mb-0 small text-muted">Aumenta o disminuye el crédito disponible del cliente.</p>
                                    {creditAction === 'change' && (
                                        <div className="mt-2">
                                            <label className="form-label small fw-semibold">Nuevo saldo de crédito ($)</label>
                                            <div className="input-group input-group-sm">
                                                <span className="input-group-text">$</span>
                                                <input type="number" className="form-control" min="0" value={newCreditAmount}
                                                    onChange={e => setNewCreditAmount(e.target.value)}
                                                    placeholder="Ej: 50000" autoFocus />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </label>
                            <label className={`d-flex align-items-start gap-3 p-3 rounded-3 border-2 cursor-pointer ${creditAction === 'keep' ? 'border-secondary bg-secondary bg-opacity-10' : 'border-light'}`}
                                style={{ cursor: 'pointer' }} onClick={() => setCreditAction('keep')}>
                                <input type="radio" className="form-check-input mt-1 flex-shrink-0" checked={creditAction === 'keep'} readOnly />
                                <div>
                                    <p className="mb-0 fw-semibold">No cambiar nada por ahora</p>
                                    <p className="mb-0 small text-muted">El pago queda aprobado pero el crédito no se modifica.</p>
                                </div>
                            </label>
                        </div>
                    </div>
                    <div className="modal-footer border-0 px-4 pb-4 pt-2 gap-2">
                        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose} disabled={loading}>Cerrar</button>
                        {creditAction !== 'keep' && (
                            <button className="btn btn-primary rounded-pill px-4 fw-bold d-flex align-items-center gap-2"
                                onClick={handleSave} disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm" /> : <PersonCheck size={18} />}
                                {loading ? 'Guardando...' : 'Guardar'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============ Página principal ============
const AdminDebtPaymentsPage: FC = () => {
    const { activeIceCreamShopId } = useAuthStore();
    const { showToast } = useToast();
    const [payments, setPayments] = useState<DebtPaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Modales
    const [approveTarget, setApproveTarget] = useState<DebtPaymentRequest | null>(null);
    const [creditTarget, setCreditTarget] = useState<DebtPaymentRequest | null>(null);
    const [rejectTarget, setRejectTarget] = useState<DebtPaymentRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        if (!activeIceCreamShopId) return;
        fetchPayments();
    }, [activeIceCreamShopId]);

    const fetchPayments = async () => {
        if (!activeIceCreamShopId) return;
        setLoading(true);
        try {
            const data = await getPendingDebtPayments(activeIceCreamShopId);
            setPayments(data);
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproved = (debtCleared: boolean, payment: DebtPaymentRequest) => {
        setApproveTarget(null);
        setPayments(prev => prev.filter(p => p.id !== payment.id));
        if (debtCleared) {
            // Mostrar modal de crédito
            setCreditTarget(payment);
        } else {
            showToast(`✅ Pago aprobado correctamente. El cliente realizó un abono de ${formatCurrency(payment.amount)}.`, 'success');
        }
    };

    const handleRejectConfirm = async () => {
        if (!rejectTarget) return;
        setProcessingId(rejectTarget.id);
        try {
            await rejectDebtPayment(rejectTarget.id, rejectReason);
            setPayments(prev => prev.filter(p => p.id !== rejectTarget.id));
            setRejectTarget(null);
            setRejectReason('');
        } catch (error) {
            console.error("Error al rechazar:", error);
            showToast("Error al rechazar el pago.", "danger");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <FullScreenLoader />;

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <Wallet2 className="text-primary" /> Pagos de Deudas Pendientes
                </h2>
                <button className="btn btn-outline-secondary rounded-pill" onClick={fetchPayments}>Actualizar</button>
            </div>

            {payments.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                    <Receipt size={48} className="text-muted opacity-25 mb-3" />
                    <h4 className="text-secondary mb-0">No hay pagos de deudas pendientes.</h4>
                    <p className="text-muted small mt-2">Cuando un cliente registre un abono, aparecerá aquí.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {payments.map(payment => (
                        <div key={payment.id} className="col-12 col-md-6 col-xl-4">
                            <div className="card border-0 shadow-sm rounded-4 h-100">
                                <div className="card-header bg-warning bg-opacity-10 border-0 pt-3 pb-2 px-4 d-flex justify-content-between align-items-center">
                                    <span className="badge bg-warning text-dark px-3 py-2 rounded-pill">Revisión Pendiente</span>
                                    <small className="text-muted fw-medium">
                                        {payment.createdAt?.toDate().toLocaleDateString()} {payment.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </small>
                                </div>
                                <div className="card-body p-4">
                                    <h5 className="fw-bold mb-1">{payment.clientName}</h5>
                                    {payment.clientPhone && <p className="text-muted small mb-3">{payment.clientPhone}</p>}

                                    <div className="bg-body-tertiary rounded-3 p-3 mb-3">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted small">Monto:</span>
                                            <span className="fw-bold text-success">{formatCurrency(payment.amount)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted small">Método:</span>
                                            <span className="fw-medium">{payment.paymentMethodName}</span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted small">Comprobante:</span>
                                            <span className="fw-medium text-break text-end" style={{ maxWidth: '60%' }}>{payment.voucherNumber}</span>
                                        </div>
                                    </div>

                                    <div className="d-flex gap-2 mt-auto">
                                        <button
                                            className="btn btn-outline-danger w-50 fw-bold d-flex align-items-center justify-content-center gap-2"
                                            onClick={() => { setRejectTarget(payment); setRejectReason(''); }}
                                            disabled={processingId === payment.id}
                                        >
                                            <XLg size={16} /> Rechazar
                                        </button>
                                        <button
                                            className="btn btn-success w-50 fw-bold d-flex align-items-center justify-content-center gap-2"
                                            onClick={() => setApproveTarget(payment)}
                                            disabled={processingId === payment.id}
                                        >
                                            <CheckLg size={16} /> Aprobar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de confirmación de aprobación */}
            {approveTarget && (
                <ApproveModal
                    payment={approveTarget}
                    onClose={() => setApproveTarget(null)}
                    onApproved={handleApproved}
                />
            )}

            {/* Modal de crédito cuando deuda = 0 */}
            {creditTarget && (
                <CreditModal
                    payment={creditTarget}
                    onClose={() => setCreditTarget(null)}
                    onSaved={() => { setCreditTarget(null); showToast('✅ Crédito actualizado correctamente.', 'success'); }}
                />
            )}

            {/* Modal de rechazo */}
            {rejectTarget && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header border-0 bg-danger bg-opacity-10 px-4 pt-4 pb-2">
                                <h5 className="modal-title fw-bold text-danger">Rechazar Pago</h5>
                                <button className="btn-close" onClick={() => setRejectTarget(null)} />
                            </div>
                            <div className="modal-body px-4 py-3">
                                <p className="text-secondary small mb-3">
                                    ¿Estás seguro de rechazar el pago de <strong>{rejectTarget.clientName}</strong> por <strong>{formatCurrency(rejectTarget.amount)}</strong>?
                                </p>
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold">Razón del rechazo (Opcional)</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        placeholder="Ej: El comprobante no coincide con el monto indicado."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer border-0 px-4 pb-4 pt-2 gap-2">
                                <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setRejectTarget(null)}>Cancelar</button>
                                <button
                                    className="btn btn-danger rounded-pill px-4 fw-bold d-flex align-items-center gap-2"
                                    onClick={handleRejectConfirm}
                                    disabled={processingId === rejectTarget.id}
                                >
                                    {processingId === rejectTarget.id ? <span className="spinner-border spinner-border-sm" /> : <XLg size={16} />}
                                    Confirmar Rechazo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDebtPaymentsPage;
