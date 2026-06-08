import {FC, useEffect, useState} from 'react';
import {Heladeria} from '../../types';
import {CompanyModulesManager} from '../../components/admin/CompanyModulesManager';
import {getAllShops, createShop, approveShop} from '../../services/shopServices';
import {getAllOwners} from '../../services/userServices';
import {UserProfile} from '../../types';
import {useToast} from '../../context/ToastContext';

export const SuperAdminDashboard: FC = () => {
    const [shops, setShops] = useState<Heladeria[]>([]);
    const [owners, setOwners] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedShop, setSelectedShop] = useState<Heladeria | null>(null);
    const [showManager, setShowManager] = useState(false);
    
    // States for creating a shop
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newShopName, setNewShopName] = useState("");
    const [newShopOwner, setNewShopOwner] = useState("");
    const [creatingShop, setCreatingShop] = useState(false);
    
    const {showToast} = useToast();

    const fetchShopsAndOwners = async () => {
        setLoading(true);
        try {
            const [shopsData, ownersData] = await Promise.all([
                getAllShops(),
                getAllOwners()
            ]);
            setShops(shopsData);
            setOwners(ownersData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShopsAndOwners();
    }, []);

    const handleManageModules = (shop: Heladeria) => {
        setSelectedShop(shop);
        setShowManager(true);
    };

    const handleCloseManager = () => {
        setShowManager(false);
        setSelectedShop(null);
    };

    const handleCreateShop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newShopName.trim() || !newShopOwner.trim()) return;
        
        setCreatingShop(true);
        try {
            await createShop({
                name: newShopName,
                owner: newShopOwner,
                address: "Pendiente",
            });
            setShowCreateModal(false);
            setNewShopName("");
            setNewShopOwner("");
            fetchShopsAndOwners();
        } catch (error) {
            console.error("Error creating shop:", error);
            alert("Error al crear la tienda");
        } finally {
            setCreatingShop(false);
        }
    };

    const handleApproveShop = async (shopId: string) => {
        try {
            await approveShop(shopId);
            showToast("Tienda aprobada con éxito", "success");
            fetchShopsAndOwners(); // Refrescar la tabla
        } catch (error: any) {
            console.error("Error approving shop:", error);
            showToast(error.message || "Error al aprobar la tienda", "error");
        }
    };

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="mb-0">Panel de Super Administrador</h1>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <i className="bi bi-plus-circle me-2"></i> Crear Tienda Manualmente
                </button>
            </div>
            
            <div className="card shadow-sm">
                <div className="card-header py-3">
                    <h5 className="mb-0">Empresas Registradas ({shops.length})</h5>
                </div>
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0 align-middle">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Dueño</th>
                                        <th>Estado</th>
                                        <th>Módulos Activos</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shops.map(shop => {
                                        // Contamos cuántos módulos están en false
                                        const disabledCount = Object.values(shop.modules || {}).filter(v => v === false).length;
                                        const statusColor = disabledCount === 0 ? 'success' : 'warning';
                                        
                                        const ownerObj = owners.find(o => o.id === shop.owner);
                                        const ownerName = ownerObj ? `${ownerObj.firstName} ${ownerObj.lastName || ''}`.trim() : shop.owner;
                                        
                                        return (
                                            <tr key={shop.id}>
                                                <td className="fw-bold">{shop.name}</td>
                                                <td className="text-muted small">{ownerName}</td>
                                                <td>
                                                    {shop.status === 'pending' ? (
                                                        <span className="badge bg-warning text-dark">Pendiente</span>
                                                    ) : (
                                                        <span className="badge bg-success">Activa</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`badge bg-${statusColor}`}>
                                                        {disabledCount === 0 ? 'Todos' : 'Personalizado'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        {shop.status === 'pending' && (
                                                            <button 
                                                                className="btn btn-success btn-sm fw-bold"
                                                                onClick={() => handleApproveShop(shop.id)}
                                                            >
                                                                Aprobar
                                                            </button>
                                                        )}
                                                        <button 
                                                            className="btn btn-outline-primary btn-sm"
                                                            onClick={() => handleManageModules(shop)}
                                                        >
                                                            Gestionar Módulos
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <CompanyModulesManager 
                show={showManager} 
                onClose={handleCloseManager} 
                shop={selectedShop} 
                onUpdate={fetchShopsAndOwners} 
            />

            {/* Modal para Crear Tienda */}
            {showCreateModal && (
                <div className="modal show d-block" tabIndex={-1} style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">Nueva Tienda</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleCreateShop}>
                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold">Nombre de la Tienda</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={newShopName} 
                                            onChange={(e) => setNewShopName(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold">Cliente (Dueño)</label>
                                        <select 
                                            className="form-select" 
                                            value={newShopOwner} 
                                            onChange={(e) => setNewShopOwner(e.target.value)} 
                                            required 
                                        >
                                            <option value="">-- Seleccionar Dueño --</option>
                                            {owners.map(owner => (
                                                <option key={owner.id} value={owner.id}>
                                                    {owner.firstName} {owner.lastName} ({owner.email})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="form-text">Solo aparecen usuarios registrados con rol 'owner'.</div>
                                    </div>
                                    <div className="d-grid mt-4">
                                        <button type="submit" className="btn btn-primary py-2" disabled={creatingShop}>
                                            {creatingShop ? "Creando..." : "Crear Tienda"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
