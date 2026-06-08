import React, { FC, useEffect, useState } from 'react';
import { UserProfile } from '../../types';
import { getAllOwners } from '../../services/userServices';
import { SaasClientDetailsModal } from '../../components/admin/SaasClientDetailsModal';

export const SaasClientsPage: FC = () => {
    const [clients, setClients] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const owners = await getAllOwners();
                setClients(owners);
            } catch (error) {
                console.error("Error fetching SaaS clients:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    const handleViewDetails = (client: UserProfile) => {
        setSelectedClient(client);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedClient(null);
    };

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="mb-0">Clientes y Facturación SaaS</h1>
            </div>

            <div className="card shadow-sm border-secondary-subtle">
                <div className="card-header py-3 border-bottom-0">
                    <h5 className="mb-0 fw-bold">Dueños Registrados ({clients.length})</h5>
                </div>
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                    ) : clients.length === 0 ? (
                        <div className="text-center p-5 text-muted">
                            <p>No hay clientes registrados.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0 align-middle">
                                <thead className="border-bottom">
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Contacto</th>
                                        <th>Estado (Mock)</th>
                                        <th>Plan (Mock)</th>
                                        <th className="text-end">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map(client => (
                                        <tr key={client.id} onClick={() => handleViewDetails(client)} style={{cursor: 'pointer'}}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px', fontWeight: 'bold'}}>
                                                        {(client.firstName || '').charAt(0)}{(client.lastName || '').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">{client.firstName || 'Usuario'} {client.lastName || ''}</div>
                                                        <div className="small text-muted">ID: {client.id ? client.id.substring(0,8) : 'N/A'}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div>{client.email}</div>
                                                <div className="small text-muted">{client.phone || 'Sin teléfono'}</div>
                                            </td>
                                            <td>
                                                <span className="badge bg-success bg-opacity-10 text-success border border-success">
                                                    Activo
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge bg-secondary">
                                                    Básico
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <button 
                                                    className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetails(client);
                                                    }}
                                                >
                                                    Ver Detalles
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

            <SaasClientDetailsModal 
                show={showModal} 
                onClose={handleCloseModal} 
                client={selectedClient} 
            />
        </div>
    );
};
