import {FC, useState, useEffect} from "react";
import {PaymentMethod, SalePayment} from "../../../types";
import {UserProfile} from "../../../types/user.types";
import Modal from "../../general/Modal";
import {Trash, PersonFill, CreditCard, Cash, Coin, Search, XCircle, PlusCircle} from "react-bootstrap-icons";
import { createQuickClient, QuickClientData } from "../../../services/shop/customerServices";
import {useToast} from "../../../context/ToastContext";

interface PaymentModalProps {
    show: boolean;
    onClose: () => void;
    orderTotal: number;
    paymentMethods: PaymentMethod[];
    clients: UserProfile[];
    selectedClientId: string;
    onSelectClient: (id: string) => void;
    onClientCreated?: (client: UserProfile) => void;
    onConfirmPayment: (payments: SalePayment[], clientId?: string, clientName?: string) => Promise<void>;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(value);

const PaymentModal: FC<PaymentModalProps> = ({show, onClose, orderTotal, paymentMethods, clients, selectedClientId, onSelectClient, onConfirmPayment, onClientCreated}) => {
    const [payments, setPayments] = useState<SalePayment[]>([]);
    const [selectedMethodId, setSelectedMethodId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [currentAmount, setCurrentAmount] = useState<string>('');
    const [changeDue, setChangeDue] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const {showToast} = useToast();
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [isSavingClient, setIsSavingClient] = useState(false);
    const [newClientData, setNewClientData] = useState<QuickClientData>({firstName: '', lastName: '', phone: '', documentId: ''});

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = Math.max(0, orderTotal - totalPaid);
    const hasCreditPayment = payments.some(p => p.type === 'credit') || paymentMethods.find(m => m.id === selectedMethodId)?.type === 'credit';

    // Resetear el estado cuando el modal se abre
    useEffect(() => {
        if (show) {
            setPayments([]);
            setLoading(false)
            setChangeDue(0);
            const cashMethod = paymentMethods.find(m => m.type === 'cash');
            // Si encontramos un método de efectivo, lo usamos. Si no, usamos el primero de la lista.
            setSelectedMethodId(cashMethod?.id || paymentMethods[0]?.id || '');
            setCurrentAmount(orderTotal.toString());
            setSearchTerm('');
            setIsCreatingClient(false);
            setNewClientData({firstName: '', lastName: '', phone: '', documentId: ''});
        }
    }, [show, orderTotal, paymentMethods]);

    const handleAddPayment = () => {
        const amount = parseFloat(currentAmount);
        const method = paymentMethods.find(m => m.id === selectedMethodId);

        if (!method || isNaN(amount) || amount <= 0) return;

        // Permitimos agregar más del restante solo si es efectivo (para calcular cambio)
        // Para otros métodos, limitamos al restante.
        let amountToApply = amount;
        
        if (method.type !== 'cash' && amount > remainingAmount) {
             amountToApply = remainingAmount;
        }

        const currentTotalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        // Si ya está pagado todo, no permitir agregar más (salvo cambio en efectivo, pero eso se maneja diferente)
        if (currentTotalPaid >= orderTotal) {
             // Si es efectivo y quiere pagar "con X", calculamos cambio del total global
        }

        const newPayment: SalePayment = {
            methodId: method.id,
            methodName: method.name,
            type: method.type,
            amount: amountToApply,
        };

        setPayments(prev => [...prev, newPayment]);
        
        // Recalcular cambio
        const newTotalPaid = currentTotalPaid + amountToApply;
        if (newTotalPaid > orderTotal && method.type === 'cash') {
             setChangeDue(newTotalPaid - orderTotal);
        } else {
             setChangeDue(0);
        }

        const newRemaining = Math.max(0, orderTotal - newTotalPaid);
        setCurrentAmount(newRemaining > 0 ? newRemaining.toString() : '');
    };

    const handleRemovePayment = (index: number) => {
        setPayments(prev => {
            const newPayments = prev.filter((_, i) => i !== index);
            // Recalcular cambio al borrar
            const newTotal = newPayments.reduce((sum, p) => sum + p.amount, 0);
            setChangeDue(Math.max(0, newTotal - orderTotal));
            return newPayments;
        });
        // Reset amount to remaining
         const newTotal = payments.filter((_, i) => i !== index).reduce((sum, p) => sum + p.amount, 0);
         const rem = Math.max(0, orderTotal - newTotal);
         setCurrentAmount(rem.toString());
    };

    const handleConfirm = async () => {
        const currentTotalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        if (currentTotalPaid < orderTotal) {
             return; // Faltan fondos
        }

        if (remainingAmount <= 0) {
            // Si hay un pago a crédito, validar que el cliente esté seleccionado y habilitado
            if (payments.some(p => p.type === 'credit')) {
                if (!selectedClientId) {
                    showToast("Por favor selecciona un cliente para el pago a crédito (Fiado).", "warning");
                    return;
                }
                const client = clients.find(c => c.uid === selectedClientId);
                if (client && client.isCreditEnabled === false) { // Strict check for false
                     showToast(`El cliente ${client.firstName} no tiene el crédito habilitado.`, "warning");
                     return;
                }
                if (client && client.creditLimit && client.creditLimit > 0) {
                    const creditAmount = payments.filter(p => p.type === 'credit').reduce((sum, p) => sum + p.amount, 0);
                    const totalDebtAfterPurchase = (client.debt || 0) + creditAmount;
                    if (totalDebtAfterPurchase > client.creditLimit) {
                        showToast(`¡Límite de crédito excedido! El cliente ${client.firstName} tiene un límite de ${formatCurrency(client.creditLimit)} y una deuda de ${formatCurrency(client.debt || 0)}.`, "danger");
                        return;
                    }
                }
            }

            setLoading(true);
            try {
                const client = clients.find(c => c.uid === selectedClientId);
                await onConfirmPayment(payments, selectedClientId, client ? `${client.firstName} ${client.lastName}` : undefined);
            } finally {
                // El modal se cerrará, pero por seguridad reseteamos el estado
                setLoading(false);
            }
        }
    };

    const getMethodIcon = (type: string) => {
        switch (type) {
            case 'cash': return <Cash size={18} />;
            case 'credit': return <PersonFill size={18} />;
            case 'electronic': return <CreditCard size={18} />;
            default: return <Coin size={18} />;
        }
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClientData.firstName) return;
        setIsSavingClient(true);
        try {
            const newClient = await createQuickClient(newClientData);
            if (onClientCreated) {
                onClientCreated(newClient);
            } else {
                onSelectClient(newClient.uid || '');
            }
            setIsCreatingClient(false);
            setSearchTerm('');
            setNewClientData({firstName: '', lastName: '', phone: '', documentId: ''});
        } catch (error) {
            showToast("Error al crear el cliente", "danger");
        } finally {
            setIsSavingClient(false);
        }
    };

    return (
        <Modal title="Completar Venta" show={show} onClose={onClose}>
            {/* Header Totals */}
            <div className="row g-3 mb-4">
                <div className="col-6">
                    <div className="p-3 bg-body-tertiary rounded-3 text-center border h-100 d-flex flex-column justify-content-center">
                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.75rem'}}>Total a Pagar</small>
                        <span className="h3 mb-0 text-primary fw-bold">{formatCurrency(orderTotal)}</span>
                    </div>
                </div>
                <div className="col-6">
                    <div className={`p-3 rounded-3 text-center border h-100 d-flex flex-column justify-content-center ${remainingAmount > 0 ? 'bg-danger-subtle border-danger-subtle' : 'bg-success-subtle border-success-subtle'}`}>
                        <small className={`text-uppercase fw-bold ${remainingAmount > 0 ? 'text-danger' : 'text-success'}`} style={{fontSize: '0.75rem'}}>
                            {remainingAmount > 0 ? 'Faltante' : 'Cambio'}
                        </small>
                        <span className={`h3 mb-0 fw-bold ${remainingAmount > 0 ? 'text-danger' : 'text-success'}`}>
                            {remainingAmount > 0 ? formatCurrency(remainingAmount) : formatCurrency(changeDue)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment Input Section */}
            {remainingAmount > 0 && (
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body bg-body-tertiary rounded-3">
                        <h6 className="card-title mb-3 d-flex align-items-center">
                            <i className="bi bi-wallet2 me-2"></i> Agregar Pago
                        </h6>
                        <div className="row g-2 align-items-end">
                            <div className="col-12 col-md-5">
                                <label className="form-label small fw-bold text-muted">Método</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-body">{getMethodIcon(paymentMethods.find(m => m.id === selectedMethodId)?.type || '')}</span>
                                    <select 
                                        className="form-select border-start-0 ps-0" 
                                        value={selectedMethodId}
                                        onChange={e => setSelectedMethodId(e.target.value)}
                                        style={{boxShadow: 'none'}}
                                    >
                                        {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="col-7 col-md-4">
                                <label className="form-label small fw-bold text-muted">Monto</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    value={currentAmount}
                                    placeholder="0"
                                    onChange={e => setCurrentAmount(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddPayment()}
                                />
                            </div>
                            <div className="col-5 col-md-3">
                                <button 
                                    className="btn btn-primary w-100 fw-bold px-1" 
                                    type="button" 
                                    onClick={handleAddPayment}
                                    disabled={!currentAmount || parseFloat(currentAmount) <= 0}
                                >
                                    <i className="bi bi-plus-lg d-md-none d-lg-inline-block"></i> Añadir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* List of Payments Added */}
            <div className="mb-4">
                {payments.length > 0 ? (
                    <div className="d-flex flex-column gap-2">
                         {payments.map((p, index) => (
                             <div key={index} className="d-flex align-items-center justify-content-between p-2 rounded border bg-body-tertiary">
                                 <div className="d-flex align-items-center">
                                     <div className={`p-2 rounded-circle me-3 flex-shrink-0 ${p.type === 'credit' ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'}`}>
                                         {getMethodIcon(p.type)}
                                     </div>
                                     <div>
                                         <div className="fw-bold">{p.methodName}</div>
                                         <small className="text-muted">{p.type === 'credit' ? 'Crédito / Fiado' : 'Pago inmediato'}</small>
                                     </div>
                                 </div>
                                 <div className="d-flex align-items-center gap-3">
                                     <span className="fw-bold">{formatCurrency(p.amount)}</span>
                                     <button className="btn btn-sm btn-link text-danger p-0" onClick={() => handleRemovePayment(index)}>
                                         <Trash size={16}/>
                                     </button>
                                 </div>
                             </div>
                         ))}
                    </div>
                ) : (
                    <div className="text-center text-muted py-3 border rounded-3 border-dashed">
                        <small>Aún no hay pagos registrados</small>
                    </div>
                )}
            </div>


            {/* Client Selection Section (Always visible) */}
            <div className={`card shadow-sm border-0 mb-3 ${hasCreditPayment ? 'bg-primary-subtle bg-opacity-10' : 'bg-body-tertiary'}`}>
                 <div className="card-header bg-transparent border-0 pt-3 pb-0 d-flex align-items-center">
                     <PersonFill className={`${hasCreditPayment ? 'text-primary' : 'text-secondary'} me-2`}/> 
                     <h6 className={`m-0 fw-bold ${hasCreditPayment ? 'text-primary' : 'text-secondary'}`}>
                         {hasCreditPayment ? 'Cliente para Crédito (Requerido)' : 'Asociar Cliente (Opcional)'}
                     </h6>
                 </div>
                 <div className="card-body">
                     {!selectedClientId ? (
                         <div className="position-relative">
                             {!isCreatingClient ? (
                                 <>
                                     <div className="input-group">
                                         <span className="input-group-text bg-body border-end-0 text-muted"><Search/></span>
                                         <input
                                             type="text"
                                             className="form-control border-start-0 ps-0"
                                             placeholder="Buscar por nombre, teléfono o cédula..."
                                             value={searchTerm}
                                             onChange={(e) => setSearchTerm(e.target.value)}
                                             autoFocus
                                         />
                                     </div>
                                     
                                     {searchTerm.length > 0 && (
                                         <div className="position-absolute w-100 bg-body shadow-lg rounded-bottom border mt-1" style={{zIndex: 10, maxHeight: '250px', overflowY: 'auto'}}>
                                             {clients.filter(c => {
                                                 const term = searchTerm.toLowerCase();
                                                 return (
                                                     (c.firstName?.toLowerCase() || '').includes(term) ||
                                                     (c.lastName?.toLowerCase() || '').includes(term) ||
                                                     (c.phone || '').includes(term) || 
                                                     (c.identify || '').includes(term)
                                                 );
                                             }).slice(0, 10).map(c => (
                                                 <button
                                                     key={c.uid}
                                                     className={`list-group-item list-group-item-action border-0 px-3 py-2 d-flex justify-content-between align-items-center ${!c.isCreditEnabled ? 'bg-warning-subtle' : ''}`}
                                                     onClick={() => {
                                                         if (hasCreditPayment && c.isCreditEnabled === false) {
                                                             showToast('Este cliente tiene bloqueado el crédito.', 'warning');
                                                             return;
                                                         }
                                                         onSelectClient(c.uid || '');
                                                         setSearchTerm('');
                                                     }}
                                                 >
                                                     <div>
                                                         <div className="fw-bold">{c.firstName} {c.lastName}</div>
                                                         <div className="small text-muted">{c.phone} • {c.identify}</div>
                                                     </div>
                                                     {!c.isCreditEnabled && hasCreditPayment ? 
                                                         <span className="badge bg-warning text-dark"><i className="bi bi-lock-fill"></i> Bloqueado</span> :
                                                         <span className="badge bg-light text-dark border">Seleccionar</span>
                                                     }
                                                 </button>
                                             ))}
                                             {clients.filter(c => {
                                                 const term = searchTerm.toLowerCase();
                                                 return (c.firstName?.toLowerCase() || '').includes(term) || (c.lastName?.toLowerCase() || '').includes(term) || (c.phone || '').includes(term) || (c.identify || '').includes(term);
                                             }).length === 0 && (
                                                  <div className="p-3 text-center d-flex flex-column align-items-center">
                                                      <span className="text-muted small mb-2">No se encontraron resultados</span>
                                                      <button className="btn btn-sm btn-outline-primary" onClick={() => setIsCreatingClient(true)}>
                                                          <PlusCircle size={14} className="me-1"/> Crear nuevo cliente
                                                      </button>
                                                  </div>
                                             )}
                                         </div>
                                     )}
                                     
                                     {searchTerm.length === 0 && (
                                         <div className="text-end mt-2">
                                             <button className="btn btn-link btn-sm text-decoration-none p-0" onClick={() => setIsCreatingClient(true)}>
                                                 <PlusCircle size={14} className="me-1"/> Crear nuevo cliente
                                             </button>
                                         </div>
                                     )}
                                 </>
                             ) : (
                                 <form onSubmit={handleCreateClient} className="bg-body-tertiary p-3 border rounded shadow-sm">
                                     <h6 className="fw-bold mb-3 small text-muted border-bottom pb-2">Nuevo Cliente Rápido</h6>
                                     <div className="row g-2 mb-2">
                                         <div className="col-6">
                                             <input type="text" className="form-control form-control-sm" placeholder="Nombre *" value={newClientData.firstName} onChange={e => setNewClientData({...newClientData, firstName: e.target.value})} required autoFocus />
                                         </div>
                                         <div className="col-6">
                                             <input type="text" className="form-control form-control-sm" placeholder="Apellido" value={newClientData.lastName} onChange={e => setNewClientData({...newClientData, lastName: e.target.value})} />
                                         </div>
                                     </div>
                                     <div className="row g-2 mb-3">
                                         <div className="col-6">
                                             <input type="text" className="form-control form-control-sm" placeholder="Teléfono" value={newClientData.phone} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} />
                                         </div>
                                         <div className="col-6">
                                             <input type="text" className="form-control form-control-sm" placeholder="Cédula/Documento" value={newClientData.documentId} onChange={e => setNewClientData({...newClientData, documentId: e.target.value})} />
                                         </div>
                                     </div>
                                     <div className="d-flex justify-content-end gap-2">
                                         <button type="button" className="btn btn-sm btn-light" onClick={() => setIsCreatingClient(false)}>Cancelar</button>
                                         <button type="submit" className="btn btn-sm btn-primary" disabled={isSavingClient || !newClientData.firstName}>
                                             {isSavingClient ? 'Guardando...' : 'Guardar y Seleccionar'}
                                         </button>
                                     </div>
                                 </form>
                             )}
                         </div>

                         ) : (
                             (() => {
                                 const selectedClient = clients.find(c => c.uid === selectedClientId);
                                 if (!selectedClient) return null;
                                 
                                 return (
                                     <div className="bg-body-tertiary p-3 rounded shadow-sm d-flex justify-content-between align-items-center">
                                         <div>
                                             <h6 className="fw-bold mb-1">{selectedClient.firstName} {selectedClient.lastName}</h6>
                                             <div className="d-flex flex-wrap gap-3 small text-muted">
                                                 <span><i className="bi bi-telephone me-1"></i>{selectedClient.phone}</span>
                                                 <span className={selectedClient.debt && selectedClient.debt > 0 ? 'text-danger fw-bold' : ''}>
                                                     Deuda: {formatCurrency(selectedClient.debt || 0)}
                                                 </span>
                                                 {selectedClient.creditLimit && selectedClient.creditLimit > 0 ? (
                                                     <span className="text-info fw-bold">
                                                         Límite: {formatCurrency(selectedClient.creditLimit)}
                                                     </span>
                                                 ) : null}
                                             </div>
                                         </div>
                                         <button className="btn btn-outline-danger btn-sm rounded-circle p-2 lh-1" onClick={() => onSelectClient('')}>
                                             <XCircle size={16}/>
                                         </button>
                                     </div>
                                 );
                             })()
                         )}
                     </div>
                </div>

            {/* Footer Actions */}
            <div className="d-grid mt-4 pt-3 border-top">
                <button 
                    className={`btn btn-lg shadow-sm ${remainingAmount > 0 ? 'btn-secondary' : 'btn-success'}`} 
                    onClick={handleConfirm}
                    disabled={(remainingAmount > 0) || loading}
                    style={{transition: 'all 0.3s ease'}}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Procesando...
                        </>
                    ) : (
                        remainingAmount > 0 ? `Restan ${formatCurrency(remainingAmount)}` : 'Confirmar Venta'
                    )}
                </button>
            </div>
        </Modal>
    );
};

export default PaymentModal;