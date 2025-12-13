import {FC} from "react";
import {PencilSquare, Trash3, WrenchAdjustableCircle} from 'react-bootstrap-icons';

/**
 * Componente reutilizable para botones de acción (Editar, Eliminar).
 * @param {function} onEdit - Función a ejecutar al hacer clic en Editar.
 * @param {function} onDelete - Función a ejecutar al hacer clic en Eliminar.
 */
interface ActionButtonsProps {
    onEdit?: () => void;
    onDelete?: () => void;
    onAdjust?: () => void;
}

const ActionButtons: FC<ActionButtonsProps> = ({onEdit, onDelete, onAdjust}) => {
    return (
        <div className="btn-group btn-group-sm" role="group">
            {onEdit && (
                <button type="button" className="btn btn-outline-secondary" onClick={onEdit} title="Editar">
                    <PencilSquare/>
                </button>
            )}
            {onAdjust && ( // <-- RENDERIZADO CONDICIONAL
                <button type="button" className="btn btn-outline-info" onClick={onAdjust} title="Ajustar Stock">
                    <WrenchAdjustableCircle/>
                </button>
            )}
            {onDelete && (
                <button type="button" className="btn btn-outline-danger" onClick={onDelete} title="Eliminar">
                    <Trash3/>
                </button>
            )}
        </div>
    );
};

export default ActionButtons;