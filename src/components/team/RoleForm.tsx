import {FC, useState, useEffect, FormEvent, useMemo} from 'react';
import {Permission, Role, NewRoleData} from "../../types";
import {addRole, updateRole} from "../../services/teamServices.ts";

interface RoleFormProps {
    shopId: string;
    onFormSubmit: () => void;
    allPermissions: Permission[];
    roleToEdit?: Role;
}

const RoleForm: FC<RoleFormProps> = ({shopId, onFormSubmit, allPermissions, roleToEdit}) => {
    const initialState: NewRoleData = {
        name: '',
        description: '',
        permissions: {}
    };

    const [formData, setFormData] = useState<NewRoleData>(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Agrupamos los permisos por módulo para una mejor visualización en la UI
    const groupedPermissions = useMemo(() => {
        return allPermissions.reduce((acc, permission) => {
            const module = permission.id.split('_')[0] || 'General';
            if (!acc[module]) acc[module] = [];
            acc[module].push(permission);
            return acc;
        }, {} as Record<string, Permission[]>);
    }, [allPermissions]);

    useEffect(() => {
        if (roleToEdit) {
            setFormData({
                name: roleToEdit.name,
                description: roleToEdit.description,
                permissions: roleToEdit.permissions || {}
            });
        } else {
            setFormData(initialState);
        }
    }, [roleToEdit]);

    const handlePermissionChange = (permissionId: string) => {
        setFormData(prev => {
            const newPermissions = {...prev.permissions};
            if (newPermissions[permissionId]) {
                delete newPermissions[permissionId];
            } else {
                newPermissions[permissionId] = true;
            }
            return {...prev, permissions: newPermissions};
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (roleToEdit) {
                await updateRole(shopId, roleToEdit.id, formData);
            } else {
                await addRole(shopId, formData);
            }
            onFormSubmit();
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="mb-3">
                <label htmlFor="roleName" className="form-label">Nombre del Rol</label>
                <input type="text" className="form-control" id="roleName" name="name"
                       value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required/>
            </div>
            <div className="mb-3">
                <label htmlFor="roleDescription" className="form-label">Descripción</label>
                <textarea className="form-control" id="roleDescription" name="description" rows={2}
                          value={formData.description}
                          onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
            </div>
            <div className="mb-3">
                <h5>Permisos</h5>
                {Object.entries(groupedPermissions).map(([moduleName, permissionsInModule]) => (
                    <div key={moduleName} className="mb-3">
                        <h6 className="text-capitalize border-bottom pb-1">{moduleName.replace('_', ' ')}</h6>
                        <div className="row">
                            {permissionsInModule.map(permission => (
                                <div className="col-md-6" key={permission.id}>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" id={`perm-${permission.id}`}
                                               checked={!!formData.permissions[permission.id]}
                                               onChange={() => handlePermissionChange(permission.id)}/>
                                        <label className="form-check-label" htmlFor={`perm-${permission.id}`}
                                               title={permission.description}>
                                            {permission.name}
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Guardando...' : (roleToEdit ? 'Actualizar Rol' : 'Crear Rol')}
                </button>
            </div>
        </form>
    );
};

export default RoleForm;