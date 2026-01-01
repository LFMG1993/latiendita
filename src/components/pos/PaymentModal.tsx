import {FC, useState, useEffect} from "react";
import {PaymentMethod, SalePayment} from "../../types";
import {UserProfile} from "../../types/user.types";
import Modal from "../general/Modal";
import {Trash, PersonFill} from "react-bootstrap-icons";

interface PaymentModalProps {
    show: boolean;
    onClose: () => void;
    orderTotal: number;
    paymentMethods: PaymentMethod[];
    clients: UserProfile[];
    selectedClientId: string;
    onSelectClient: (id: string) => void;
    onConfirmPayment: (payments: SalePayment[], clientId?: string, clientName?: string) => Promise<void>;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(value);

const PaymentModal: FC<PaymentModalProps> = ({show, onClose, orderTotal, paymentMethods, clients, selectedClientId, onSelectClient, onConfirmPayment}) => {
    const [payments, setPayments] = useState<SalePayment[]>([]);
    const [selectedMethodId, setSelectedMethodId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [currentAmount, setCurrentAmount] = useState<string>('');
    const [changeDue, setChangeDue] = useState(0);

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = orderTotal - totalPaid;
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
        }
    }, [show, orderTotal, paymentMethods]);

    const handleAddPayment = () => {
        const amount = parseFloat(currentAmount);
        const method = paymentMethods.find(m => m.id === selectedMethodId);

        if (!method || isNaN(amount) || amount <= 0) return;

        const amountToApply = Math.min(amount, remainingAmount);
        const change = (method.type === 'cash' && amount > remainingAmount) ? amount - remainingAmount : 0;

        const newPayment: SalePayment = {
            methodId: method.id,
            methodName: method.name,
            type: method.type,
            amount: amountToApply,
        };

        setPayments(prev => [...prev, newPayment]);
        setChangeDue(prevChange => prevChange + change);
        const newRemaining = remainingAmount - amountToApply;
        setCurrentAmount(newRemaining > 0 ? newRemaining.toString() : '');
    };

    const handleRemovePayment = (index: number) => {
        setPayments(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirm = async () => {
        if (remainingAmount <= 0 || changeDue > 0) {
            // Si hay un pago a crédito, validar que el cliente esté seleccionado
            if (payments.some(p => p.type === 'credit') && !selectedClientId) {
                alert("Por favor selecciona un cliente para el pago a crédito (Fiado).");
                return;
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

    return (
        <Modal title="Procesar Pago" show={show} onClose={onClose}>
            <div className="text-center mb-3">
                <h3>Total a Pagar: {formatCurrency(orderTotal)}</h3>
                <h4 className={`fw-light ${remainingAmount > 0 ? 'text-danger' : 'text-success'}`}
                    style={{minHeight: '3rem'}}>
                    {remainingAmount > 0 && `Faltan: ${formatCurrency(remainingAmount)}`}
                    {changeDue > 0 && `Cambio a Devolver: ${formatCurrency(changeDue)}`}
                </h4>
            </div>

            {payments.length > 0 && (
                <ul className="list-group mb-3">
                    {payments.map((p, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                            <span>
                                {p.methodName}: {formatCurrency(p.amount)}
                                {p.type === 'credit' && <span className="badge bg-danger ms-2">Fiado</span>}
                            </span>
                            <button className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRemovePayment(index)}><Trash/></button>
                        </li>
                    ))}
                </ul>
            )}

            {remainingAmount > 0 && (
                <div className="row g-2 align-items-end mb-3">
                    <div className="col-12 col-md-5">
                        <label htmlFor="paymentMethod" className="form-label small fw-bold">Método de Pago</label>
                        <select id="paymentMethod" className="form-select" value={selectedMethodId}
                                onChange={e => setSelectedMethodId(e.target.value)}>
                            {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="col-8 col-md-4">
                        <label htmlFor="paymentAmount" className="form-label small fw-bold">Monto</label>
                        <input type="number" id="paymentAmount" className="form-control" value={currentAmount}
                               onChange={e => setCurrentAmount(e.target.value)}/>
                    </div>
                    <div className="col-4 col-md-3">
                        <button className="btn btn-secondary w-100" type="button" onClick={handleAddPayment}>Añadir
                        </button>
                    </div>
                </div>
            )}

            {/* Selector de Cliente si hay pago a crédito */}
            {hasCreditPayment && (
                <div className="card bg-light border-0 mb-3 shadow-sm">
                    <div className="card-body">
                        <label className="form-label small fw-bold d-flex align-items-center">
                            <PersonFill className="me-2 text-primary"/> Seleccionar Cliente para Fiado
                        </label>
                        <select 
                            className="form-select" 
                            value={selectedClientId} 
                            onChange={e => onSelectClient(e.target.value)}
                        >
                            <option value="">-- Seleccionar Cliente --</option>
                            {clients.map(c => (
                                <option key={c.uid} value={c.uid}>{c.firstName} {c.lastName} ({c.phone})</option>
                            ))}
                        </select>
                        <small className="text-muted mt-1 d-block">La deuda se sumará automáticamente al perfil del cliente al finalizar.</small>
                    </div>
                </div>
            )}

            <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                <button className="btn btn-success btn-lg px-5 shadow-sm" onClick={handleConfirm}
                        disabled={(remainingAmount > 0 && changeDue === 0) || loading}>
                    {loading ? 'Procesando...' : 'Finalizar Venta'}
                </button>
            </div>
        </Modal>
    );
};

export default PaymentModal;