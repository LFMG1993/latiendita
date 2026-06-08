import {FC, useEffect, useState} from 'react';
import {NavLink, Link, useNavigate} from 'react-router-dom';
import {usePermissions} from "../../hooks/usePermissions";
import {navItemsConfig} from "../../config/navConfig.ts";
import {useAuthStore} from "../../store/authStore.ts";
import {getPendingInvitations} from "../../services/teamServices.ts";
import {InvitationData, Heladeria} from "../../types";
import {Envelope, PersonCircle, Moon, Sun, List, Shop, ChevronDown, ChevronRight, 
        CashStack, BoxSeam, GraphUp, GearFill, Tag, ClipboardCheck} from "react-bootstrap-icons";
import {logoutService} from "../../services/logoutService.ts";
import {useTenant} from "../../context/TenantContext";
import {useTheme} from "../../context/ThemeContext";
import "../../style/SmartSidebar.css";

interface SmartSidebarProps {
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
}

const SmartSidebar: FC<SmartSidebarProps> = ({isExpanded, setIsExpanded}) => {
    const {hasPermission} = usePermissions();
    const navigate = useNavigate();
    const {user, iceCreamShops, activeIceCreamShopId, setActiveIceCreamShopId} = useAuthStore();
    const {tenant} = useTenant();
    const {theme, toggleTheme} = useTheme();
    const [pendingInvitations, setPendingInvitations] = useState<InvitationData[]>([]);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
        sales: false,
        inventory: false,
        finance: false,
        settings: false,
        saas: false
    });
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

    const toggleGroup = (category: string) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const categoryConfig = {
        sales: { label: 'Ventas y Operaciones', icon: CashStack },
        inventory: { label: 'Inventario y Productos', icon: BoxSeam },
        finance: { label: 'Finanzas y Análisis', icon: GraphUp },
        settings: { label: 'Configuración', icon: GearFill }
    };

    // Group items by category
    const groupedItems = navItemsConfig
        .filter(item => item.permissionId ? hasPermission(item.permissionId) : true)
        .reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {} as Record<string, typeof navItemsConfig>);

    return (
        <nav
            id="sidebarMenu"
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            className={`smart-sidebar sidebar d-flex flex-column ${isExpanded ? 'sidebar-expanded' : ''}`}
        >
            <div className="d-flex align-items-center justify-content-center py-3 border-bottom border-secondary-subtle">
                <button 
                    className="btn btn-link text-secondary p-0 border-0" 
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? "Colapsar menú" : "Expandir menú"}
                >
                    <List size={28} />
                </button>
                 <span className={`sidebar-text fw-bold ms-2 ${isExpanded ? 'opacity-100' : 'opacity-0'}`} style={{transition: 'opacity 0.2s'}}>
                    Menú
                </span>
            </div>
            <div className="flex-grow-1 overflow-auto pt-2">
                <ul className="nav flex-column mb-auto">
                    {/* Link especial para SuperAdministrador */}
                    {user?.role === 'superAdmin' && (
                        <li className="nav-group mb-3 border-bottom border-secondary-subtle pb-3">
                            <button
                                className="nav-group-header text-warning"
                                onClick={() => toggleGroup('saas')}
                            >
                                <GearFill className="sidebar-icon text-warning" size={20} />
                                <span className="sidebar-text fw-bold">Administración SaaS</span>
                                <span className="sidebar-text ms-auto text-warning">
                                    {collapsedGroups['saas'] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                </span>
                            </button>
                            <ul className={`nav-group-items ${collapsedGroups['saas'] ? 'collapsed' : ''}`}>
                                <li className="nav-item">
                                    <NavLink className="nav-link position-relative text-warning text-opacity-75" to="/super-admin" end>
                                        <Shop className="sidebar-icon text-warning text-opacity-75" size={20}/>
                                        <span className="sidebar-text">Tiendas (SaaS)</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink className="nav-link position-relative text-warning text-opacity-75" to="/super-admin/clients" end>
                                        <PersonCircle className="sidebar-icon text-warning text-opacity-75" size={20}/>
                                        <span className="sidebar-text">Clientes y Facturación</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink className="nav-link position-relative text-warning text-opacity-75" to="/super-admin/catalog" end>
                                        <Tag className="sidebar-icon text-warning text-opacity-75" size={20}/>
                                        <span className="sidebar-text">Catálogo Maestro</span>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink className="nav-link position-relative text-warning text-opacity-75" to="/super-admin/product-requests" end>
                                        <ClipboardCheck className="sidebar-icon text-warning text-opacity-75" size={20}/>
                                        <span className="sidebar-text">Solicitudes de Productos</span>
                                    </NavLink>
                                </li>
                            </ul>
                        </li>
                    )}

                    {Object.entries(categoryConfig).map(([category, config]) => {
                        const items = groupedItems[category] || [];
                        if (items.length === 0) return null;

                        const isCollapsed = collapsedGroups[category];
                        const CategoryIcon = config.icon;

                        return (
                            <li key={category} className="nav-group">
                                <button
                                    className="nav-group-header"
                                    onClick={() => toggleGroup(category)}
                                >
                                    <CategoryIcon className="sidebar-icon" size={20} />
                                    <span className="sidebar-text">{config.label}</span>
                                    <span className="sidebar-text ms-auto">
                                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                    </span>
                                </button>
                                <ul className={`nav-group-items ${isCollapsed ? 'collapsed' : ''}`}>
                                    {items.map(item => {
                                        const isTeamManagement = item.to === '/team-management';
                                        const showBadge = isTeamManagement && isOwner && pendingInvitations.length > 0;

                                        let label = item.label;
                                        if (label === 'Heladerías') {
                                            label = tenant.terminology.shopLabelPlural;
                                        }

                                        return (
                                            <li className="nav-item" key={item.label}>
                                                <NavLink className="nav-link position-relative" to={item.to}>
                                                    <item.Icon className="sidebar-icon" size={20}/>
                                                    <span className="sidebar-text">{label}</span>
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
                            </li>
                        );
                    })}
                    
                    {/* Acceso directo al Catálogo / Menú Público */}
                    {user?.role === 'superAdmin' ? (
                         <li className="nav-item mt-3">
                             <a 
                                 href="/catalogo?mode=master" 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="nav-link position-relative text-warning"
                             >
                                 <Shop className="sidebar-icon text-warning" size={24}/>
                                 <span className="sidebar-text fw-bold">Ver Catálogo Completo</span>
                             </a>
                         </li>
                    ) : (
                        activeIceCreamShopId && (
                             <li className="nav-item mt-3">
                                 <a 
                                     href={`/catalogo?shopId=${activeIceCreamShopId}`} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="nav-link position-relative"
                                 >
                                     <Shop className="sidebar-icon" size={24}/>
                                     <span className="sidebar-text">Ver Mi Menú</span>
                                 </a>
                             </li>
                        )
                    )}
                    
                    {/* Dark Mode Toggle */}
                    <li className="nav-item mt-auto">
                        <button 
                            className="nav-link w-100 text-start border-0 bg-transparent" 
                            onClick={toggleTheme}
                            style={{ cursor: 'pointer' }}
                        >
                            {theme === 'light' ? (
                                <Moon className="sidebar-icon" size={24}/>
                            ) : (
                                <Sun className="sidebar-icon" size={24}/>
                            )}
                            <span className="sidebar-text">
                                {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
                            </span>
                        </button>
                    </li>
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