import { FC, ReactNode, useEffect, useState } from 'react';

interface ModalProps {
    show: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'lg' | 'xl';
    headerIcon?: string;
    headerColor?: string;
}

const Modal: FC<ModalProps> = ({ show, onClose, title, children, size, headerIcon, headerColor = '#0d6efd' }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show) {
            // Pequeño delay para disparar la animación CSS
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
        }
    }, [show]);

    if (!show) return null;

    const modalSizeClass = size ? `modal-${size}` : '';

    return (
        <>
            {/* Backdrop animado */}
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 1050,
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(4px)',
                    opacity: visible ? 1 : 0,
                    transition: 'opacity 0.25s ease',
                }}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="modal fade show"
                style={{ display: 'block', zIndex: 1055 }}
                tabIndex={-1}
                onClick={onClose}
            >
                <div
                    className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${modalSizeClass}`}
                    onClick={e => e.stopPropagation()}
                    style={{
                        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-24px) scale(0.97)',
                        opacity: visible ? 1 : 0,
                        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
                    }}
                >
                    <div className="modal-content border-0 shadow-lg overflow-hidden" style={{borderRadius: 16}}>
                        {/* Header premium */}
                        <div
                            className="modal-header px-4 py-3 border-0"
                            style={{
                                background: `linear-gradient(135deg, ${headerColor}18, ${headerColor}08)`,
                                borderBottom: `1px solid ${headerColor}22`,
                            }}
                        >
                            <div className="d-flex align-items-center gap-3">
                                {headerIcon && (
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: `linear-gradient(135deg, ${headerColor}, ${headerColor}cc)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 18, flexShrink: 0, boxShadow: `0 4px 12px ${headerColor}40`
                                    }}>
                                        {headerIcon}
                                    </div>
                                )}
                                <h5 className="modal-title fw-bold mb-0">{title}</h5>
                            </div>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                                aria-label="Close"
                                style={{opacity: 0.5}}
                            />
                        </div>

                        <div className="modal-body p-4 bg-body">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Modal;