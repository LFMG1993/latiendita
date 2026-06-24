import { FC } from 'react';
import { ArrowClockwise } from 'react-bootstrap-icons';

interface UpdateNotificationProps {
    onUpdate: () => void;
}

const UpdateNotification: FC<UpdateNotificationProps> = ({ onUpdate }) => {
    return (
        <div
            className="position-fixed bottom-0 end-0 m-3 p-3 rounded shadow-lg bg-dark text-white"
            style={{ zIndex: 1050 }}
        >
            <div className="d-flex align-items-center">
                <div className="flex-grow-1 me-3">
                    <p className="mb-0">¡Hay una nueva versión disponible!</p>
                    <small>Recarga para aplicar los cambios.</small>
                </div>
                <button className="btn btn-primary" onClick={onUpdate} title="Recargar">
                    <ArrowClockwise size={20} />
                </button>
            </div>
        </div>
    );
};

export default UpdateNotification;