import { FC, useEffect, useState, useCallback } from 'react';
import { Search, Plus, PencilSquare, Trash, Tag, Upc } from 'react-bootstrap-icons';
import { MasterProduct, CreateMasterProductPayload } from '../../types/masterProduct.types';
import {
    getAllMasterProducts,
    createMasterProduct,
    updateMasterProduct,
    deleteMasterProduct,
} from '../../services/masterProductService';
import { useToast } from '../../context/ToastContext';

const CATEGORIES = ['General', 'Alimentos', 'Bebidas', 'Lácteos', 'Limpieza', 'Cuidado Personal', 'Snacks', 'Congelados', 'Papelería', 'Otro'];

const emptyForm = (): CreateMasterProductPayload => ({
    name: '', brand: '', barcode: '', description: '', image_url: '', category: 'General',
});

const MasterCatalogPage: FC = () => {
    const { showToast } = useToast();
    const [products, setProducts] = useState<MasterProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQ, setSearchQ] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<MasterProduct | null>(null);
    const [form, setForm] = useState<CreateMasterProductPayload>(emptyForm());
    const [saving, setSaving] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllMasterProducts(searchQ, filterCategory);
            setProducts(data);
        } catch (e) {
            showToast('Error al cargar el catálogo', 'danger');
        } finally {
            setLoading(false);
        }
    }, [searchQ, filterCategory]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const openCreate = () => { setEditing(null); setForm(emptyForm()); setShowModal(true); };
    const openEdit = (p: MasterProduct) => {
        setEditing(p);
        setForm({ name: p.name, brand: p.brand || '', barcode: p.barcode || '', description: p.description || '', image_url: p.image_url || '', category: p.category });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.category) {
            showToast('Nombre y categoría son obligatorios', 'warning');
            return;
        }
        setSaving(true);
        try {
            if (editing) {
                await updateMasterProduct(editing.id, form);
                showToast('Producto actualizado en el catálogo ✓', 'success');
            } else {
                await createMasterProduct(form);
                showToast('Producto añadido al catálogo ✓', 'success');
            }
            setShowModal(false);
            fetchProducts();
        } catch (e: any) {
            showToast(e?.message || 'Error al guardar', 'danger');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (p: MasterProduct) => {
        if (!confirm(`¿Eliminar "${p.name}" del catálogo maestro?\nLas tiendas que tengan este producto perderán la vinculación.`)) return;
        try {
            await deleteMasterProduct(p.id);
            showToast('Producto eliminado del catálogo', 'success');
            fetchProducts();
        } catch {
            showToast('Error al eliminar', 'danger');
        }
    };

    const field = (key: keyof CreateMasterProductPayload, label: string, placeholder = '') => (
        <div className="mb-3">
            <label className="form-label fw-semibold small text-secondary">{label}</label>
            <input
                type="text"
                className="form-control"
                placeholder={placeholder}
                value={(form[key] as string) || ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            />
        </div>
    );

    return (
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-0 d-flex align-items-center gap-2">
                        <Tag size={24} className="text-primary" />
                        Catálogo Maestro de Productos
                    </h2>
                    <p className="text-secondary mb-0 mt-1 small">
                        {products.length} producto{products.length !== 1 ? 's' : ''} en el catálogo global
                    </p>
                </div>
                <button className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4 fw-bold" onClick={openCreate}>
                    <Plus size={20} /> Añadir Producto
                </button>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-3">
                    <div className="row g-2">
                        <div className="col-md-6">
                            <div className="input-group">
                                <span className="input-group-text bg-transparent border-end-0"><Search size={16} /></span>
                                <input
                                    type="text"
                                    className="form-control border-start-0"
                                    placeholder="Buscar por nombre, marca o código de barras..."
                                    value={searchQ}
                                    onChange={e => setSearchQ(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                                <option value="">Todas las categorías</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-5">
                            <Tag size={48} className="text-muted mb-3 opacity-25" />
                            <p className="text-secondary">No hay productos en el catálogo todavía.</p>
                            <button className="btn btn-primary rounded-pill px-4" onClick={openCreate}>Añadir el primero</button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="ps-4">Producto</th>
                                        <th>Marca</th>
                                        <th>Categoría</th>
                                        <th><Upc size={14} className="me-1" />Código de Barras</th>
                                        <th className="text-end pe-4">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p.id}>
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center gap-3">
                                                    {p.image_url ? (
                                                        <img src={p.image_url} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                                                    ) : (
                                                        <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            <Tag size={18} className="text-muted" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="fw-semibold">{p.name}</div>
                                                        {p.description && <div className="small text-muted text-truncate" style={{ maxWidth: 250 }}>{p.description}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-secondary">{p.brand || '—'}</td>
                                            <td><span className="badge bg-primary bg-opacity-10 text-primary">{p.category}</span></td>
                                            <td className="font-monospace small">{p.barcode || '—'}</td>
                                            <td className="text-end pe-4">
                                                <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => openEdit(p)} title="Editar">
                                                    <PencilSquare size={14} />
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p)} title="Eliminar">
                                                    <Trash size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Crear/Editar */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">
                                    {editing ? '✏️ Editar Producto del Catálogo' : '➕ Nuevo Producto al Catálogo'}
                                </h5>
                                <button className="btn-close" onClick={() => setShowModal(false)} />
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        {field('name', 'Nombre oficial del producto *', 'Ej: Coca-Cola 1.5L')}
                                        {field('brand', 'Marca', 'Ej: Coca-Cola')}
                                        {field('barcode', 'Código de barras (EAN/UPC)', 'Ej: 7702001090762')}
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold small text-secondary">Categoría *</label>
                                            <select
                                                className="form-select"
                                                value={form.category}
                                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                            >
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        {field('image_url', 'URL de imagen oficial', 'https://...')}
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold small text-secondary">Descripción</label>
                                            <textarea
                                                className="form-control"
                                                rows={4}
                                                placeholder="Descripción estándar del producto..."
                                                value={form.description || ''}
                                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                            />
                                        </div>
                                        {form.image_url && (
                                            <div className="text-center">
                                                <img src={form.image_url} alt="Preview" className="img-thumbnail" style={{ maxHeight: 120 }} onError={e => (e.currentTarget.style.display = 'none')} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button className="btn btn-primary rounded-pill px-4 fw-bold" onClick={handleSave} disabled={saving}>
                                    {saving ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</> : (editing ? 'Actualizar' : 'Añadir al Catálogo')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterCatalogPage;
