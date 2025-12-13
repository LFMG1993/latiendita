import {FC, useMemo} from "react";
import {Sale, Ingredient} from "../../types";
import Modal from "../general/Modal.tsx";

interface SaleDetailModalProps {
    sale: Sale | null;
    ingredients?: Ingredient[];
    onClose: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(value);

const SaleDetailModal: FC<SaleDetailModalProps> = ({sale, ingredients, onClose}) => {
    const ingredientsMap = useMemo(() => {
        return ingredients ? new Map(ingredients.map(ing => [ing.id, ing])) : null;
    }, [ingredients]);
    if (!sale) return null;

    return (
        <Modal title={`Detalles de Venta - ${sale.createdAt.toDate().toLocaleTimeString()}`} show={!!sale}
               onClose={onClose} size="lg">
            <div className="row">
                <div className="col-md-7">
                    <h6>Productos Vendidos</h6>
                    <ul className="list-group">
                        {sale.items.map((item, itemIndex) => (
                            <li key={`${item.productId}-${itemIndex}`} className="list-group-item">
                                <div className="d-flex justify-content-between">
                                    <span className="fw-bold">{item.quantity}x {item.productName}</span>
                                    <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
                                </div>
                                {/* Mostramos los detalles de los ingredientes solo si tenemos el "diccionario" */}
                                {ingredientsMap && (
                                    <div className="ps-3">
                                        {item.ingredientsUsed.map((usage, usageIndex) => {
                                            const ingredient = ingredientsMap.get(usage.ingredientId);
                                            return (
                                                <div key={`${usage.ingredientId}-${usageIndex}`}
                                                     className="text-muted small">
                                                    - {ingredient?.name || `ID: ${usage.ingredientId.substring(0, 5)}...`}
                                                    {' '}({usage.quantity} {ingredient?.consumptionUnit})
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="col-md-5">
                    <h6>Pagos Recibidos</h6>
                    <ul className="list-group">
                        {sale.payments.map((payment, index) => (
                            <li key={index} className="list-group-item d-flex justify-content-between">
                                <span>{payment.methodName}</span>
                                <span>{formatCurrency(payment.amount)}</span>
                            </li>
                        ))}
                        <li className="list-group-item d-flex justify-content-between fw-bold bg-light">
                            <span>Total Pagado</span>
                            <span>{formatCurrency(sale.total)}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
};

export default SaleDetailModal;