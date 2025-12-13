import {useState, useEffect, FC, ChangeEvent, FormEvent} from 'react';
import {useAuthStore} from '../../store/authStore.ts';
import {updateUserProfile} from '../../services/userServices.ts';
import {uploadImageToCloudinary} from '../../services/cloudinaryService.ts';
import Breadcrumbs from '../../components/general/Breadcrumbs.tsx';
import Alert from '../../components/general/Alert.tsx';
import {UpdateProfileData} from "../../types";

const ProfilePage: FC = () => {
    const {user} = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    // Estado para manejar todos los datos del formulario
    const [formData, setFormData] = useState<Omit<UpdateProfileData, 'photoURL'>>({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(user?.photoURL || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    useEffect(() => {
        // Limpia la URL de previsualización para evitar memory leaks
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleCancelEdit = () => {
        // Resetea el formulario a los valores originales del store
        setFormData({firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || ''});
        setImageFile(null);
        setImagePreview(user?.photoURL || null);
        setIsEditing(false);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const dataToUpdate: UpdateProfileData = {...formData};

            if (imageFile) {
                // Usamos el UID del usuario como publicId para que siempre sobrescriba su propia foto
                const publicId = user.uid;
                const folder = 'user_profiles';
                dataToUpdate.photoURL = await uploadImageToCloudinary(imageFile, folder, publicId);
            }

            await updateUserProfile(user.uid, dataToUpdate);

            setSuccess('¡Perfil actualizado con éxito!');
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error desconocido.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <main className="px-md-4">
                <Breadcrumbs/>
                <div
                    className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 className="h2">Mi Perfil</h1>
                </div>

                <div className="row">
                    {/* Columna Izquierda: Foto de Perfil */}
                    <div className="col-lg-4">
                        <div className="card mb-4">
                            <div className="card-body text-center">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="avatar"
                                         className="rounded-circle img-fluid"
                                         style={{width: '150px', height: '150px', objectFit: 'cover'}}/>
                                ) : (
                                    <i className="bi bi-person-circle"
                                       style={{fontSize: '150px', color: '#6c757d'}}></i>
                                )}
                                <h5 className="my-3">{user?.displayName || 'Usuario'}</h5>
                                <p className="text-muted mb-4">{user?.email}</p>
                                {isEditing && (
                                    <>
                                        <label htmlFor="fileUpload" className="btn btn-primary">
                                            Cambiar Foto
                                        </label>
                                        <input id="fileUpload" type="file" accept="image/*"
                                               onChange={handleFileChange} style={{display: 'none'}}/>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Datos Personales */}
                    <div className="col-lg-8">
                        <div className="card mb-4">
                            <div className="card-body">
                                {error && <Alert type="danger" message={error}/>}
                                {success && <Alert type="success" message={success}/>}
                                <div className="row mb-3">
                                    <div className="col-sm-3"><p className="mb-0">Nombres</p></div>
                                    <div className="col-sm-9"><input type="text" className="form-control"
                                                                     name="firstName" value={formData.firstName}
                                                                     onChange={handleFormChange}
                                                                     disabled={!isEditing}/></div>
                                </div>
                                <hr/>
                                <div className="row mb-3">
                                    <div className="col-sm-3"><p className="mb-0">Apellidos</p></div>
                                    <div className="col-sm-9"><input type="text" className="form-control"
                                                                     name="lastName" value={formData.lastName}
                                                                     onChange={handleFormChange}
                                                                     disabled={!isEditing}/></div>
                                </div>
                                <hr/>
                                <div className="row mb-3">
                                    <div className="col-sm-3"><p className="mb-0">Teléfono</p></div>
                                    <div className="col-sm-9"><input type="tel" className="form-control"
                                                                     name="phone" value={formData.phone}
                                                                     onChange={handleFormChange}
                                                                     disabled={!isEditing}/></div>
                                </div>
                                <hr/>
                                <div className="row mb-3">
                                    <div className="col-sm-3"><p className="mb-0">Email</p></div>
                                    <div className="col-sm-9"><p className="text-muted mb-0">{user?.email}</p>
                                    </div>
                                </div>
                                <hr/>
                                <div className="row mb-3">
                                    <div className="col-sm-3"><p className="mb-0">Fecha de Creación</p></div>
                                    <div className="col-sm-9"><p
                                        className="text-muted mb-0">{user?.createdAt?.toDate().toLocaleString() || 'No disponible'}</p>
                                    </div>
                                </div>
                                <hr/>
                                <div className="row mb-3">
                                    <div className="col-sm-3"><p className="mb-0">Última Actualización</p></div>
                                    <div className="col-sm-9"><p
                                        className="text-muted mb-0">{user?.updatedAt?.toDate().toLocaleString() || 'Nunca'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="d-flex justify-content-end">
                            {isEditing ? (
                                <>
                                    <button type="button" className="btn btn-secondary me-2"
                                            onClick={handleCancelEdit}>
                                        Cancelar
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={handleSubmit}
                                            disabled={loading}>
                                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </>
                            ) : (
                                <button type="button" className="btn btn-primary"
                                        onClick={() => setIsEditing(true)}>
                                    Editar Perfil
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default ProfilePage;