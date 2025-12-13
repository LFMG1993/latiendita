import {FC, useEffect, useState} from 'react';
import {NavLink, Link, useNavigate} from 'react-router-dom';
import {usePermissions} from "../../hooks/usePermissions";
import {navItemsConfig} from "../../config/navConfig.ts";
import {useAuthStore} from "../../store/authStore.ts";
import {getPendingInvitations} from "../../services/teamServices.ts";
import {InvitationData, Heladeria} from "../../types";
import {Envelope, PersonCircle} from "react-bootstrap-icons";
import {logoutService} from "../../services/logoutService.ts";

interface SmartSidebarProps {
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
}

const SmartSidebar: FC<SmartSidebarProps> = ({isExpanded, setIsExpanded}) => {
    const {hasPermission} = usePermissions();
    const navigate = useNavigate();
    const {user, iceCreamShops, activeIceCreamShopId, setActiveIceCreamShopId} = useAuthStore();
    const [pendingInvitations, setPendingInvitations] = useState<InvitationData[]>([]);
    const isOwner = user?.role === 'owner';

    const activeHeladeriaName = iceCreamShops?.find(h => h.id === activeIceCreamShopId)?.name;

    // Cargar invitaciones pendientes para el notificador
    useEffect(() => {
        if (activeIceCreamShopId && isOwner) {
            getPendingInvitations(activeIceCreamShopId)
                .then(setPendingInvitations)
                .catch(err => {
                    console.error("Error al cargar invitaciones pendientes:", err);
                    setPendingInvitations([]);
                });
        } else {
            setPendingInvitations([]);
        }
    }, [activeIceCreamShopId, isOwner]);

    const handleLogout = async () => {
        await logoutService();
        navigate('/login', {replace: true});
    };

    const handleHeladeriaChange = (heladeria: Heladeria) => {
        setActiveIceCreamShopId(heladeria.id);
    };

    return (
        <nav
            id="sidebarMenu"
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            className={`smart-sidebar d-md-block bg-light sidebar d-flex flex-column ${isExpanded ? 'sidebar-expanded' : ''}`}
        >
            <div className="flex-grow-1 overflow-auto pt-3">
                <ul className="nav flex-column mb-auto">
                    {navItemsConfig
                        .filter(item => item.permissionId ? hasPermission(item.permissionId) : true)
                        .map(item => {
                            const isTeamManagement = item.to === '/team-management';
                            const showBadge = isTeamManagement && isOwner && pendingInvitations.length > 0;

                            return (
                                <li className="nav-item" key={item.label}>
                                    <NavLink className="nav-link position-relative" to={item.to}>
                                        <item.Icon className="sidebar-icon" size={24}/>
                                        <span className="sidebar-text">{item.label}</span>
                                        {showBadge && (
                                            <span
                                                className="badge rounded-pill bg-danger position-absolute top-50 translate-middle-y"
                                                style={{
                                                    right: isExpanded ? '1rem' : '-1.5rem',
                                                    transition: 'right 0.2s ease-in-out'
                                                }}>
                                                 {pendingInvitations.length}
                                                <Envelope className="ms-1"/>
                                             </span>
                                        )}
                                    </NavLink>
                                </li>
                            );
                        })}
                </ul>
            </div>
            {/* Menú de usuario y heladería en la parte inferior */}
            <div className="sidebar-footer dropdown p-2 border-top">
                <a href="#" className="nav-link dropdown-toggle"
                   data-bs-toggle="dropdown" aria-expanded="false">
                    {user?.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt="Foto de perfil"
                            className="sidebar-icon rounded-circle"
                            style={{width: '24px', height: '24px', objectFit: 'cover'}}
                        />
                    ) : (
                        <PersonCircle className="sidebar-icon" size={24}/>
                    )}
                    {/* 2. Usamos la misma estructura para el texto animado */}
                    <div className="sidebar-text d-flex flex-column">
                        <strong className="lh-sm">{user?.firstName || 'Usuario'}</strong>
                        <small className="text-muted lh-sm">{activeHeladeriaName || 'Sin heladería'}</small>
                    </div>
                </a>
                <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end w-100">
                    {iceCreamShops && iceCreamShops.length > 1 && (
                        iceCreamShops.map(h => <li key={h.id}>
                            <button className="dropdown-item" type="button"
                                    onClick={() => handleHeladeriaChange(h)}>{h.name}</button>
                        </li>)
                    )}
                    {iceCreamShops && iceCreamShops.length > 1 && <li>
                        <hr className="dropdown-divider"/>
                    </li>}
                    <li><Link className="dropdown-item" to="/profile">Mi Perfil</Link></li>
                    <li><a className="dropdown-item" href="#" onClick={handleLogout}>Cerrar Sesión</a></li>
                </ul>
            </div>
        </nav>
    );
};

export default SmartSidebar;