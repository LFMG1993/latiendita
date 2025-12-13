import {FC, ReactNode, useEffect} from "react";
import {Navigate, useNavigate} from 'react-router-dom';
import {useAuthStore} from '../store/authStore';
import FullScreenLoader from "./general/FullScreenLoader";
import {usePermissions} from "../hooks/usePermissions.ts";

/**
 * Componente de ruta protegida que redirige al login si el usuario no está autenticado.
 * Muestra un cargador de pantalla completa mientras se verifica el estado de autenticación.
 */
interface ProtectedRouteProps {
    children: ReactNode;
    requiredPermission?: string; // Permiso opcional
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({children, requiredPermission}) => {
    const {isAuthenticated, user, loading} = useAuthStore();
    const {hasPermission} = usePermissions();
    const navigate = useNavigate();

    useEffect(() => {
        // Se ejecuta después del renderizado inicial para evitar cambios de estado durante el render.
        if (!loading && isAuthenticated && requiredPermission && !hasPermission(requiredPermission)) {
            // Usamos un timeout para que el usuario pueda ver el mensaje antes de la redirección.
            setTimeout(() => {
                alert('No tienes permiso para acceder a esta sección. Serás redirigido a tu página principal.');
                const redirectTo = user?.role === 'employee' ? '/cash-session' : '/dashboard';
                navigate(redirectTo, {replace: true});
            }, 100);
        }
    }, [loading, isAuthenticated, requiredPermission, hasPermission, navigate, user]);

    if (loading) {
        return <FullScreenLoader/>;
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }

    // Si se requiere un permiso y el usuario no lo tiene, muestra una página de acceso denegado.
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <FullScreenLoader/>;
    }

    return <>{children}</>;
}

export default ProtectedRoute;