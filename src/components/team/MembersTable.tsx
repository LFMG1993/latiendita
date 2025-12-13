import {FC} from "react";
import {Member} from "../../types";
import ActionButtons from "../general/ActionButtons.tsx";

interface MembersTableProps {
    members: Member[];
    onAdd: () => void;
    onRemove: (memberId: string) => void;
    onManageSchedule: (member: Member) => void;
}

const MembersTable: FC<MembersTableProps> = ({members, onAdd, onRemove, onManageSchedule}) => {
    return (
        <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Miembros del Equipo</h5>
                <button className="btn btn-sm btn-primary" onClick={onAdd}>
                    + Agregar Miembro
                </button>
            </div>
            <div className="card-body">
                <table className="table">
                    <thead>
                    <tr>
                        <th>Email</th>
                        <th>Rol Asignado</th>
                        <th>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {members.map(member => (
                        <tr key={member.uid}>
                            <td>{member.email}</td>
                            <td>{member.roleName}</td>
                            <td>
                                {member.roleName !== 'Propietario' && (
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-sm btn-outline-secondary"
                                                onClick={() => onManageSchedule(member)}>Horario
                                        </button>
                                        <ActionButtons onDelete={() => onRemove(member.uid)}/>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MembersTable;