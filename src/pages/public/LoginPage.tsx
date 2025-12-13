import {useState, FC, FormEvent, ChangeEvent} from 'react';
import {Link} from 'react-router-dom';
import {auth} from '../../firebase.ts';
import {signInWithEmailAndPassword} from 'firebase/auth';
import '../../style/Login.css';

const LoginPage: FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            const error = err as { code?: string };
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                setError('El correo electrónico o la contraseña son incorrectos.');
            } else {
                setError('Ocurrió un error al intentar iniciar sesión. Por favor, inténtalo de nuevo.');
            }
            console.error("Error en el login:", err);
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="card shadow-lg" style={{maxWidth: '800px', width: '100%', border: 'none'}}>
                <div className="row g-0">
                    <div className="col-md-6 d-none d-md-block login-card-image">
                    </div>
                    <div className="col-md-6">
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
    );
}

export default LoginPage;