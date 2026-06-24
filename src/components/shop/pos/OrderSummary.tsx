import {FC, useMemo} from "react";
import {SaleItem, Ingredient} from "../../../types";
import {Trash, PlusCircle, DashCircle, CartX, Cart3} from "react-bootstrap-icons";

interface OrderSummaryProps {
    orderItems: SaleItem[];
    ingredients: Ingredient[];
    onUpdateQuantity: (lineItemId: string, newQuantity: number) => void;
    onProceedToPayment: () => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP', maximumFractionDigits: 0}).format(value);
};

const OrderSummary: FC<OrderSummaryProps> = ({orderItems, ingredients, onUpdateQuantity, onProceedToPayment}) => {
    const ingredientsMap = useMemo(() => new Map(ingredients.map(ing => [ing.id, ing])), [ingredients]);

    const total = orderItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const isEmpty = orderItems.length === 0;

    return (
        <div
            className="card border-0 shadow"
            style={{borderRadius: '16px', overflow: 'hidden'}}
        >
            {/* Header */}
            <div
                className="card-header border-0 d-flex align-items-center justify-content-between px-4 py-3"
                style={{background: 'var(--bs-body-bg)'}}
            >
                <div className="d-flex align-items-center gap-2">
                    <Cart3 size={20} className="text-primary"/>
                    <h5 className="mb-0 fw-bold">Pedido Actual</h5>
                </div>
                {!isEmpty && (
                    <span
                        className="badge rounded-pill bg-primary"
                        style={{fontSize: '0.75rem'}}
                    >
                        {totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}
                    </span>
                )}
            </div>

            {/* Body */}
            <div
                className="card-body p-0 bg-body"
                style={{minHeight: '55vh', maxHeight: '60vh', overflowY: 'auto'}}
            >
                {isEmpty ? (
                    <div
                        className="d-flex flex-column align-items-center justify-content-center text-center h-100 py-5 px-4"
                        style={{minHeight: '300px'}}
                    >
                        <div
                            className="rounded-circle bg-body-secondary d-flex align-items-center justify-content-center mb-3"
                            style={{width: '72px', height: '72px'}}
                        >
                            <CartX size={32} className="text-secondary opacity-50"/>
                        </div>
                        <p className="text-muted fw-medium mb-1">Pedido vacío</p>
                        <p className="text-muted small opacity-75">Selecciona productos del menú para comenzar.</p>
                    </div>
                ) : (
                    <div className="px-3 py-2">
                        {orderItems.map((item, index) => (
                            <div
                                key={item.id}
                                className="py-3"
                                style={{
                                    borderBottom: index < orderItems.length - 1 ? '1px solid var(--bs-border-color-translucent)' : 'none'
                                }}
                            >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div className="flex-grow-1 me-2">
                                        <div className="fw-semibold text-body" style={{fontSize: '0.9rem', lineHeight: 1.3}}>
                                            {item.productName}
                                        </div>
                                        <div className="text-muted" style={{fontSize: '0.78rem'}}>
                                            {formatCurrency(item.unitPrice)} c/u
                                        </div>
                                        {/* Sabores/ingredientes */}
                                        {item.ingredientsUsed
                                            .filter(usage => ingredientsMap.get(usage.ingredientId)?.category === 'Helados')
                                            .map(usage => (
                                                <div
                                                    key={usage.ingredientId}
                                                    className="text-muted d-flex align-items-center gap-1 mt-1"
                                                    style={{fontSize: '0.76rem'}}
                                                >
                                                    <span className="text-primary">•</span>
                                                    {ingredientsMap.get(usage.ingredientId)?.name}
                                                </div>
                                            ))
                                        }
                                    </div>
                                    <div className="fw-bold text-body" style={{fontSize: '0.9rem', whiteSpace: 'nowrap'}}>
                                        {formatCurrency(item.unitPrice * item.quantity)}
                                    </div>
                                </div>

                                {/* Controles cantidad */}
                                <div className="d-flex align-items-center justify-content-end gap-2">
                                    <button
                                        className="btn btn-sm btn-outline-danger rounded-circle p-0 d-flex align-items-center justify-content-center"
                                        style={{width: '28px', height: '28px', border: 'none'}}
                                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                        title="Reducir"
                                    >
                                        <DashCircle size={18}/>
                                    </button>
                                    <span
                                        className="fw-bold text-center bg-body-secondary rounded"
                                        style={{minWidth: '32px', fontSize: '0.9rem', padding: '2px 8px'}}
                                    >
                                        {item.quantity}
                                    </span>
                                    <button
                                        className="btn btn-sm btn-outline-success rounded-circle p-0 d-flex align-items-center justify-content-center"
                                        style={{width: '28px', height: '28px', border: 'none'}}
                                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                        title="Aumentar"
                                    >
                                        <PlusCircle size={18}/>
                                    </button>
                                    <button
                                        className="btn btn-sm p-0 d-flex align-items-center justify-content-center ms-1"
                                        style={{width: '28px', height: '28px', border: 'none', color: 'var(--bs-danger)', opacity: 0.7}}
                                        onClick={() => onUpdateQuantity(item.id, 0)}
                                        title="Eliminar"
                                    >
                                        <Trash size={15}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div
                className="card-footer border-0 px-4 py-3"
                style={{background: 'var(--bs-body-bg)'}}
            >
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted fw-medium">Total</span>
                    <span className="fw-bold fs-4 text-body">{formatCurrency(total)}</span>
                </div>
                <button
                    className="btn btn-success w-100 fw-bold py-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
                    style={{
                        borderRadius: '12px',
                        fontSize: '1rem',
                        opacity: isEmpty ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                    }}
                    onClick={onProceedToPayment}
                    disabled={isEmpty}
                >
                    <Cart3 size={20}/>
                    Cobrar — {formatCurrency(total)}
                </button>
            </div>
        </div>
    );
};

export default OrderSummary;