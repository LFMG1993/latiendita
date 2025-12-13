import {FC, useState, useEffect} from "react";
import {PaymentMethod, SalePayment} from "../../types";
import Modal from "../general/Modal";
import {Trash} from "react-bootstrap-icons";

interface PaymentModalProps {
    show: boolean;
    onClose: () => void;
    orderTotal: number;
    paymentMethods: PaymentMethod[];
    onConfirmPayment: (payments: SalePayment[]) => Promise<void>;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(value);

const PaymentModal: FC<PaymentModalProps> = ({show, onClose, orderTotal, paymentMethods, onConfirmPayment}) => {
    const [payments, setPayments] = useState<SalePayment[]>([]);
    const [selectedMethodId, setSelectedMethodId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [currentAmount, setCurrentAmount] = useState<string>('');
    const [changeDue, setChangeDue] = useState(0);

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = orderTotal - totalPaid;

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

        // Preparamos el siguiente pago
        const newRemaining = remainingAmount - amountToApply;
        setCurrentAmount(newRemaining > 0 ? newRemaining.toString() : '');
    };

    const handleRemovePayment = (index: number) => {
        setPayments(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirm = async () => {
        if (remainingAmount <= 0 || changeDue > 0) {
            setLoading(true);
            try {
                await onConfirmPayment(payments);
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
                            {p.methodName}: {formatCurrency(p.amount)}
                            <button className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRemovePayment(index)}><Trash/></button>
                        </li>
                    ))}
                </ul>
            )}

            {remainingAmount > 0 && (
                <div className="row g-2 align-items-end">
                    <div className="col">
                        <label htmlFor="paymentMethod" className="form-label">Método de Pago</label>
                        <select id="paymentMethod" className="form-select" value={selectedMethodId}
                                onChange={e => setSelectedMethodId(e.target.value)}>
                            {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="col">
                        <label htmlFor="paymentAmount" className="form-label">Monto</label>
                        <input type="number" id="paymentAmount" className="form-control" value={currentAmount}
                               onChange={e => setCurrentAmount(e.target.value)}/>
                    </div>
                    <div className="col-auto">
                        <button className="btn btn-secondary" type="button" onClick={handleAddPayment}>Añadir Pago
                        </button>
                    </div>
                </div>
            )}

            <div className="d-flex justify-content-end mt-4">
                <button className="btn btn-success btn-lg" onClick={handleConfirm}
                        disabled={(remainingAmount > 0 && changeDue === 0) || loading}>
                    {loading ? 'Procesando...' : 'Finalizar Venta'}
                </button>
            </div>
        </Modal>
    );
};

export default PaymentModal;