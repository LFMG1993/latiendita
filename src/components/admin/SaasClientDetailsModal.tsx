import { FC, useState, useEffect } from 'react';
import { UserProfile, Shop } from '../../types';
import { getShopsByUserId } from "../../services/shop/tenantUserServices";
import { approveShop } from "../../services/admin/adminShopServices";
import { useToast } from '../../context/ToastContext';

interface SaasClientDetailsModalProps {
    show: boolean;
    onClose: () => void;
    client: UserProfile | null;
}

export const SaasClientDetailsModal: FC<SaasClientDetailsModalProps> = ({ show, onClose, client }) => {
    const [activeTab, setActiveTab] = useState<'perfil' | 'tiendas' | 'pagos'>('perfil');
    const [shops, setShops] = useState<Shop[]>([]);
    const [loadingShops, setLoadingShops] = useState(false);
    const { showToast } = useToast();

    const fetchShops = async () => {
        setLoadingShops(true);
        try {
            const data = await getShopsByUserId(client!.id);
            setShops(data);
        } catch (err) {
            console.error("Error fetching client shops:", err);
            showToast("Error al cargar las tiendas del cliente", "error");
        } finally {
            setLoadingShops(false);
        }
    };

    useEffect(() => {
        if (show && client && activeTab === 'tiendas') {
            fetchShops();
        }
    }, [show, client, activeTab]);

    const handleApproveShop = async (shopId: string) => {
        try {
            await approveShop(shopId);
            showToast("Tienda aprobada con éxito", "success");
            fetchShops(); // Recargar la lista
        } catch (err: any) {
            showToast(err.message || "Error al aprobar la tienda", "error");
        }
    };

    // Reset tab when client changes
    useEffect(() => {
        if (show) setActiveTab('perfil');
    }, [show, client]);

    if (!show || !client) return null;

    return (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header border-bottom-0 pb-0">
                        <div>
                            <h4 className="modal-title fw-bold mb-1">
                                {client.firstName} {client.lastName}
                            </h4>
                            <div className="text-muted small">
                                <i className="bi bi-envelope me-1"></i> {client.email}
                                <span className="mx-2">|</span>
                                <i className="bi bi-telephone me-1"></i> {client.phone || 'N/A'}
                            </div>
                        </div>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body p-0">
                        {/* Tabs Navigation */}
                        <ul className="nav nav-tabs px-4 pt-3 border-bottom-0">
                            <li className="nav-item">
                                <button
                                    className={`nav-link fw-bold ${activeTab === 'perfil' ? 'active border-bottom-0' : 'text-muted border-transparent'}`}
                                    onClick={() => setActiveTab('perfil')}
                                >
                                    Perfil del Cliente
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link fw-bold ${activeTab === 'tiendas' ? 'active border-bottom-0' : 'text-muted border-transparent'}`}
                                    onClick={() => setActiveTab('tiendas')}
                                >
                                    Tiendas ({activeTab === 'tiendas' ? shops.length : '...'})
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link fw-bold ${activeTab === 'pagos' ? 'active border-bottom-0' : 'text-muted border-transparent'}`}
                                    onClick={() => setActiveTab('pagos')}
                                >
                                    Planes y Pagos (SaaS)
                                </button>
                            </li>
                        </ul>

                        <div className="p-4" style={{ minHeight: '300px' }}>
                            {activeTab === 'perfil' && (
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <div className="card h-100 shadow-sm border-secondary-subtle">
                                            <div className="card-body">
                                                <h6 className="opacity-75 fw-bold text-uppercase mb-3" style={{ fontSize: '0.8rem' }}>Datos de Contacto</h6>
                                                <p className="mb-2"><strong>ID Sistema:</strong> {client.id}</p>
                                                <p className="mb-2"><strong>Documento:</strong> {client.identify} {client.documentId || 'No registrado'}</p>
                                                <p className="mb-2"><strong>Teléfono:</strong> {client.phone || 'No registrado'}</p>
                                                <p className="mb-0"><strong>Fecha de Registro:</strong> {new Date(client.createdAt || Date.now()).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card h-100 shadow-sm border-0 bg-primary text-white">
                                            <div className="card-body d-flex flex-column justify-content-center text-center">
                                                <h5 className="fw-bold mb-3">Valor del Cliente (LTV)</h5>
                                                <h2 className="display-5 fw-bold mb-0">$0.00</h2>
                                                <p className="opacity-75 small mt-2">Métricas simuladas hasta integrar módulo de pagos</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tiendas' && (
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold mb-0">Tiendas Asociadas a la Cuenta</h6>
                                    </div>

                                    {loadingShops ? (
                                        <div className="text-center py-4 text-muted">Cargando tiendas...</div>
                                    ) : shops.length === 0 ? (
                                        <div className="alert alert-secondary border text-center opacity-75">
                                            Este usuario no tiene tiendas creadas.
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-sm table-hover align-middle">
                                                <thead className="border-bottom">
                                                    <tr>
                                                        <th>Nombre de Tienda</th>
                                                        <th>Dirección</th>
                                                        <th>Estado</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {shops.map(shop => (
                                                        <tr key={shop.id}>
                                                            <td className="fw-bold">{shop.name}</td>
                                                            <td className="small text-muted">{shop.address || '-'}</td>
                                                            <td>
                                                                {shop.status === 'pending' ? (
                                                                    <span className="badge bg-warning text-dark">Pendiente</span>
                                                                ) : (
                                                                    <span className="badge bg-success">Activa</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {shop.status === 'pending' && (
                                                                    <button
                                                                        className="btn btn-sm btn-outline-success fw-bold"
                                                                        onClick={() => handleApproveShop(shop.id)}
                                                                    >
                                                                        Aprobar
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'pagos' && (
                                <div>
                                    <div className="alert alert-info border-0 shadow-sm mb-4">
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-info-circle-fill fs-4 me-3"></i>
                                            <div>
                                                <strong>Módulo en Construcción</strong><br />
                                                <span className="small">Esta sección es un prototipo visual. Las funciones de facturación SaaS se conectarán en la siguiente fase de desarrollo.</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-7">
                                            <div className="card border-0 shadow-sm mb-3">
                                                <div className="card-header border-bottom-0 pt-3 fw-bold bg-transparent">Suscripción Actual</div>
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <div>
                                                            <span className="badge bg-success bg-opacity-10 text-success border border-success mb-2">Plan Activo</span>
                                                            <h5 className="fw-bold">Licencia BÁSICA Anual</h5>
                                                            <p className="text-muted small mb-0">Renovación automática: 12 Nov, 2027</p>
                                                        </div>
                                                        <div className="text-end">
                                                            <h4 className="fw-bold text-primary mb-0">$25.00 <span className="fs-6 text-muted">/ mes</span></h4>
                                                        </div>
                                                    </div>
                                                    <div className="d-grid gap-2 d-md-flex justify-content-md-start">
                                                        <button className="btn btn-sm btn-outline-primary fw-bold" disabled>Registrar Pago Manual</button>
                                                        <button className="btn btn-sm btn-outline-secondary fw-bold" disabled>Cambiar Plan</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-5">
                                            <div className="card border-0 shadow-sm h-100">
                                                <div className="card-header border-bottom-0 pt-3 fw-bold bg-transparent">Historial de Pagos</div>
                                                <div className="card-body p-0">
                                                    <ul className="list-group list-group-flush">
                                                        <li className="list-group-item d-flex justify-content-between align-items-center px-3 py-2">
                                                            <div>
                                                                <div className="fw-bold small">Nov 2026</div>
                                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Suscripción Básico</div>
                                                            </div>
                                                            <span className="badge bg-success bg-opacity-10 text-success rounded-pill">$25.00</span>
                                                        </li>
                                                        <li className="list-group-item px-3 py-3 text-center">
                                                            <button className="btn btn-link btn-sm text-decoration-none disabled">Ver Todo el Historial</button>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
