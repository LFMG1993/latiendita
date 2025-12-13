import {FC} from 'react';
import { useLocation, Link } from 'react-router-dom';
import { translatePath } from '../../utils/pathTranslator';

const Breadcrumbs: FC = () => {
    const location = useLocation();
    // Dividimos la ruta y filtramos cualquier valor vacío (que suele ser el primero)
    const pathnames = location.pathname.split('/').filter(Boolean);

    // Si no estamos en una sub-ruta, no mostramos nada.
    if (pathnames.length === 0) {
        return null;
    }

    return (
        <nav aria-label="breadcrumb" className="mb-3">
            <ol className="breadcrumb bg-light rounded-3 py-2 px-3">
                {/* Siempre añadimos un enlace al DashboardPage principal */}
                <li className="breadcrumb-item">
                    <Link to="/dashboard">Dashboard</Link>
                </li>
                {pathnames.map((value, index) => {
                    const isLast = index === pathnames.length - 1;
                    // Construimos la ruta acumulada para el enlace
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const displayName = translatePath(value);

                    return isLast ? (
                        <li key={to} className="breadcrumb-item active" aria-current="page">
                            {displayName}
                        </li>
                    ) : (
                        <li key={to} className="breadcrumb-item">
                            <Link to={to}>{displayName}</Link>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;