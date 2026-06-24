import {useState, FC, FormEvent, ChangeEvent, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { loginUser, logoutUser } from "../../services/shared/authServices";
import { getShopsByUserId } from "../../services/shop/tenantUserServices";
import {useAuthStore} from '../../store/authStore.ts';
import '../../style/Login.css';

const LoginPage: FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [stage, setStage] = useState<'idle' | 'expanding' | 'ready'>('idle');
    const {setAuthUser, setUserShop} = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        // Start expanding after a tiny delay
        const expandTimer = setTimeout(() => setStage('expanding'), 100);
        // Form arrives after expansion completes
        const readyTimer = setTimeout(() => setStage('ready'), 1000);
        
        return () => {
            clearTimeout(expandTimer);
            clearTimeout(readyTimer);
        };
    }, []);

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const userData = await loginUser(email, password);

            // Verificar que el usuario NO sea un cliente.
            // Los clientes tienen su propio portal de acceso con documento de identidad.
            if (userData.role === 'client') {
                // Es un cliente: cerrar sesión local y mostrar error.
                logoutUser();
                setError('Este portal es solo para administradores y empleados. Si eres cliente, utiliza el acceso de clientes.');
                setLoading(false);
                return;
            }

            // Cargar tiendas del usuario si es owner o empleado
            if (userData.role !== 'client') {
                try {
                    const shops = await getShopsByUserId(userData.id);
                    setUserShop(shops);
                    // Actualizar el perfil con las tiendas
                    userData.shopIds = shops.map(h => h.id);
                } catch (err) {
                    console.error("Error fetching user shops during login:", err);
                    setUserShop([]);
                }
            }

            // Actualizamos la sesión en el store
            setAuthUser(userData);

            // Redirigir según el rol
            if (userData.role === 'employee') {
                navigate('/cash-session', { replace: true });
            } else if (userData.role === 'superAdmin') {
                navigate('/super-admin', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }

        } catch (err: any) {
            setError(err.message || 'El correo electrónico o la contraseña son incorrectos.');
            console.error("Error en el login:", err);
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="mesh-bg"></div>
            
            {/* The 3D Portal Seed */}
            <div className={`portal-reveal ${stage !== 'idle' ? 'expanding' : ''}`}>
                <div className="portal-face"></div>
            </div>

            <div className={`auth-stage ${stage === 'ready' ? 'ready' : ''}`}>
                <div className="card glass-card shadow-lg" style={{maxWidth: '800px', width: '100%'}}>
                <div className="row g-0">
                    <div className="col-md-4 d-none d-md-flex auth-visual-column">
                        <div className="visual-brand mb-2">
                            <div className="brand-icon-large">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="white" viewBox="0 0 16 16">
                                    <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                                </svg>
                            </div>
                        </div>
                        
                        <div className="visual-text mb-3">
                            <h5 className="mb-1">Bienvenido</h5>
                            <p className="text-white-50 small mb-0">Sistema de gestión integral</p>
                        </div>

                        <div className="visual-features mb-3">
                            <div className="feature-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                </svg>
                                <span>Punto de venta rápido</span>
                            </div>
                            <div className="feature-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                </svg>
                                <span>Control de inventario</span>
                            </div>
                            <div className="feature-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                </svg>
                                <span>Reportes en tiempo real</span>
                            </div>
                            <div className="feature-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                </svg>
                                <span>Gestión de clientes</span>
                            </div>
                        </div>

                        <div className="visual-stats mt-auto">
                            <div className="stat-badge">
                                <div className="stat-number">100%</div>
                                <div className="stat-label">Seguro</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-8">
                        <div className="card-body p-4 p-lg-5">
                            <h2 className="card-title text-center mb-4">Iniciar Sesión</h2>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <form onSubmit={handleLogin}>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        value={email}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">Contraseña</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="password"
                                        value={password}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="d-grid">
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Iniciando sesión...' : 'Entrar'}
                                    </button>
                                </div>
                            </form>
                            <p className="mt-3 text-center">
                                ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
                            </p>

                            <div className="mt-4 border-t pt-4 text-center text-muted small">
                                <p className="mb-1">&copy; {new Date().getFullYear()} Congelados. Todos los derechos
                                    reservados.</p>
                                <p>Diseñado y Desarrollado por <a href="https://molink.com.co/" target="_blank"
                                                                  rel="noopener noreferrer"
                                                                  className="molink-credit-link">Molink
                                    Tecnología</a></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
}

export default LoginPage;