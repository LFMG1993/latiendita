import {createContext, useContext, useState, useCallback, FC, ReactNode} from 'react';
import {CheckCircleFill, XCircleFill, ExclamationTriangleFill, InfoCircleFill, XLg} from 'react-bootstrap-icons';

export type ToastType = 'success' | 'danger' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: FC<{ children: ReactNode }> = ({children}) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, {id, message, type, duration}]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircleFill className="text-success fs-5 me-2 flex-shrink-0" />;
            case 'danger':
                return <XCircleFill className="text-danger fs-5 me-2 flex-shrink-0" />;
            case 'warning':
                return <ExclamationTriangleFill className="text-warning fs-5 me-2 flex-shrink-0" />;
            case 'info':
            default:
                return <InfoCircleFill className="text-info fs-5 me-2 flex-shrink-0" />;
        }
    };

    const getBorderColor = (type: ToastType) => {
        switch (type) {
            case 'success': return '#198754';
            case 'danger': return '#dc3545';
            case 'warning': return '#ffc107';
            case 'info':
            default:
                return '#0dcaf0';
        }
    };

    return (
        <ToastContext.Provider value={{showToast}}>
            {children}
            
            {/* Contenedor de Toasts con Z-Index superior */}
            <div 
                className="toast-container position-fixed top-0 end-0 p-3 z-5"
                style={{
                    maxWidth: '400px', 
                    width: '100%',
                    pointerEvents: 'none'
                }}
            >
                <div className="d-flex flex-column gap-2 align-items-end">
                    {toasts.map(toast => (
                        <div
                            key={toast.id}
                            className="toast show d-flex align-items-center p-3 border-0 shadow-lg rounded-4 bg-body"
                            role="alert"
                            aria-live="assertive"
                            aria-atomic="true"
                            style={{
                                pointerEvents: 'auto',
                                borderLeft: `5px solid ${getBorderColor(toast.type)}`,
                                minWidth: '280px',
                                animation: 'toast-slide-in 0.3s ease-out forwards',
                                transition: 'all 0.2s ease-in-out'
                            }}
                        >
                            <div className="d-flex align-items-center w-100">
                                {getIcon(toast.type)}
                                <div className="toast-body text-body small fw-medium flex-grow-1 p-0 me-2">
                                    {toast.message}
                                </div>
                                <button
                                    type="button"
                                    className="btn-close ms-auto small p-1 d-flex align-items-center justify-content-center"
                                    onClick={() => removeToast(toast.id)}
                                    aria-label="Close"
                                    style={{fontSize: '0.75rem'}}
                                >
                                    <XLg size={12}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes toast-slide-in {
                    from {
                        transform: translateX(100%) translateY(-10px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0) translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
