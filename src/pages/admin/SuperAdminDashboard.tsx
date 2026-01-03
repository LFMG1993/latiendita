import {FC, useEffect, useState} from 'react';
import {collection, getDocs, query} from 'firebase/firestore';
import {db} from '../../firebase';
import {Heladeria} from '../../types';
import {CompanyModulesManager} from '../../components/admin/CompanyModulesManager';

export const SuperAdminDashboard: FC = () => {
    const [shops, setShops] = useState<Heladeria[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedShop, setSelectedShop] = useState<Heladeria | null>(null);
    const [showManager, setShowManager] = useState(false);

    const fetchShops = async () => {
        setLoading(true);
        try {
            const shopsRef = collection(db, 'iceCreamShops');
            // Ordenar por fecha de creación si es posible, sino por nombre
            const q = query(shopsRef); 
            const snapshot = await getDocs(q);
            const shopsData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})) as Heladeria[];
            setShops(shopsData);
        } catch (error) {
            console.error("Error fetching shops:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShops();
    }, []);

    const handleManageModules = (shop: Heladeria) => {
        setSelectedShop(shop);
        setShowManager(true);
    };

    const handleCloseManager = () => {
        setShowManager(false);
        setSelectedShop(null);
    };

    return (
        <div className="container-fluid p-4">
            <h1 className="mb-4">Panel de Super Administrador</h1>
            
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
                                        <th>Dueño (ID)</th>
                                        <th>Módulos Activos</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shops.map(shop => {
                                        // Contamos cuántos módulos están en false
                                        const disabledCount = Object.values(shop.modules || {}).filter(v => v === false).length;
                                        const statusColor = disabledCount === 0 ? 'success' : 'warning';
                                        
                                        return (
                                            <tr key={shop.id}>
                                                <td className="fw-bold">{shop.name}</td>
                                                <td className="text-muted small">{shop.owner}</td>
                                                <td>
                                                    <span className={`badge bg-${statusColor}`}>
                                                        {disabledCount === 0 ? 'Todos' : 'Personalizado'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button 
                                                        className="btn btn-outline-primary btn-sm"
                                                        onClick={() => handleManageModules(shop)}
                                                    >
                                                        Gestionar Módulos
                                                    </button>
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
                onUpdate={fetchShops} 
            />
        </div>
    );
};
