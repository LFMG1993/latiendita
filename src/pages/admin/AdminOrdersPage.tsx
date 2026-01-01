import {FC, useEffect, useState} from 'react';
import {useAuthStore} from '../../store/authStore';
import {getShopOrders, updateOrderStatus} from '../../services/orderService';
import {Order, OrderStatus} from '../../types/order.types';
import FullScreenLoader from '../../components/general/FullScreenLoader';
import {Clock, CheckCircle, Truck, Box, XCircle, Telephone, Receipt} from 'react-bootstrap-icons';
import {useTenant} from '../../context/TenantContext';

const AdminOrdersPage: FC = () => {
    const {activeIceCreamShopId} = useAuthStore();
    const {tenant} = useTenant();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showModal, setShowModal] = useState(false);

    const loadOrders = async () => {
        if (!activeIceCreamShopId) return;
        try {
            const data = await getShopOrders(activeIceCreamShopId);
            setOrders(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 30000);
        return () => clearInterval(interval);
    }, [activeIceCreamShopId]);

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            setOrders(current => current.map(o => o.id === orderId ? {...o, status: newStatus} : o));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => prev ? {...prev, status: newStatus} : null);
            }
        } catch (err) {
            alert("No se pudo actualizar el estado.");
        }
    };

    const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP', minimumFractionDigits: 0}).format(amount);
    };

    const getStatusIcon = (status: OrderStatus) => {
        switch(status) {
            case 'pending': return <Clock className="text-warning"/>;
            case 'preparing': return <Box className="text-info"/>;
            case 'ready': return <CheckCircle className="text-primary"/>;
            case 'delivered': return <Truck className="text-success"/>;
            case 'cancelled': return <XCircle className="text-danger"/>;
        }
    };

    const getStatusLabel = (status: OrderStatus) => {
        switch(status) {
            case 'pending': return 'Pendiente';
            case 'preparing': return 'Preparando';
            case 'ready': return 'Listo';
            case 'delivered': return 'Entregado';
            case 'cancelled': return 'Cancelado';
        }
    };

    if (loading) return <FullScreenLoader />;

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h2 className="fw-bold mb-1">Pedidos Online</h2>
                    <p className="text-muted small mb-0">Gestiona los pedidos entrantes desde el catálogo digital.</p>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="form-select shadow-sm"
                        style={{width: 'auto', minWidth: '180px'}}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendientes</option>
                        <option value="preparing">En Preparación</option>
                        <option value="ready">Listos para entrega</option>
                        <option value="delivered">Entregados</option>
                        <option value="cancelled">Cancelados</option>
                    </select>
                    <button className="btn btn-outline-primary shadow-sm" onClick={loadOrders}>
                        Actualizar
                    </button>
                </div>
            </div>

            <div className="row g-4">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => (
                        <div key={order.id} className="col-12 col-md-6 col-xl-4">
                            <div className={`card border-0 shadow-sm h-100 ${order.status === 'pending' ? 'border-start border-warning border-4' : ''}`}>
                                <div className="card-body d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h6 className="fw-bold mb-0">#{order.id.slice(-6).toUpperCase()}</h6>
                                            <small className="text-muted">{order.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                        </div>
                                        <div className="d-flex align-items-center gap-1">
                                            {getStatusIcon(order.status)}
                                            <span className="small fw-medium">{getStatusLabel(order.status)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <div className="fw-bold text-primary mb-1 d-flex align-items-center justify-content-between">
                                            {order.clientName}
                                            {order.paymentMethod === 'credit' && (
                                                <div className="d-flex flex-column align-items-end">
                                                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle ms-2" style={{fontSize: '0.65rem'}}>A CRÉDITO</span>
                                                    {(order.usedCredits || 0) > 0 && (
                                                        <span className="text-success fw-bold" style={{fontSize: '0.6rem'}}>PAGO SALDO</span>
                                                    )}
                                                    {(order.pendingDebt || 0) > 0 && (
                                                        <span className="text-danger fw-bold" style={{fontSize: '0.6rem'}}>FIADO</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-muted small d-flex align-items-center">
                                            <Telephone className="me-1" size={12}/> {order.clientPhone}
                                        </div>
                                    </div>

                                    <div className="bg-body-tertiary p-2 rounded mb-3 flex-grow-1">
                                        {order.items.slice(0, 2).map((item, idx) => (
                                            <div key={idx} className="small d-flex justify-content-between mb-1 text-body">
                                                <span>{item.quantity}x {item.product.name}</span>
                                            </div>
                                        ))}
                                        {order.items.length > 2 && <div className="small text-muted text-center mt-1">+{order.items.length - 2} más...</div>}
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                                        <span className="fw-bold fs-5 text-body">{formatCurrency(order.totalAmount)}</span>
                                        <div className="d-flex gap-1">
                                            <button 
                                                className="btn btn-light btn-sm shadow-sm" 
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setShowModal(true);
                                                }}
                                            >
                                                Detalles
                                            </button>
                                            
                                            {order.status === 'pending' && (
                                                <button className="btn btn-info btn-sm shadow-sm text-dark fw-bold" onClick={() => handleStatusChange(order.id, 'preparing')}>
                                                    Atender
                                                </button>
                                            )}
                                            {order.status === 'preparing' && (
                                                <button className="btn btn-primary btn-sm shadow-sm fw-bold" onClick={() => handleStatusChange(order.id, 'ready')}>
                                                    ¡Listo!
                                                </button>
                                            )}
                                            {order.status === 'ready' && (
                                                <button className="btn btn-success btn-sm shadow-sm fw-bold" onClick={() => handleStatusChange(order.id, 'delivered')}>
                                                    Entregar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center py-5">
                        <Receipt size={64} className="text-muted opacity-25 mb-3"/>
                        <h4 className="text-secondary">Sin pedidos registrados</h4>
                        <p className="text-muted">Los pedidos entrantes de tus clientes aparecerán aquí.</p>
                    </div>
                )}
            </div>

            {/* Modal Manual (Vanilla Bootstrap) */}
            {showModal && selectedOrder && (
                <>
                    <div className="modal show d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg">
                                <div className="modal-header border-0 pb-0">
                                    <h5 className="modal-title fw-bold">Pedido #{selectedOrder.id.slice(-6).toUpperCase()}</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <div className="text-muted small text-uppercase fw-bold mb-1">Cliente</div>
                                            <div className="fw-bold fs-5 text-body">{selectedOrder.clientName}</div>
                                            <div className="text-primary mb-2"><Telephone className="me-1"/> {selectedOrder.clientPhone}</div>
                                            <div>
                                                {selectedOrder.paymentMethod === 'credit' ? (
                                                    <div className="d-flex flex-column gap-1">
                                                        <span className="badge bg-danger rounded-pill px-3 py-2 w-fit">Pago: A CRÉDITO (FIADO)</span>
                                                        {(selectedOrder.usedCredits || 0) > 0 && (
                                                            <div className="small text-success fw-bold"><CheckCircle className="me-1"/> Cubierto con saldo: {formatCurrency(selectedOrder.usedCredits!)}</div>
                                                        )}
                                                        {(selectedOrder.pendingDebt || 0) > 0 && (
                                                            <div className="small text-danger fw-bold"><Clock className="me-1"/> Por cobrar (Deuda): {formatCurrency(selectedOrder.pendingDebt!)}</div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="badge bg-success rounded-pill px-3 py-2">Pago: EFECTIVO / OTRO</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-6 text-md-end mt-3 mt-md-0">
                                            <div className="text-muted small text-uppercase fw-bold mb-1">Fecha y Hora</div>
                                            <div className="text-body">{selectedOrder.createdAt.toDate().toLocaleString()}</div>
                                            <div className="mt-2">
                                                {getStatusBadge(selectedOrder.status)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-muted small text-uppercase fw-bold mb-2">Resumen de Productos</div>
                                    <div className="table-responsive border rounded mb-4">
                                        <table className="table table-hover mb-0">
                                            <thead className="table-light">
                                                <tr className="small text-uppercase">
                                                    <th>Producto</th>
                                                    <th className="text-center">Cant.</th>
                                                    <th className="text-end">Precio</th>
                                                    <th className="text-end">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items.map((item, idx) => (
                                                    <tr key={idx} className="align-middle">
                                                        <td className="text-body">{item.product.name}</td>
                                                        <td className="text-center text-body">{item.quantity}</td>
                                                        <td className="text-end text-body">{formatCurrency(item.priceAtPurchase)}</td>
                                                        <td className="text-end fw-bold text-body">{formatCurrency(item.priceAtPurchase * item.quantity)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="table-light">
                                                <tr className="border-0">
                                                    <td colSpan={3} className="text-end fw-bold">TOTAL:</td>
                                                    <td className="text-end fw-bold text-primary fs-5">{formatCurrency(selectedOrder.totalAmount)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    <div className="mb-2">
                                        <div className="text-muted small text-uppercase fw-bold mb-2">Cambiar Estado</div>
                                        <div className="d-flex flex-wrap gap-2">
                                            {(['pending', 'preparing', 'ready', 'delivered', 'cancelled'] as OrderStatus[]).map(st => (
                                                <button 
                                                    key={st} 
                                                    className={`btn btn-sm rounded-pill px-3 ${selectedOrder.status === st ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                    onClick={() => handleStatusChange(selectedOrder.id, st)}
                                                    style={selectedOrder.status === st ? {backgroundColor: tenant.theme.primaryColor, borderColor: tenant.theme.primaryColor} : {}}
                                                >
                                                    {getStatusLabel(st)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button type="button" className="btn btn-secondary px-4 fw-bold" onClick={() => setShowModal(false)}>Cerrar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const getStatusBadge = (status: OrderStatus) => {
    switch(status) {
        case 'pending': return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm">Esperando</span>;
        case 'preparing': return <span className="badge bg-info text-dark px-3 py-2 rounded-pill shadow-sm">En Cocina</span>;
        case 'ready': return <span className="badge bg-primary px-3 py-2 rounded-pill shadow-sm">Listo para retirar</span>;
        case 'delivered': return <span className="badge bg-success px-3 py-2 rounded-pill shadow-sm">Completado</span>;
        case 'cancelled': return <span className="badge bg-danger px-3 py-2 rounded-pill shadow-sm">Cancelado</span>;
    }
};

export default AdminOrdersPage;
