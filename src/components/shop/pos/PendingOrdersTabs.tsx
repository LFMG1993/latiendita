import { FC } from 'react';
import { SaleItem } from '../../../types';
import { Plus, X, Receipt } from 'react-bootstrap-icons';

interface PendingOrdersTabsProps {
    orders: Record<string, SaleItem[]>;
    activeOrderId: string | null;
    onSelectOrder: (orderId: string) => void;
    onCreateNewOrder: () => void;
    onCloseOrder: (orderId: string) => void;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

const PendingOrdersTabs: FC<PendingOrdersTabsProps> = ({ orders, activeOrderId, onSelectOrder, onCreateNewOrder, onCloseOrder }) => {
    const orderIds = Object.keys(orders);

    return (
        <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
            {orderIds.map((id, index) => {
                const isActive = id === activeOrderId;
                const items = orders[id];
                const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
                const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

                return (
                    <div
                        key={id}
                        onClick={() => onSelectOrder(id)}
                        style={{
                            cursor: 'pointer',
                            borderRadius: '12px',
                            border: isActive ? '2px solid var(--bs-primary)' : '2px solid var(--bs-border-color)',
                            background: isActive ? 'var(--bs-primary)' : 'var(--bs-body-bg)',
                            color: isActive ? '#fff' : 'var(--bs-body-color)',
                            padding: '8px 14px',
                            minWidth: '130px',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            boxShadow: isActive ? '0 4px 14px rgba(13,110,253,0.35)' : '0 1px 4px rgba(0,0,0,0.1)',
                        }}
                    >
                        <div className="d-flex align-items-center justify-content-between mb-1">
                            <div className="d-flex align-items-center gap-1">
                                <Receipt size={13} />
                                <span className="fw-bold small">Pedido {index + 1}</span>
                            </div>
                            {orderIds.length > 1 && (
                                <button
                                    className="btn p-0 border-0 d-flex align-items-center"
                                    style={{ color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--bs-secondary-color)', lineHeight: 1 }}
                                    onClick={(e) => { e.stopPropagation(); onCloseOrder(id); }}
                                    title="Cerrar pedido"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <div className="d-flex align-items-center justify-content-between">
                            <span
                                className="badge rounded-pill"
                                style={{
                                    background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bs-secondary-bg)',
                                    color: isActive ? '#fff' : 'var(--bs-secondary-color)',
                                    fontSize: '0.7rem'
                                }}
                            >
                                {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}
                            </span>
                            <span className="fw-bold" style={{ fontSize: '0.8rem' }}>
                                {itemCount > 0 ? formatCurrency(total) : '—'}
                            </span>
                        </div>
                    </div>
                );
            })}

            {/* Botón Nuevo Pedido */}
            <button
                onClick={onCreateNewOrder}
                title="Nuevo pedido"
                style={{
                    cursor: 'pointer',
                    borderRadius: '12px',
                    border: '2px dashed var(--bs-border-color)',
                    background: 'transparent',
                    color: 'var(--bs-secondary-color)',
                    padding: '8px 16px',
                    minHeight: '60px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--bs-primary)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--bs-primary)';
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--bs-border-color)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--bs-secondary-color)';
                }}
            >
                <Plus size={20} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Nuevo</span>
            </button>
        </div>
    );
};

export default PendingOrdersTabs;