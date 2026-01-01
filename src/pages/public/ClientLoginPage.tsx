import {useState, FC, FormEvent, ChangeEvent} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {auth} from '../../firebase.ts';
import {signInWithEmailAndPassword} from 'firebase/auth';
import '../../style/Login.css'; // Reutilizamos estilos por simplicidad, o podríamos crear uno nuevo
import { useTenant } from '../../context/TenantContext';

const ClientLoginPage: FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { tenant } = useTenant();

    const redirectUrl = searchParams.get('redirect') || '/';

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Login exitoso, redirigir
            navigate(redirectUrl);
        } catch (err: any) {
            console.error("Error en el login:", err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Correo o contraseña incorrectos.');
            } else {
                setError('Error al iniciar sesión. Inténtalo de nuevo.');
            }
            setLoading(false);
        }
    };

    return (
        <div className="login-container bg-body-tertiary">
            <div className="card shadow border-0 rounded-4 overflow-hidden" style={{maxWidth: '450px', width: '100%'}}>
                <div className="card-body p-5">
                    <div className="text-center mb-4">
                        <h3 className="fw-bold mb-1">¡Bienvenido!</h3>
                        <p className="text-secondary small">Inicia sesión para finalizar tu pedido en <strong>{tenant.terminology.shopLabel}</strong></p>
                    </div>

                    {error && <div className="alert alert-danger py-2 small">{error}</div>}

                    <form onSubmit={handleLogin}>
                        <div className="form-floating mb-3">
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                placeholder="nombre@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <label htmlFor="email">Correo Electrónico</label>
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
                                {loading ? 'Entrando...' : 'Iniciar Sesión'}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-4">
                        <p className="small text-secondary mb-0">¿Primera vez aquí?</p>
                        <Link to={`/client-register?redirect=${encodeURIComponent(redirectUrl)}`} className="fw-bold text-decoration-none" style={{color: tenant.theme.primaryColor}}>
                            Crear una cuenta de cliente
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientLoginPage;
