import { useState, FC, ChangeEvent, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/landing/onboardingServices";
import "../../style/Register.css";
import Alert from "../../components/shared/Alert.tsx";
import { RegisterFormData } from "../../types";

const RegisterPage: FC = () => {
    const [formData, setFormData] = useState<RegisterFormData>({
        shopName: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        identify: "",
        phone: "",
        timezone: "America/Bogota",
    });

    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [stage, setStage] = useState<'idle' | 'expanding' | 'ready'>('idle');
    const navigate = useNavigate();

    useEffect(() => {
        const expandTimer = setTimeout(() => setStage('expanding'), 100);
        const readyTimer = setTimeout(() => setStage('ready'), 1000);
        return () => {
            clearTimeout(expandTimer);
            clearTimeout(readyTimer);
        };
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setError(null);
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        if (formData.password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }
        setLoading(true);
        try {
            await registerUser(formData);
            console.log("Usuario registrado exitosamente");
            setSuccess(true);
            setTimeout(() => navigate('/pending-approval'), 1500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="mesh-bg"></div>

            {/* The 3D Portal Seed */}
            <div className={`portal-reveal ${stage !== 'idle' ? 'expanding' : ''}`}>
                <div className="portal-face"></div>
            </div>

            <div className={`auth-stage ${stage === 'ready' ? 'ready' : ''}`}>
                <div className="card glass-card shadow-lg w-75" style={{ maxWidth: "900px" }}>
                    <div className="row g-0">
                        <div className="col-lg-4 d-none d-lg-flex auth-visual-column">
                            <div className="visual-brand mb-2">
                                <div className="brand-icon-large">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="white" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="visual-text mb-3">
                                <h5 className="mb-1">Comienza Ahora</h5>
                                <p className="text-white-50 small mb-0">Únete a miles de negocios</p>
                            </div>

                            <div className="visual-features mb-3">
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                                    </svg>
                                    <span>Configuración en 5 minutos</span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                                    </svg>
                                    <span>Múltiples usuarios</span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                                    </svg>
                                    <span>Soporte incluido</span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                                    </svg>
                                    <span>Actualizaciones automáticas</span>
                                </div>
                            </div>

                            <div className="visual-stats mt-auto">
                                <div className="stat-badge">
                                    <div className="stat-number">+1000</div>
                                    <div className="stat-label">Negocios activos</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-8">
                            <div className="card-body p-5">
                                <div className="text-center mb-4">
                                    <h1 className="h4 text-body mb-0">Crea tu Cuenta</h1>
                                </div>
                                {success && (
                                    <Alert type="success"
                                        message="¡Registro exitoso! Serás redirigido al inicio de sesión." />
                                )}
                                <form onSubmit={handleSubmit} noValidate>
                                    <div className="row mb-2">
                                        <div className="col-sm-12">
                                            <input
                                                type="text"
                                                name="shopName"
                                                className="form-control form-control-user"
                                                placeholder="Nombre de tu shop"
                                                value={formData.shopName}
                                                onChange={handleChange} required={true}
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col-sm-6">
                                            <input
                                                type="text"
                                                name="firstName"
                                                className="form-control form-control-user"
                                                placeholder="Nombres"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-sm-6">
                                            <input
                                                type="text"
                                                name="lastName"
                                                className="form-control form-control-user"
                                                placeholder="Apellidos"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-2">
                                        <input
                                            type="text"
                                            name="identify"
                                            className="form-control form-control-user"
                                            placeholder="Identificación o Nit"
                                            value={formData.identify}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-control form-control-user"
                                            placeholder="Correo Electrónico"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    {/* Timezone hidden - using default America/Bogota */}
                                    <div className="row mb-2 g-2">
                                        <div className="col-sm-6 input-group">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                className="form-control form-control-user"
                                                placeholder="Contraseña"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                            />
                                            <button type="button" className="btn btn-outline-secondary"
                                                onClick={() => setShowPassword(!showPassword)}>
                                                <i className={showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
                                            </button>
                                        </div>
                                        <div className="col-sm-6 input-group">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                className={`form-control form-control-user ${confirmPassword && formData.password !== confirmPassword ? 'is-invalid' : ''}`}
                                                placeholder="Repertir Contraseña"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                            <button type="button" className="btn btn-outline-secondary"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                <i className={showConfirmPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
                                            </button>
                                        </div>
                                        {confirmPassword && formData.password !== confirmPassword && (
                                            <div className="col-12 mt-1">
                                                <small className="text-danger">Las contraseñas no coinciden.</small>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-2">
                                        <input
                                            type="text"
                                            name="phone"
                                            className="form-control form-control-user"
                                            placeholder="Teléfono"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-user btn-block w-100"
                                        disabled={loading}>
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status"
                                                    aria-hidden="true"></span>
                                                <span className="ms-2">Registrando...</span>
                                            </>
                                        ) : "Registrar Negocio"}
                                    </button>
                                </form>
                                <hr />
                                <div className="text-center">
                                    <Link className="small" to="/forgot-password">
                                        ¿Olvidó su Contraseña?
                                    </Link>
                                </div>
                                <div className="text-center">
                                    <Link className="small" to="/login">
                                        ¿Tienes una Cuenta? Inicia Sesión.
                                    </Link>
                                </div>
                                {error && <div className="mt-3">
                                    <Alert type="danger" message={error} />
                                </div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
