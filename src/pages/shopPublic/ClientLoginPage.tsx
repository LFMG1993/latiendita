import {useState, FC, FormEvent} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import { loginUser } from "../../services/shared/authServices";
import {useAuthStore} from '../../store/authStore.ts';
import '../../style/Login.css';
import { useTenant } from '../../context/TenantContext';

const ClientLoginPage: FC = () => {
    const [documentId, setDocumentId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const { tenant } = useTenant();
    const { setAuthUser } = useAuthStore();
    const navigate = useNavigate();

    const redirectUrl = searchParams.get('redirect') || '/client/dashboard';

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Iniciar sesión con documento de identidad + contraseña en el backend de Go
            const userData = await loginUser(documentId, password);
            
            // Actualizamos la sesión en el store
            setAuthUser(userData);
            
            // Navegar a la página de redirección
            navigate(redirectUrl, { replace: true });
        } catch (err: any) {
            console.error("Error en el login:", err);
            setError(err.message || 'Contraseña incorrecta. Inténtalo de nuevo.');
            setLoading(false);
        }
    };

    return (
        <div className="login-container bg-body-tertiary">
            <div className="card shadow border-0 rounded-4 overflow-hidden" style={{maxWidth: '450px', width: '100%'}}>
                <div className="card-body p-5">
                    <div className="text-center mb-4">
                        <h3 className="fw-bold mb-1">¡Bienvenido!</h3>
                        <p className="text-secondary small">
                            Inicia sesión en <strong>{tenant.terminology.shopLabel}</strong>
                        </p>
                    </div>

                    {error && <div className="alert alert-danger py-2 small">{error}</div>}

                    <form onSubmit={handleLogin}>
                        <div className="form-floating mb-3">
                            <input
                                type="text"
                                className="form-control"
                                id="documentId"
                                placeholder="Número de cédula"
                                value={documentId}
                                onChange={(e) => setDocumentId(e.target.value)}
                                required
                            />
                            <label htmlFor="documentId">🗒️ Documento de Identidad</label>
                        </div>
                        <div className="form-floating mb-4">
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <label htmlFor="password">Contraseña</label>
                        </div>

                        <div className="d-grid mb-3">
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg fw-bold"
                                disabled={loading}
                                style={{backgroundColor: tenant.theme.primaryColor, borderColor: tenant.theme.primaryColor}}
                            >
                                {loading ? (
                                    <><span className="spinner-border spinner-border-sm me-2" role="status"/>Buscando...</>
                                ) : 'Iniciar Sesión'}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-4">
                        <p className="small text-secondary mb-0">¿Primera vez aquí?</p>
                        <Link
                            to={`/client-register?redirect=${encodeURIComponent(redirectUrl)}`}
                            className="fw-bold text-decoration-none"
                            style={{color: tenant.theme.primaryColor}}
                        >
                            Crear una cuenta de cliente
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientLoginPage;
