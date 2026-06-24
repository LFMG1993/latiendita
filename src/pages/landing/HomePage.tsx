import { FC, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CashStack, BoxSeam, GraphUp, ShieldLockFill, GiftFill, PeopleFill } from "react-bootstrap-icons";
import { useAuthStore } from "../../store/authStore";
import '../../style/Home.css';
import { useTenant } from "../../context/TenantContext";

const HomePage: FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [entranceComplete, setEntranceComplete] = useState(false);
    const { tenant } = useTenant();
    const { terminology, theme } = tenant;
    const { user, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'employee') {
                navigate('/cash-session', { replace: true });
            } else if (user.role === 'owner') {
                navigate('/dashboard', { replace: true });
            } else if (user.role === 'superAdmin') {
                navigate('/super-admin', { replace: true });
            } else if (user.role === 'client') {
                navigate('/client/dashboard', { replace: true });
            }
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);

        // Entrance animation timer
        const timer = setTimeout(() => setEntranceComplete(true), 500);

        // Intersection Observer for scroll reveals
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timer);
            observer.disconnect();
        };
    }, []);

    return (
        <div className="home-page">
            {/* Cortina de Revelación */}
            <div className={`reveal-curtain ${entranceComplete ? 'hidden' : ''}`}>
                <div className="curtain-logo">{terminology.shopLabel}</div>
            </div>

            {/* Barra de Navegación */}
            <nav
                className={`navbar navbar-expand-lg navbar-dark fixed-top ${isScrolled ? 'scrolled' : ''} ${entranceComplete ? 'visible' : ''}`}>
                <div className="container-fluid">
                    <Link to="/" className="navbar-brand fw-bold fs-4">
                        {theme.logoURL ? <img src={theme.logoURL} alt="Logo" height="30" className="d-inline-block align-text-top me-2" /> : null}
                        {terminology.shopLabel}
                    </Link>
                    <div>
                        <Link to="/login" className="btn btn-outline-primary me-2 text-white border-white">Iniciar Sesión</Link>
                        <Link to="/register" className="btn btn-primary">Registrarse</Link>
                    </div>
                </div>
            </nav>

            {/* Sección de presentación. */}
            <header className="hero-section text-center text-white" style={{ background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), ${theme.primaryColor}` }}>
                <div className={`container hero-content ${entranceComplete ? 'inner-visible' : ''}`}>
                    <h1 className="display-3 fw-bolder">El Sistema POS para el Comercio Colombiano.</h1>
                    <p className="lead my-4">Plataforma freemium para minimarkets, tiendas y misceláneas. Factura, controla tu inventario y supervisa a tu equipo sin complicaciones y desde cualquier dispositivo.</p>
                    <Link to="/register" className="btn btn-light btn-lg mt-3 fw-bold px-5">Crear mi Cuenta Gratis</Link>
                </div>
            </header>

            {/* Sección de funcionalidades */}
            <section id="features" className="container text-center py-5 scroll-reveal">
                <h2 className="fw-bold mb-5">Todo lo que necesitas, en un solo lugar</h2>
                <div className="row g-4">
                    <div className="col-md-4">
                        <div className="card h-100 shadow-sm border-0 p-4 feature-card">
                            <CashStack size={48} className="text-primary mx-auto mb-3" style={{ color: theme.primaryColor }} />
                            <h4 className="fw-bold">Punto de Venta Ágil</h4>
                            <p className="text-muted">Registra ventas en segundos, maneja múltiples métodos de pago y
                                gestiona productos con opciones variables sin esfuerzo.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card h-100 shadow-sm border-0 p-4 feature-card">
                            <BoxSeam size={48} className="text-primary mx-auto mb-3" style={{ color: theme.primaryColor }} />
                            <h4 className="fw-bold">Inventario Inteligente</h4>
                            <p className="text-muted">Tu stock se descuenta automáticamente con cada venta. Registra
                                compras y gastos para tener un control total.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card h-100 shadow-sm border-0 p-4 feature-card">
                            <GraphUp size={48} className="text-primary mx-auto mb-3" style={{ color: theme.primaryColor }} />
                            <h4 className="fw-bold">Reportes Claros</h4>
                            <p className="text-muted">Analiza tus ventas por día, semana o mes. Identifica tus
                                {terminology.productLabel.toLowerCase()}s estrella y entiende el rendimiento de tu negocio.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* sección de servicios gratis */}
            <section id="why-free" className="py-5 bg-body-tertiary scroll-reveal">
                <div className="container text-center">
                    <GiftFill size={60} className="text-primary mb-3" style={{ color: theme.primaryColor }} />
                    <h2 className="fw-bold">Crece a Tu Propio Ritmo (Modelo Freemium)</h2>
                    <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
                        Sabemos lo difícil que es emprender. Por eso, te ofrecemos las herramientas de ventas e inventario
                        completamente gratis de por vida para que despegues. Y cuando tu negocio crezca, nuestros planes PRO
                        te darán los superpoderes financieros y de control de múltiples empleados que necesitas por una fracción de lo que cuesta el software tradicional.
                    </p>
                </div>
            </section>

            {/* Seguridad y gestion de equipos */}
            <section id="security" className="container py-5 scroll-reveal">
                <div className="row align-items-center">
                    <div className="col-md-6">
                        <h2 className="fw-bold">Seguridad y Control Total</h2>
                        <p className="text-muted">Tu información está protegida con seguridad de nivel empresarial.
                            Gestiona los permisos de tu equipo de forma granular, decidiendo quién puede ver reportes,
                            gestionar inventario o simplemente operar la caja.</p>
                    </div>
                    <div className="col-md-6 text-center">
                        <ShieldLockFill size={80} className="text-primary me-4" style={{ color: theme.primaryColor }} />
                        <PeopleFill size={80} className="text-primary" style={{ color: theme.primaryColor }} />
                    </div>
                </div>
            </section>

            {/* Sección final de llamada a la acción */}
            <section className="final-cta py-5 text-center scroll-reveal">
                <div className="container">
                    <h2 className="fw-bold">¿Listo para sistematizar tu negocio?</h2>
                    <p>Únete a la nueva generación de tenderos y comerciantes en Colombia que tienen el control total en su bolsillo.
                    </p>
                    <Link to="/register" className="btn btn-primary btn-lg mt-3 fw-bold">Registrar mi Negocio Gratis</Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-4 home-footer">
                <div className="container text-center text-white small">
                    <p className="mb-1">&copy; {new Date().getFullYear()} {terminology.shopLabel}. Todos los derechos
                        reservados.</p>
                    <p>Diseñado y Desarrollado por <a href="https://molink.com.co/" target="_blank"
                        rel="noopener noreferrer"
                        className="molink-credit-link">Molink
                        Tecnología</a></p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;