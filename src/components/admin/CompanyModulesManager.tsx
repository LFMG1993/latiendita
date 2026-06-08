import {FC, useState} from 'react';
import {Heladeria} from "../../types";
import {updateShop} from "../../services/shopServices"; 
import {navItemsConfig} from "../../config/navConfig";

interface CompanyModulesManagerProps {
    show: boolean;
    onClose: () => void;
    shop: Heladeria | null;
    onUpdate: () => void;
}

export const CompanyModulesManager: FC<CompanyModulesManagerProps> = ({show, onClose, shop, onUpdate}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedModule, setExpandedModule] = useState<string | null>(null);

    // Agrupar items por categoría
    const modulesMap: Record<string, typeof navItemsConfig> = {};
    navItemsConfig.forEach(item => {
        if (!modulesMap[item.category]) {
            modulesMap[item.category] = [];
        }
        modulesMap[item.category].push(item);
    });
    
    const availableModules = Object.keys(modulesMap);

    const handleToggleModule = async (moduleName: string, currentlyEnabled: boolean) => {
        if (!shop) return;
        setLoading(true);
        setError(null);

        try {
            const currentModules = shop.modules || {};
            const newModules = {
                ...currentModules,
                [moduleName]: !currentlyEnabled
            };

            await updateShop(shop.id, {modules: newModules});
            onUpdate();
        } catch (err: any) {
            console.error("Error updating modules:", err);
            setError("No se pudo actualizar el módulo.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFeature = async (permissionId: string | undefined, currentlyEnabled: boolean) => {
        if (!shop || !permissionId) return;
        setLoading(true);
        setError(null);

        try {
            const currentFeatures = shop.features || {};
            const newFeatures = {
                ...currentFeatures,
                [permissionId]: !currentlyEnabled
            };

            await updateShop(shop.id, {features: newFeatures});
            onUpdate();
        } catch (err: any) {
            console.error("Error updating feature:", err);
            setError("No se pudo actualizar la funcionalidad.");
        } finally {
            setLoading(false);
        }
    };

    if (!show || !shop) return null;

    return (
        <div className="modal fade show d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Gestionar Módulos: {shop.name}</h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        {error && <div className="alert alert-danger">{error}</div>}
                        
                        <p className="text-muted small mb-4">
                            Gestione el acceso global a módulos o afine los permisos desactivando funcionalidades específicas.
                        </p>

                        <div className="accordion" id="modulesAccordion">
                            {availableModules.map((moduleName) => {
                                const isModuleEnabled = shop.modules?.[moduleName] !== false;
                                const isExpanded = expandedModule === moduleName;
                                const moduleItems = modulesMap[moduleName];

                                return (
                                    <div key={moduleName} className="accordion-item mb-2 border rounded overflow-hidden">
                                        <div className="accordion-header d-flex align-items-center justify-content-between p-3 bg-light-subtle">
                                           <button 
                                                className={`btn btn-link text-decoration-none text-start flex-grow-1 p-0 ${!isModuleEnabled ? 'text-muted' : 'text-primary fw-bold'}`}
                                                type="button"
                                                onClick={() => setExpandedModule(isExpanded ? null : moduleName)}
                                            >
                                                <div className="d-flex align-items-center gap-2">
                                                    <span style={{transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s'}}>
                                                        ▼
                                                    </span>
                                                    <span className="text-capitalize fs-5">
                                                        {moduleName}
                                                        {!isModuleEnabled && <span className="badge bg-secondary ms-2" style={{fontSize: '0.6em'}}>Inactivo</span>}
                                                    </span>
                                                </div>
                                           </button>
                                           
                                            <div className="form-check form-switch ms-3">
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    role="switch" 
                                                    id={`module-switch-${moduleName}`}
                                                    checked={isModuleEnabled}
                                                    disabled={loading}
                                                    onChange={() => handleToggleModule(moduleName, isModuleEnabled)}
                                                />
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="accordion-collapse collapse show">
                                                <div className="accordion-body p-0">
                                                    {!isModuleEnabled && (
                                                        <div className="alert alert-warning m-3 py-2 small">
                                                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                                            El módulo completo está desactivado. Ninguna sub-función será accesible.
                                                        </div>
                                                    )}
                                                    
                                                    <ul className="list-group list-group-flush">
                                                        {moduleItems.map(item => {
                                                            if (!item.permissionId) return null;
                                                            
                                                            // Check feature status (default true if undefined)
                                                            const isFeatureEnabled = shop.features?.[item.permissionId] !== false;
                                                            // Also visually disable if parent module is off
                                                            const isEffective = isModuleEnabled && isFeatureEnabled;

                                                            return (
                                                                <li key={item.to} className="list-group-item d-flex justify-content-between align-items-center ps-4 py-3">
                                                                    <div className={!isEffective ? 'text-muted text-decoration-line-through' : ''}>
                                                                        <div className="fw-medium">{item.label}</div>
                                                                        <small className="text-body-secondary fst-italic" style={{fontSize: '0.75rem'}}>
                                                                            Permiso: <code>{item.permissionId}</code>
                                                                        </small>
                                                                    </div>
                                                                    <div className="form-check form-switch">
                                                                        <input 
                                                                            className="form-check-input" 
                                                                            type="checkbox" 
                                                                            role="switch" 
                                                                            checked={isFeatureEnabled}
                                                                            disabled={loading || !isModuleEnabled}
                                                                            onChange={() => handleToggleFeature(item.permissionId, isFeatureEnabled)}
                                                                        />
                                                                    </div>
                                                                </li>
                                                            )
                                                        })}
                                                        {moduleItems.every(i => !i.permissionId) && (
                                                            <li className="list-group-item text-muted small fst-italic p-3">
                                                                Este módulo no tiene sub-funciones configurables individualmente.
                                                            </li>
                                                        )}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
