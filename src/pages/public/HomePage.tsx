import {FC, useState, useEffect} from "react";
import {Link} from "react-router-dom";
import {CashStack, BoxSeam, GraphUp, ShieldLockFill, GiftFill, PeopleFill} from "react-bootstrap-icons";
import '../../style/Home.css';

const HomePage: FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="home-page">
            {/* Barra de Navegación */}
            <nav
                className={`navbar navbar-expand-lg navbar-dark fixed-top ${isScrolled ? 'scrolled' : ''}`}>
                <div className="container-fluid">
                    <Link to="/" className="navbar-brand fw-bold fs-4">Congelados</Link>
                    <div>
                        <Link to="/login" className="btn btn-outline-primary me-2 text-white">Iniciar Sesión</Link>
                        <Link to="/register" className="btn btn-primary">Registrarse</Link>
                    </div>
                </div>
            </nav>

            {/* Sección de presentación. */}
            <header className="hero-section text-center text-white d-flex flex-column justify-content-center">
                <div className="container">
                    <h1 className="display-3 fw-bolder">La Herramienta Definitiva para tu Heladería.</h1>
                    <p className="lead my-4">Optimiza tus ventas, gestiona tu inventario y toma el control de tu
                        negocio con una plataforma diseñada para crecer contigo.</p>
                    <Link to="/register" className="btn btn-light btn-lg mt-3 fw-bold">Empieza Gratis</Link>
                </div>
            </header>

            {/* Sección de funcionalidades */}
            <section id="features" className="container text-center py-5">
                <h2 className="fw-bold mb-5">Todo lo que necesitas, en un solo lugar</h2>
                <div className="row g-4">
                    <div className="col-md-4">
                        <div className="card h-100 shadow-sm border-0 p-4 feature-card">
                            <CashStack size={48} className="text-primary mx-auto mb-3"/>
                            <h4 className="fw-bold">Punto de Venta Ágil</h4>
                            <p className="text-muted">Registra ventas en segundos, maneja múltiples métodos de pago y
                                gestiona productos con opciones variables sin esfuerzo.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card h-100 shadow-sm border-0 p-4 feature-card">
                            <BoxSeam size={48} className="text-primary mx-auto mb-3"/>
                            <h4 className="fw-bold">Inventario Inteligente</h4>
                            <p className="text-muted">Tu stock se descuenta automáticamente con cada venta. Registra
                                compras y gastos para tener un control total.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card h-100 shadow-sm border-0 p-4 feature-card">
                            <GraphUp size={48} className="text-primary mx-auto mb-3"/>
                            <h4 className="fw-bold">Reportes Claros</h4>
                            <p className="text-muted">Analiza tus ventas por día, semana o mes. Identifica tus
                                productos estrella y entiende el rendimiento de tu negocio.</p>
                        </div>
                    </div>
                </div>
            </section>
            {/* sección de servicios gratis */}
            <section id="why-free" className="py-5 bg-light">
                <div className="container text-center">
                    <GiftFill size={60} className="text-primary mb-3"/>
                    <h2 className="fw-bold">Nuestra Misión es Apoyarte</h2>
                    <p className="lead text-muted mx-auto" style={{maxWidth: '700px'}}>
                        Creemos que todos los emprendedores merecen acceso a herramientas de calidad. "Congelados" es
                        nuestro proyecto para apoyar a pequeños negocios como heladerías y fruterías. Ofrecemos las
                        funciones esenciales de forma gratuita para ayudarte a crecer.
                    </p>
                </div>
            </section>

            {/* Seguridad y gestion de equipos */}
            <section id="security" className="container py-5">
                <div className="row align-items-center">
                    <div className="col-md-6">
                        <h2 className="fw-bold">Seguridad y Control Total</h2>
                        <p className="text-muted">Tu información está protegida con seguridad de nivel empresarial.
                            Gestiona los permisos de tu equipo de forma granular, decidiendo quién puede ver reportes,
                            gestionar inventario o simplemente operar la caja.</p>
                    </div>
                    <div className="col-md-6 text-center">
                        <ShieldLockFill size={80} className="text-primary me-4"/>
                        <PeopleFill size={80} className="text-primary"/>
                    </div>
                </div>
            </section>

            {/* Sección final de llamada a la acción */}
            <section className="final-cta py-5 text-center">
                <div className="container">
                    <h2 className="fw-bold">¿Listo para transformar tu negocio?</h2>
                    <p>Crea tu cuenta en menos de un minuto y empieza a gestionar tu heladería como un profesional.
                    </p>
                    <Link to="/register" className="btn btn-primary btn-lg mt-3 fw-bold">Crear Mi Cuenta Gratis</Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-4 home-footer">
                <div className="container text-center text-white small">
                    <p className="mb-1">&copy; {new Date().getFullYear()} Congelados. Todos los derechos
                        reservados.</p>
                    <p>Diseñado y Desarrollado por <a href="https://molink.com.co/" target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="molink-credit-link">Molink
                        Tecnología</a></p>
                </div>
            </footer>
        </div>
    );
}

export default HomePage;