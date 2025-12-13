import {FC, useMemo, useState} from 'react';
import {NavLink, useNavigate} from "react-router-dom";
import {usePermissions} from "../../hooks/usePermissions.ts";
import {navItemsConfig} from "../../config/navConfig.ts";
import {ThreeDots, PersonCircle} from "react-bootstrap-icons";
import MoreMenuOverlay from "./MoreMenuOverlay.tsx";
import {useAuthStore} from "../../store/authStore.ts";
import {logoutService} from "../../services/logoutService.ts";
import {Heladeria} from "../../types";
import ProfileMenuOverlay from "./ProfileMenuOverlay.tsx";

const MobileDock: FC = () => {
    const {hasPermission} = usePermissions();
    const navigate = useNavigate();
    const {user, iceCreamShops, activeIceCreamShopId, setActiveIceCreamShopId} = useAuthStore();
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const activeHeladeriaName = iceCreamShops?.find(h => h.id === activeIceCreamShopId)?.name;
    // Filtramos los items una sola vez para optimizar
    const {primaryItems, secondaryItems} = useMemo(() => {
        const accessibleItems = navItemsConfig.filter(item => item.permissionId ? hasPermission(item.permissionId) : true);
        return {
            primaryItems: accessibleItems.filter(item => item.isMobilePrimary),
            secondaryItems: accessibleItems.filter(item => !item.isMobilePrimary),
        };
    }, [hasPermission]);

    // Dividimos los items primarios para colocar el perfil en medio
    const firstPrimary = primaryItems.slice(0, 2);
    const secondPrimary = primaryItems.slice(2, 3); // Solo tomamos el 3er item

    const handleLogout = async () => {
        setIsProfileMenuOpen(false); // Cerramos el menú primero
        await logoutService();
        navigate('/login', {replace: true});
    };

    const handleHeladeriaChange = (heladeria: Heladeria) => {
        setActiveIceCreamShopId(heladeria.id);
    };

    return (
        <>
            <nav className="mobile-dock">
                {firstPrimary.map(item => (
                    <NavLink key={item.label} to={item.to} className="dock-item">
                        <item.Icon size={24}/>
                        <span className="dock-item-label">{item.label}</span>
                    </NavLink>
                ))}

                {/* Botón de Perfil Central */}
                <button className="dock-item" onClick={() => setIsProfileMenuOpen(true)}>
                    <PersonCircle size={24}/>
                    <span className="dock-item-label">Perfil</span>
                </button>

                {/* Siguiente icono primario (Reportes) */}
                {secondPrimary.map(item => (
                    <NavLink key={item.label} to={item.to} className="dock-item">
                        <item.Icon size={24}/>
                        <span className="dock-item-label">{item.label}</span>
                    </NavLink>
                ))}

                {/* Botón para abrir el menú de "Más" */}
                {secondaryItems.length > 0 && (
                    <button className="dock-item" onClick={() => setIsMoreMenuOpen(true)}>
                        <ThreeDots size={24}/>
                        <span className="dock-item-label">Más</span>
                    </button>
                )}
            </nav>

            {/* El panel deslizable que se renderiza cuando es necesario */}
            <MoreMenuOverlay
                isOpen={isMoreMenuOpen}
                onClose={() => setIsMoreMenuOpen(false)}
                items={secondaryItems}
            />

            {/* Panel para el menú "Perfil" */}
            <ProfileMenuOverlay
                isOpen={isProfileMenuOpen}
                onClose={() => setIsProfileMenuOpen(false)}
                user={user}
                activeHeladeriaName={activeHeladeriaName}
                iceCreamShops={iceCreamShops}
                onLogout={handleLogout}
                onHeladeriaChange={handleHeladeriaChange}
            />
        </>
    );
};

export default MobileDock;