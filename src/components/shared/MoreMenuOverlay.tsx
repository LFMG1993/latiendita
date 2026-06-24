import {FC} from "react";
import {NavLink} from "react-router-dom";
import {NavItemConfig} from "../../config/navConfig.ts";

interface MoreMenuOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    items: NavItemConfig[];
}

const MoreMenuOverlay: FC<MoreMenuOverlayProps> = (
    {isOpen, onClose, items}
) => {
    if (!isOpen) {
        return null;
    }

    return (
        <>
            {/* El fondo oscuro que al hacer clic cierra el menú */}
            <div className="mobile-menu-backdrop" onClick={onClose}></div>

            {/* El panel con las opciones */}
            <div className="mobile-menu-panel">
                <hr className="mobile-menu-handle"/>
                <div className="mobile-menu-grid">
                    {items.map(item => (
                        <NavLink key={item.label} to={item.to} className="mobile-menu-item" onClick={onClose}>
                            <div className="mobile-menu-icon-wrapper">
                                <item.Icon size={28}/>
                            </div>
                            <span className="mobile-menu-label">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </div>
        </>
    );
};

export default MoreMenuOverlay;