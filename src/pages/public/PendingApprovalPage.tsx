import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { logoutUser } from '../../services/authServices';

const PendingApprovalPage: FC = () => {
    const navigate = useNavigate();
    const { setAuthUser } = useAuthStore();

    const handleLogout = () => {
        logoutUser();
        setAuthUser(null);
        navigate('/login', { replace: true });
    };

    return (
        <div className="container-fluid min-vh-100 d-flex flex-column align-items-center justify-content-center bg-body" style={{
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background decorations */}
            <div style={{
                position: 'absolute', top: '-10%', left: '-5%', width: '300px', height: '300px', 
                background: 'radial-gradient(circle, rgba(13,110,253,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%'
            }}></div>
            <div style={{
                position: 'absolute', bottom: '-10%', right: '-5%', width: '400px', height: '400px', 
                background: 'radial-gradient(circle, rgba(108,117,125,0.1) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%'
            }}></div>

            <div className="card shadow-lg border-0 z-1 bg-body-tertiary" style={{ 
                maxWidth: '600px', 
                borderRadius: '1.5rem',
                backdropFilter: 'blur(10px)'
            }}>
                <div className="card-body p-5 text-center">
                    <div className="mb-4 position-relative d-inline-block">
                        <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle shadow-sm" 
                             style={{ width: '90px', height: '90px', transition: 'transform 0.3s ease-in-out' }}>
                            <i className="bi bi-clock-history display-4"></i>
                        </div>
                        {/* Pequeña decoración de pulso */}
                        <span className="position-absolute top-0 start-100 translate-middle p-2 bg-warning border border-light rounded-circle" style={{animation: 'pulse 2s infinite'}}>
                            <span className="visually-hidden">En revisión</span>
                        </span>
                    </div>
                    
                    <h2 className="fw-bold mb-3 text-body" style={{letterSpacing: '-0.5px'}}>¡Gracias por confiar en nosotros!</h2>
                    
                    <p className="text-body-secondary mb-4 fs-5" style={{lineHeight: '1.6'}}>
                        Hemos recibido tu solicitud de registro con éxito. Tu cuenta y entorno de trabajo están actualmente <strong className="text-primary">en revisión</strong> por nuestro equipo.
                    </p>
                    
                    <div className="alert border-0 mb-4 text-start p-4 bg-body" style={{
                        borderRadius: '1rem',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <div className="d-flex">
                            <div className="me-3 mt-1">
                                <i className="bi bi-info-circle-fill fs-3 text-primary"></i>
                            </div>
                            <div>
                                <h6 className="fw-bold mb-1 text-body">¿Qué sigue ahora?</h6>
                                <p className="mb-0 text-body-secondary small" style={{lineHeight: '1.5'}}>
                                    Estamos verificando tus datos para garantizar la seguridad de nuestra plataforma SaaS. Te notificaremos tan pronto como tu tienda esté activada y lista para operar. 
                                    <br/><br/>
                                    <span className="badge bg-primary bg-opacity-10 text-primary px-2 py-1 fw-semibold border border-primary-subtle">
                                        <i className="bi bi-stopwatch me-1"></i>
                                        Tiempo estimado de aprobación: Máximo 4 horas.
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-sm mt-2"
                        onClick={handleLogout}
                        style={{transition: 'all 0.3s ease'}}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Volver al Inicio de Sesión
                    </button>
                </div>
            </div>
            
            {/* Animación CSS inyectada */}
            <style>
                {`
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 193, 7, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
                }
                `}
            </style>
        </div>
    );
};

export default PendingApprovalPage;
