import {useState, FC, PropsWithChildren} from 'react';
import SmartSidebar from './general/SmartSidebar.tsx';
import MobileDock from "./general/MobileDock.tsx";

/**
 * MainLayout proporciona la estructura principal de la aplicación,
 * renderizando el SmartSidebar para escritorio y el MobileDock para móviles.
 * Utiliza PropsWithChildren para una inferencia de tipos robusta para los componentes hijos.
 */
const MainLayout: FC<PropsWithChildren> = ({children}) => {
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    return (
        <>
            {/* --- Navegación para Escritorio --- */}
            <div className="d-none d-md-block">
                <SmartSidebar
                    isExpanded={isSidebarExpanded}
                    setIsExpanded={setIsSidebarExpanded}
                />
            </div>

        {/* --- Navegación para Móviles --- */}
            <MobileDock/>
        {/* El contenido principal que será empujado por el sidebar */}
            <div className={`main-content ${isSidebarExpanded ? 'content-expanded' : 'content-collapsed'}`}>
                {children}
            </div>
        </>
    );
};

export default MainLayout;