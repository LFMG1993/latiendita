import {FC} from "react";
import {PendingInvitation} from "../../types";

interface PendingInvitationsTableProps {
    invitations: PendingInvitation[];
    onApprove: (invitation: PendingInvitation) => void;
}

const PendingInvitationsTable: FC<PendingInvitationsTableProps> = ({invitations, onApprove}) => {
    if (invitations.length === 0) {
        return null; // No renderizar nada si no hay invitaciones
    }

    return (
        <div className="card mb-4 border-primary">
            <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Invitaciones Pendientes</h5>
            </div>
            <div className="card-body">
                <table className="table table-hover">
                    <thead>
                    <tr>
                        <th>Email Invitado</th>
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                    </thead>
                    <tbody>
                    {invitations.map(inv => (
                        <tr key={inv.id}>
                            <td>{inv.email}</td>
                            <td>{inv.status === 'claimed' ? 'Usuario registrado, listo para aprobar' : 'Esperando registro del usuario'}</td>
                            <td><button className="btn btn-sm btn-success" disabled={!inv.memberUid} onClick={() => onApprove(inv)}>Aprobar</button></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PendingInvitationsTable;