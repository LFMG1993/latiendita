import {FC, useEffect, useState} from 'react';
import {getAllClients, updateClientFinancials} from '../../services/userServices';
import {useAuthStore} from '../../store/authStore';
import {getClientOrders} from '../../services/orderService';
import {UserProfile} from '../../types/user.types';
import {Order} from '../../types/order.types';
import FullScreenLoader from '../../components/general/FullScreenLoader';
import {Person, Telephone, Receipt, Search, ClockHistory, CashStack} from 'react-bootstrap-icons';
import {useTenant} from '../../context/TenantContext';

const AdminClientsPage: FC = () => {
    const {activeIceCreamShopId} = useAuthStore();
    const {tenant} = useTenant();
    const [clients, setClients] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados para el detalle de un cliente
    const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
    const [clientOrders, setClientOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    // Estados para la gestión de crédito
    const [tempCredits, setTempCredits] = useState(0);
    const [tempDebt, setTempDebt] = useState(0);
    const [tempIsCreditEnabled, setTempIsCreditEnabled] = useState(false);
    const [updatingSaldos, setUpdatingSaldos] = useState(false);

    const loadData = async () => {
        try {
            const data = await getAllClients();
            setClients(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleViewDetail = async (client: UserProfile) => {
        setSelectedClient(client);
        setTempCredits(client.credits || 0);
        setTempDebt(client.debt || 0);
        setTempIsCreditEnabled(!!client.isCreditEnabled);
        setLoadingOrders(true);
        setShowDetail(true);
        try {
            if (client.uid && activeIceCreamShopId) {
                const orders = await getClientOrders(client.uid, activeIceCreamShopId);
                setClientOrders(orders);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleUpdateSaldos = async () => {
        if (!selectedClient?.uid) return;
        setUpdatingSaldos(true);
        try {
            await updateClientFinancials(selectedClient.uid, tempCredits, tempDebt, tempIsCreditEnabled);
            // Actualizar localmente
            setClients(prev => prev.map(c => c.uid === selectedClient.uid ? {...c, credits: tempCredits, debt: tempDebt, isCreditEnabled: tempIsCreditEnabled} : c));
            setSelectedClient(prev => prev ? {...prev, credits: tempCredits, debt: tempDebt, isCreditEnabled: tempIsCreditEnabled} : null);
            alert("Cuenta actualizada correctamente");
        } catch (err) {
            alert("Error al actualizar saldos.");
        } finally {
            setUpdatingSaldos(false);
        }
    };

    const filteredClients = clients.filter(c => 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP', minimumFractionDigits: 0}).format(amount);
    };

    if (loading) return <FullScreenLoader />;

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h2 className="fw-bold mb-1">Clientes y Créditos</h2>
                    <p className="text-muted small mb-0">Gestiona los saldos y revisa el historial de tus clientes registrados.</p>
                </div>
                <div className="position-relative" style={{minWidth: '280px'}}>
                    <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"/>
                    <input 
                        type="text" 
                        className="form-control ps-5 shadow-sm rounded-pill" 
                        placeholder="Buscar por nombre o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="row g-4">
                {filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                        <div key={client.uid} className="col-12 col-md-6 col-lg-4">
                            <div className="card border-0 shadow-sm h-100 hover-card">
                                <div className="card-body">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                                            <Person className="text-primary" size={24}/>
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-0 text-body">{client.firstName} {client.lastName}</h6>
                                            <small className="text-muted"><Telephone className="me-1"/> {client.phone}</small>
                                        </div>
                                    </div>

                                    <div className="row g-2 mb-3 text-center">
                                        <div className="col-6">
                                            <div className="bg-success bg-opacity-10 rounded p-2">
                                                <small className="text-muted d-block small-label text-uppercase">Crédito</small>
                                                <span className="fw-bold text-success">{formatCurrency(client.credits || 0)}</span>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="bg-danger bg-opacity-10 rounded p-2">
                                                <small className="text-muted d-block small-label text-uppercase">Deuda</small>
                                                <span className="fw-bold text-danger">{formatCurrency(client.debt || 0)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        className="btn btn-outline-primary w-100 rounded-pill fw-bold"
                                        onClick={() => handleViewDetail(client)}
                                    >
                                        Gestionar Cuenta
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center py-5">
                        <Person size={64} className="text-muted opacity-25 mb-3"/>
                        <h4 className="text-secondary">No hay clientes que coincidan</h4>
                    </div>
                )}
            </div>

            {/* Modal de Detalle y Gestión */}
            {showDetail && selectedClient && (
                <div className="modal show d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.6)'}}>
                    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-bottom p-4">
                                <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                                        <Person className="text-primary" size={28}/>
                                    </div>
                                    <div>
                                        <h4 className="modal-title fw-bold mb-0">{selectedClient.firstName} {selectedClient.lastName}</h4>
                                        <span className="text-muted small">ID: {selectedClient.uid?.slice(-8).toUpperCase()} | {selectedClient.email}</span>
                                    </div>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setShowDetail(false)}></button>
                            </div>
                            <div className="modal-body p-4 bg-body-tertiary">
                                <div className="row g-4">
                                    {/* Columna Izquierda: Gestión de Saldos */}
                                    <div className="col-lg-4">
                                        <div className="card border-0 shadow-sm mb-4">
                                            <div className="card-body">
                                                <h5 className="fw-bold mb-4 d-flex align-items-center">
                                                    <CashStack className="me-2 text-primary"/> Gestión de Saldos
                                                </h5>
                                                
                                                <div className="mb-3">
                                                    <label className="form-label small fw-bold text-muted">Abonos / Crédito a Favor</label>
                                                    <div className="input-group mb-2">
                                                        <span className="input-group-text bg-light">$</span>
                                                        <input 
                                                            type="number" 
                                                            className="form-control" 
                                                            value={tempCredits}
                                                            onChange={(e) => setTempCredits(Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <small className="text-muted">Crédito disponible para futuras compras.</small>
                                                </div>

                                                <div className="mb-4">
                                                    <label className="form-label small fw-bold text-muted">Deuda Pendiente (Fiado)</label>
                                                    <div className="input-group mb-2">
                                                        <span className="input-group-text bg-light">$</span>
                                                        <input 
                                                            type="number" 
                                                            className="form-control" 
                                                            value={tempDebt}
                                                            onChange={(e) => setTempDebt(Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <small className="text-muted text-danger">Monto que el cliente debe a la tienda.</small>
                                                </div>

                                                <div className="form-check form-switch mb-4">
                                                    <input 
                                                        className="form-check-input shadow-none" 
                                                        type="checkbox" 
                                                        id="creditToggle" 
                                                        checked={tempIsCreditEnabled}
                                                        onChange={(e) => setTempIsCreditEnabled(e.target.checked)}
                                                        style={{cursor: 'pointer'}}
                                                    />
                                                    <label className="form-check-label fw-bold text-body ms-2" htmlFor="creditToggle" style={{cursor: 'pointer'}}>
                                                        Permitir Compras a Crédito
                                                    </label>
                                                    <div className="small text-muted">Habilita o deshabilita la opción de "Fiado" para este cliente.</div>
                                                </div>

                                                <button 
                                                    className="btn btn-primary w-100 py-2 fw-bold rounded-pill shadow-sm"
                                                    onClick={handleUpdateSaldos}
                                                    disabled={updatingSaldos}
                                                    style={{backgroundColor: tenant.theme.primaryColor, borderColor: tenant.theme.primaryColor}}
                                                >
                                                    {updatingSaldos ? 'Guardando...' : 'Guardar Cambios'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="card border-0 shadow-sm">
                                            <div className="card-body">
                                                <h6 className="fw-bold mb-3">Información de Contacto</h6>
                                                <div className="d-flex align-items-center mb-2 small">
                                                    <Telephone className="me-2 text-muted"/> {selectedClient.phone}
                                                </div>
                                                <div className="d-flex align-items-center small">
                                                    <ClockHistory className="me-2 text-muted"/> Registrado: {selectedClient.createdAt?.toDate().toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Columna Derecha: Historial de Pedidos */}
                                    <div className="col-lg-8">
                                        <div className="card border-0 shadow-sm h-100">
                                            <div className="card-body">
                                                <h5 className="fw-bold mb-4 d-flex align-items-center">
                                                    <Receipt className="me-2 text-primary"/> Historial de Pedidos
                                                </h5>
                                                
                                                {loadingOrders ? (
                                                    <div className="text-center py-5">
                                                        <div className="spinner-border text-primary" role="status"></div>
                                                        <p className="mt-2 text-muted">Cargando pedidos...</p>
                                                    </div>
                                                ) : clientOrders.length > 0 ? (
                                                    <div className="table-responsive">
                                                        <table className="table table-hover align-middle">
                                                            <thead className="table-light small text-uppercase">
                                                                <tr>
                                                                    <th>ID / Fecha</th>
                                                                    <th>Estado</th>
                                                                    <th>Pago</th>
                                                                    <th className="text-end">Total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {clientOrders.map(order => (
                                                                    <tr key={order.id}>
                                                                        <td>
                                                                            <div className="fw-bold">#{order.id.slice(-6).toUpperCase()}</div>
                                                                            <small className="text-muted">{order.createdAt?.toDate().toLocaleDateString()} {order.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                                                        </td>
                                                                        <td>
                                                                            {getStatusBadge(order.status)}
                                                                        </td>
                                                                        <td>
                                                                            {order.paymentMethod === 'credit' ? (
                                                                                <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill">A Crédito (Fiado)</span>
                                                                            ) : (
                                                                                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill">Pagado</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="text-end fw-bold">
                                                                            {formatCurrency(order.totalAmount)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-5 opacity-50">
                                                        <Receipt size={48} className="mb-2"/>
                                                        <p>Este cliente aún no ha hecho pedidos.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-4">
                                <button type="button" className="btn btn-secondary px-5 fw-bold rounded-pill" onClick={() => setShowDetail(false)}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                .hover-card { transition: transform 0.2s, shadow 0.2s; }
                .hover-card:hover { transform: translateY(-5px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; }
                .small-label { font-size: 0.65rem; letter-spacing: 0.05em; }
            `}</style>
        </div>
    );
};

// Reutilizamos el helper de badges
const getStatusBadge = (status: any) => {
    switch(status) {
        case 'pending': return <span className="badge bg-warning text-dark rounded-pill">Pendiente</span>;
        case 'delivered': return <span className="badge bg-success rounded-pill">Entregado</span>;
        case 'cancelled': return <span className="badge bg-danger rounded-pill">Cancelado</span>;
        default: return <span className="badge bg-info text-dark rounded-pill">{status}</span>;
    }
};

export default AdminClientsPage;
