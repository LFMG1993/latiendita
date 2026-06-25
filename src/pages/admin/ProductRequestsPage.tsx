import { FC, useEffect, useState, useCallback } from 'react';
import { ClipboardCheck, CheckCircle, XCircle, ClockHistory, BuildingFill } from 'react-bootstrap-icons';
import { MasterProductRequest, ApproveProductRequestPayload } from '../../types/masterProduct.types';
import {
    getAllProductRequests,
    approveProductRequest,
    rejectProductRequest,
} from '../../services/admin/masterProductService';
import { useToast } from '../../context/ToastContext';

const STATUS_TABS = [
    { key: '', label: 'Todas' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'approved', label: 'Aprobadas' },
    { key: 'rejected', label: 'Rechazadas' },
];

const CATEGORIES = ['General', 'Alimentos', 'Bebidas', 'Lácteos', 'Limpieza', 'Cuidado Personal', 'Snacks', 'Congelados', 'Papelería', 'Otro'];

const ProductRequestsPage: FC = () => {
    const { showToast } = useToast();
    const [requests, setRequests] = useState<MasterProductRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    const [approveModal, setApproveModal] = useState<MasterProductRequest | null>(null);
    const [rejectModal, setRejectModal] = useState<MasterProductRequest | null>(null);
    const [approveForm, setApproveForm] = useState<ApproveProductRequestPayload>({});
    const [rejectNotes, setRejectNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllProductRequests(activeTab);
            setRequests(data);
        } catch {
            showToast('Error al cargar solicitudes', 'danger');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const openApprove = (req: MasterProductRequest) => {
        setApproveForm({
            name: req.requested_name,
            brand: req.requested_brand || '',
            barcode: req.requested_barcode || '',
            category: req.requested_category || 'General',
            description: req.requested_description || '',
            admin_notes: '',
        });
        setApproveModal(req);
    };

    const handleApprove = async () => {
        if (!approveModal) return;
        setProcessing(true);
        try {
            await approveProductRequest(approveModal.id, approveForm);
            showToast('✅ Solicitud aprobada. Producto añadido al catálogo.', 'success');
            setApproveModal(null);
            fetchRequests();
        } catch (e: any) {
            let errorMsg = e?.message || 'Error al aprobar';
            if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
                errorMsg = '❌ Conflicto: Ya existe un producto con este código de barras en el catálogo maestro. Modifica el código de barras o déjalo vacío para continuar.';
            }
            showToast(errorMsg, 'danger');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        setProcessing(true);
        try {
            await rejectProductRequest(rejectModal.id, rejectNotes);
            showToast('Solicitud rechazada.', 'warning');
            setRejectModal(null);
            setRejectNotes('');
            fetchRequests();
        } catch {
            showToast('Error al rechazar', 'danger');
        } finally {
            setProcessing(false);
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="badge bg-warning text-dark"><ClockHistory size={11} className="me-1" />Pendiente</span>;
            case 'approved': return <span className="badge bg-success"><CheckCircle size={11} className="me-1" />Aprobada</span>;
            case 'rejected': return <span className="badge bg-danger"><XCircle size={11} className="me-1" />Rechazada</span>;
            default: return <span className="badge bg-secondary">{status}</span>;
        }
    };

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="mb-4">
                <h2 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <ClipboardCheck size={24} className="text-warning" />
                    Solicitudes de Nuevos Productos
                    {pendingCount > 0 && <span className="badge bg-danger ms-2">{pendingCount}</span>}
                </h2>
                <p className="text-secondary mb-0 mt-1 small">
                    Los tenderos envían solicitudes cuando no encuentran un producto en el catálogo maestro.
                </p>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4">
                {STATUS_TABS.map(tab => (
                    <li key={tab.key} className="nav-item">
                        <button
                            className={`nav-link fw-semibold ${activeTab === tab.key ? 'active' : 'text-secondary'}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    </li>
                ))}
            </ul>

            {/* Content */}
            {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
            ) : requests.length === 0 ? (
                <div className="text-center py-5">
                    <ClipboardCheck size={48} className="text-muted mb-3 opacity-25" />
                    <p className="text-secondary">No hay solicitudes {activeTab === 'pending' ? 'pendientes' : ''} por ahora.</p>
                </div>
            ) : (
                <div className="row g-3">
                    {requests.map(req => (
                        <div key={req.id} className="col-md-6 col-xl-4">
                            <div className={`card border-0 shadow-sm h-100 ${req.status === 'pending' ? 'border-start border-warning border-3' : ''}`}>
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        {statusBadge(req.status)}
                                        <small className="text-muted">
                                            {req.created_at ? new Date(req.created_at).toLocaleDateString('es-CO') : ''}
                                        </small>
                                    </div>

                                    <h5 className="fw-bold mb-1">{req.requested_name}</h5>
                                    {req.requested_brand && <p className="text-secondary small mb-1">Marca: {req.requested_brand}</p>}
                                    {req.requested_barcode && <p className="font-monospace small text-muted mb-1">📦 {req.requested_barcode}</p>}
                                    {req.requested_category && <span className="badge bg-primary bg-opacity-10 text-primary mb-2">{req.requested_category}</span>}
                                    {req.requested_description && <p className="small text-muted mb-2">{req.requested_description}</p>}

                                    <div className="d-flex align-items-center gap-2 mt-2 text-secondary small">
                                        <BuildingFill size={13} />
                                        <span>{req.shop_name || req.shop_id}</span>
                                    </div>

                                    {req.admin_notes && (
                                        <div className="alert alert-light py-2 px-3 mt-3 mb-0 small">
                                            <strong>Nota admin:</strong> {req.admin_notes}
                                        </div>
                                    )}

                                    {req.status === 'pending' && (
                                        <div className="d-flex gap-2 mt-4">
                                            <button
                                                className="btn btn-success btn-sm rounded-pill flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-1"
                                                onClick={() => openApprove(req)}
                                            >
                                                <CheckCircle size={14} /> Aprobar
                                            </button>
                                            <button
                                                className="btn btn-outline-danger btn-sm rounded-pill flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                                                onClick={() => { setRejectModal(req); setRejectNotes(''); }}
                                            >
                                                <XCircle size={14} /> Rechazar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Aprobar */}
            {approveModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">✅ Aprobar y añadir al catálogo</h5>
                                <button className="btn-close" onClick={() => setApproveModal(null)} />
                            </div>
                            <div className="modal-body">
                                <p className="text-secondary small mb-4">Puedes ajustar los datos antes de añadirlos al catálogo oficial.</p>
                                {[
                                    { key: 'name', label: 'Nombre oficial *' },
                                    { key: 'brand', label: 'Marca' },
                                    { key: 'barcode', label: 'Código de barras' },
                                    { key: 'image_url', label: 'URL de imagen' },
                                ].map(({ key, label }) => (
                                    <div key={key} className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">{label}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={(approveForm as any)[key] || ''}
                                            onChange={e => setApproveForm(f => ({ ...f, [key]: e.target.value }))}
                                        />
                                    </div>
                                ))}
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary">Categoría *</label>
                                    <select
                                        className="form-select"
                                        value={approveForm.category || 'General'}
                                        onChange={e => setApproveForm(f => ({ ...f, category: e.target.value }))}
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary">Nota para el tendero (opcional)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Ej: Nombre estandarizado a nombre oficial de la marca"
                                        value={approveForm.admin_notes || ''}
                                        onChange={e => setApproveForm(f => ({ ...f, admin_notes: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-outline-secondary rounded-pill" onClick={() => setApproveModal(null)}>Cancelar</button>
                                <button className="btn btn-success rounded-pill px-4 fw-bold" onClick={handleApprove} disabled={processing}>
                                    {processing ? <><span className="spinner-border spinner-border-sm me-2" />Procesando...</> : '✅ Confirmar Aprobación'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Rechazar */}
            {rejectModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">❌ Rechazar solicitud</h5>
                                <button className="btn-close" onClick={() => setRejectModal(null)} />
                            </div>
                            <div className="modal-body">
                                <p>¿Rechazar la solicitud de <strong>"{rejectModal.requested_name}"</strong> de la tienda <strong>{rejectModal.shop_name}</strong>?</p>
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary">Motivo (opcional)</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        placeholder="Ej: Producto duplicado, ya existe como 'Coca-Cola 1.5L'..."
                                        value={rejectNotes}
                                        onChange={e => setRejectNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-outline-secondary rounded-pill" onClick={() => setRejectModal(null)}>Cancelar</button>
                                <button className="btn btn-danger rounded-pill px-4 fw-bold" onClick={handleReject} disabled={processing}>
                                    {processing ? <><span className="spinner-border spinner-border-sm me-2" />...</> : 'Rechazar Solicitud'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductRequestsPage;
