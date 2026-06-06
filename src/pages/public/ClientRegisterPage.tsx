import {useState, FC, FormEvent, ChangeEvent} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {registerClient, ClientRegisterData} from '../../services/authServices';
import '../../style/Register.css'; // Reutilizamos estilos
import { useTenant } from '../../context/TenantContext';

const ClientRegisterPage: FC = () => {
    const [formData, setFormData] = useState<ClientRegisterData>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        documentId: ''
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [searchParams] = useSearchParams();
    const { tenant } = useTenant();

    const redirectUrl = searchParams.get('redirect') || '/client/dashboard';

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (formData.password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        try {
            // Extraer shopId del redirect URL si existe para asociarlo al cliente
            let shopId: string | undefined = undefined;
            try {
                const urlObj = new URL(window.location.origin + redirectUrl);
                shopId = urlObj.searchParams.get('shopId') || undefined;
            } catch (e) {
                // Si falla el parseo de la URL, continuamos sin shopId
            }

            await registerClient({...formData, shopId});
            // Registro exitoso -> Autologin implícito -> Redirigir manejado por App.tsx
        } catch (err: any) {
            setError(err.message || "Error al registrarse.");
            setLoading(false);
        }
    };

    return (
        <div className="register-container bg-body-tertiary">
            <div className="card shadow border-0 rounded-4 overflow-hidden" style={{maxWidth: '500px', width: '100%'}}>
                <div className="card-body p-5">
                     <div className="text-center mb-4">
                        <h3 className="fw-bold mb-1">Crea tu Cuenta</h3>
                        <p className="text-secondary small">Regístrate para hacer pedidos más rápido.</p>
                    </div>

                    {error && <div className="alert alert-danger py-2 small">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="row g-2 mb-3">
                            <div className="col-6 form-floating">
                                <input
                                    type="text"
                                    className="form-control"
                                    id="firstName"
                                    name="firstName"
                                    placeholder="Nombre"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                                <label htmlFor="firstName">Nombre</label>
                            </div>
                            <div className="col-6 form-floating">
                                <input
                                    type="text"
                                    className="form-control"
                                    id="lastName"
                                    name="lastName"
                                    placeholder="Apellido"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                                <label htmlFor="lastName">Apellido</label>
                            </div>
                        </div>

                        <div className="form-floating mb-3">
                            <input
                                type="text"
                                className="form-control"
                                id="documentId"
                                name="documentId"
                                placeholder="Cédula"
                                value={formData.documentId}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="documentId">🗒️ Cédula / Documento de Identidad</label>
                        </div>

                         <div className="form-floating mb-3">
                             <input
                                 type="email"
                                 className="form-control"
                                 id="email"
                                 name="email"
                                 placeholder="Email"
                                 value={formData.email}
                                 onChange={handleChange}
                                 required
                             />
                              <label htmlFor="email">Correo Electrónico</label>
                         </div>
                         <div className="form-floating mb-3">
                            <input
                                type="tel"
                                className="form-control"
                                id="phone"
                                name="phone"
                                placeholder="Celular"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                             <label htmlFor="phone">Celular / WhatsApp</label>
                        </div>

                        <div className="form-floating mb-3">
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                name="password"
                                placeholder="Contraseña"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                            />
                            <label htmlFor="password">Contraseña (mín. 6)</label>
                        </div>

                        <div className="form-floating mb-4">
                            <input
                                type="password"
                                className="form-control"
                                id="confirmPassword"
                                placeholder="Confirmar"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                        </div>

                        <div className="d-grid mb-3">
                            <button 
                                type="submit" 
                                className="btn btn-primary btn-lg fw-bold" 
                                disabled={loading}
                                style={{backgroundColor: tenant.theme.primaryColor, borderColor: tenant.theme.primaryColor}}
                            >
                                {loading ? 'Creando cuenta...' : 'Registrarme'}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-4">
                        <p className="small text-secondary mb-0">¿Ya tienes cuenta?</p>
                        <Link to={`/client-login?redirect=${encodeURIComponent(redirectUrl)}`} className="fw-bold text-decoration-none" style={{color: tenant.theme.primaryColor}}>
                            Inicia Sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientRegisterPage;
