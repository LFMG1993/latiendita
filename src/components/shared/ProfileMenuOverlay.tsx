import {FC} from "react";
import {Link} from "react-router-dom";
import {AuthStoreState, Shop} from "../../types";
import {PersonCircle, Moon, Sun} from "react-bootstrap-icons";
import {useTheme} from "../../context/ThemeContext";

interface ProfileMenuOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    user: AuthStoreState['user'] | null;
    activeShopName?: string;
    shops?: Shop[] | null;
    onLogout: () => void;
    onShopChange: (shop: Shop) => void;
}

const ProfileMenuOverlay: FC<ProfileMenuOverlayProps> = (
    {isOpen, onClose, user, activeShopName, shops, onLogout, onShopChange}
) => {
    const {theme, toggleTheme} = useTheme();

    if (!isOpen) return null;

    return (
        <>
            <div className="mobile-menu-backdrop" onClick={onClose}></div>
            <div className="mobile-menu-panel">
                <hr className="mobile-menu-handle"/>
                <div className="mobile-menu-profile-header">
                    {user?.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt="Foto de perfil"
                            className="rounded-circle"
                            style={{width: '40px', height: '40px', objectFit: 'cover'}}
                        />
                    ) : (
                        <PersonCircle size={40} className="text-muted"/>
                    )}
                    <div className="mobile-menu-profile-info">
                        <strong>{user?.firstName || 'Usuario'}</strong>
                        <small className="text-muted">{activeShopName || 'Sin heladería'}</small>
                    </div>
                </div>

                {shops && shops.length > 1 && (
                    <div className="mobile-menu-shop-selector">
                        <label className="form-label small">Cambiar de heladería</label>
                        <select
                            className="form-select"
                            value={shops.find(h => h.name === activeShopName)?.id || ''}
                            onChange={(e) => onShopChange(shops.find(h => h.id === e.target.value)!)}
                        >
                            {shops.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                    </div>
                )}
                <hr/>
                <div className="d-grid gap-2">
                    <button className="btn btn-outline-secondary d-flex align-items-center justify-content-center" onClick={toggleTheme}>
                        {theme === 'light' ? <Moon className="me-2"/> : <Sun className="me-2"/>}
                        {theme === 'light' ? 'Activar Modo Oscuro' : 'Activar Modo Claro'}
                    </button>
                    <Link to="/profile" className="btn btn-outline-secondary" onClick={onClose}>Ir a Mi Perfil</Link>
                    <button className="btn btn-danger" onClick={onLogout}>Cerrar Sesión</button>
                </div>
            </div>
        </>
    );
};

export default ProfileMenuOverlay;