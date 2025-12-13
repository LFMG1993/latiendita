import {useState, FC, ChangeEvent, FormEvent} from "react";
import {Link, useNavigate} from "react-router-dom";
import {registerUser} from "../../services/authServices.ts";
import "../../style/Register.css";
import Alert from "../../components/general/Alert.tsx";
import {RegisterFormData} from "../../types";
import {timezones} from "../../data/timezones.ts";

const RegisterPage: FC = () => {
    const [formData, setFormData] = useState<RegisterFormData>({
        iceCreamShopName: "",
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
    const [loading, setLoading] = useState(false); // Estado para el spinner
    const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar contraseña
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Estado para mostrar/ocultar confirmación
    const navigate = useNavigate();

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setError(null);
        setFormData({...formData, [e.target.name]: e.target.value});
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
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="card shadow-lg w-75" style={{maxWidth: "900px"}}>
                <div className="row g-0">
                    <div className="col-lg-6 d-none d-lg-block card-image"></div>
                    <div className="col-lg-6">
                        <div className="card-body p-5">
                            <div className="text-center mb-4">
                                <h1 className="h4 text-gray-900">Crea tu Cuenta</h1>
                            </div>
                            {success && (
                                <Alert type="success"
                                       message="¡Registro exitoso! Serás redirigido al inicio de sesión."/>
                            )}
                            <form onSubmit={handleSubmit} noValidate>
                                <div className="row mb-3">
                                    <div className="col-sm-12">
                                        <input
                                            type="text"
                                            name="iceCreamShopName"
                                            className="form-control form-control-user"
                                            placeholder="Nombre de tu heladeria"
                                            value={formData.iceCreamShopName}
                                            onChange={handleChange} required={true}
                                        />
                                    </div>
                                </div>
                                <div className="row mb-3">
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
                                <div className="mb-3">
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
                                <div className="mb-3">
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
                                <div className="mb-3">
                                    <label htmlFor="timezone-select" className="form-label small text-muted">Zona
                                        Horaria de la Heladería</label>
                                    <select
                                        id="timezone-select"
                                        name="timezone"
                                        className="form-select form-select-sm"
                                        value={formData.timezone}
                                        onChange={handleChange}
                                    >
                                        {timezones.map(tz => (
                                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="row mb-3 g-2">
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
                                <div className="mb-3">
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
                                    ) : "Registrar Heladería"}
                                </button>
                            </form>
                            <hr/>
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
                                <Alert type="danger" message={error}/>
                            </div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
