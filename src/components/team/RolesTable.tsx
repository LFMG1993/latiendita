import {FC} from "react";
import {Role} from "../../types";
import ActionButtons from "../general/ActionButtons.tsx";

interface RolesTableProps {
    roles: Role[];
    onAdd: () => void;
    onEdit: (role: Role) => void;
    onDelete: (roleId: string) => void;
}

const RolesTable: FC<RolesTableProps> = ({roles, onAdd, onEdit, onDelete}) => {
    return (
        <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Roles</h5>
            <button className="btn btn-sm btn-outline-primary" onClick={onAdd}>
        + Crear Rol
    </button>
    </div>
    <div className="card-body">
    <table className="table">
        <thead>
            <tr>
                <th>Rol</th>
        <th>Descripción</th>
        <th>Acciones</th>
        </tr>
        </thead>
        <tbody>
        {roles.map(role => (
                <tr key={role.id}>
                <td>{role.name}</td>
                <td>{role.description}</td>
                <td><ActionButtons onEdit={() => onEdit(role)} onDelete={() => onDelete(role.id)}/></td>
    </tr>
))}
    </tbody>
    </table>
    </div>
    </div>
);
};

export default RolesTable;