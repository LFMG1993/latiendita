import { FC } from 'react';
import { SaleItem } from '../../types';
import { PlusCircle, XCircle } from 'react-bootstrap-icons';

interface PendingOrdersTabsProps {
    orders: Record<string, SaleItem[]>;
    activeOrderId: string | null;
    onSelectOrder: (orderId: string) => void;
    onCreateNewOrder: () => void;
    onCloseOrder: (orderId: string) => void;
}

const PendingOrdersTabs: FC<PendingOrdersTabsProps> = ({ orders, activeOrderId, onSelectOrder, onCreateNewOrder, onCloseOrder }) => {
    const orderIds = Object.keys(orders);

    return (
        <div className="d-flex align-items-center mb-3">
            {orderIds.map((id, index) => (
                <div key={id} className="position-relative me-2">
                    <button
                        className={`btn ${id === activeOrderId ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => onSelectOrder(id)}
                    >
                        Pedido {index + 1}
                    </button>
                    <XCircle className="close-order-icon" onClick={(e) => { e.stopPropagation(); onCloseOrder(id); }} />
                </div>
            ))}
            <button className="btn btn-outline-success" onClick={onCreateNewOrder} title="Crear Nuevo Pedido">
                <PlusCircle />
            </button>
        </div>
    );
};

export default PendingOrdersTabs;