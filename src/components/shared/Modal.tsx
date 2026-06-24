import { FC, ReactNode } from 'react';

// Definimos la forma que deben tener las props de nuestro Modal.
interface ModalProps {
    show: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'lg' | 'xl';
}

const Modal: FC<ModalProps> = ({ show, onClose, title, children, size }) => {
    if (!show) {
        return null;
    }

    const modalSizeClass = size ? `modal-${size}` : '';

    return (
        <>
            <div className="modal-backdrop fade show" />
            <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1} onClick={onClose}>
                <div className={`modal-dialog modal-dialog-centered ${modalSizeClass}`} onClick={(e) => e.stopPropagation()}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{title}</h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                        </div>
                        <div className="modal-body">{children}</div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Modal;