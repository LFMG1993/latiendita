import {useState, useEffect, FC, ChangeEvent, FormEvent} from 'react';
import {useAuthStore} from '../../store/authStore';
import {addHeladeriaToUser, updateHeladeria} from '../../services/userServices';
import Alert from '../general/Alert';
import {uploadImageToCloudinary} from "../../services/cloudinaryService";
import slugify from "../../utils/slugify";
import {countryCodes} from "../../data/countryCodes";
import {Heladeria, NewHeladeriaData, UpdateHeladeriaData} from "../../types";

interface AddHeladeriaFormProps {
    onFormSubmit: () => void;
    heladeriaToEdit?: Heladeria;
}

interface FormDataState {
    name: string;
    address: string;
    countryCode: string;
    whatsappNumber: string;
}

const AddHeladeriaForm: FC<AddHeladeriaFormProps> = ({onFormSubmit, heladeriaToEdit}) => {
    const {user} = useAuthStore();
    const [formData, setFormData] = useState<FormDataState>({
        name: heladeriaToEdit?.name || '',
        address: heladeriaToEdit?.address || '',
        countryCode: heladeriaToEdit?.whatsapp?.substring(0, 3) || '+57', // Código por defecto +57 (Colombia)
        whatsappNumber: heladeriaToEdit?.whatsapp?.substring(3) || '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(heladeriaToEdit?.photoURL || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Efecto para limpiar la URL del objeto de previsualización y evitar memory leaks
    useEffect(() => {
        // Esta función se ejecuta cuando el componente se desmonta
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('El nombre de la heladería no puede estar vacío.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            let photoURL = heladeriaToEdit?.photoURL;
            if (imageFile) {
                // Construimos el nombre de archivo personalizado y la carpeta
                const sanitizedName = slugify(formData.name);
                const uniqueSuffix = Date.now();
                const publicId = `${sanitizedName}-${uniqueSuffix}`;
                const folder = 'heladerias';

                photoURL = await uploadImageToCloudinary(imageFile, folder, publicId);
            }

            // Combinamos el código de área y el número antes de guardar
            const fullWhatsApp = `${formData.countryCode}${formData.whatsappNumber}`;
            const dataToSave: NewHeladeriaData | UpdateHeladeriaData = {
                name: formData.name,
                address: formData.address,
                whatsapp: fullWhatsApp,
                photoURL
            };

            if (heladeriaToEdit) {
                await updateHeladeria(heladeriaToEdit.id, dataToSave as UpdateHeladeriaData);
                setSuccess('¡Heladería actualizada con éxito!');
            } else {
                if (!user) throw new Error("Usuario no autenticado.");
                await addHeladeriaToUser(user.uid, dataToSave as NewHeladeriaData);
                setSuccess('¡Nueva heladería añadida con éxito!');
            }

            onFormSubmit(); // Notificar al padre para que refresque la lista y cierre el modal
        } catch (err: any) {
            setError(err.message || "Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    };
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setImageFile(file);

            // Limpiamos la preview anterior si existe y es un blob
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
            // Creamos una URL local para la previsualización
            setImagePreview(URL.createObjectURL(file));
        }
    };
    return (
        <>
            {error && <Alert type="danger" message={error}/>}
            {success && <Alert type="success" message={success}/>}
            <form onSubmit={handleSubmit}>
                <div className="row">
                    {/* Columna Izquierda: Imagen */}
                    <div className="col-md-5">
                        <label htmlFor="foto" className="form-label">Foto de la Heladería</label>
                        <div className="mb-3 text-center border rounded p-3" style={{
                            height: '250px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f8f9fa'
                        }}>
                            {imagePreview ? (
                                <img src={imagePreview} alt="Previsualización"
                                     style={{maxHeight: '100%', maxWidth: '100%', objectFit: 'cover'}}/>
                            ) : (
                                <div className="text-muted">
                                    <i className="bi bi-image" style={{fontSize: '3rem'}}></i>
                                    <p>Sube una imagen</p>
                                </div>
                            )}
                        </div>
                        <input className="form-control" type="file" id="foto" accept="image/*"
                               onChange={handleFileChange}/>
                    </div>

                    {/* Columna Derecha: Campos de texto */}
                    <div className="col-md-7">
                        <div className="mb-3">
                            <label htmlFor="name" className="form-label">Nombre de la Heladería</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="form-control"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="address" className="form-label">Dirección</label>
                            <input type="text" id="address" name="address" className="form-control"
                                   value={formData.address} onChange={handleChange}/>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="whatsapp" className="form-label">WhatsApp</label>
                            <div className="input-group">
                                <select className="form-select" name="countryCode" value={formData.countryCode}
                                        onChange={handleChange} style={{flex: '0 0 120px'}}>
                                    {countryCodes.map(country => (
                                        <option key={country.code} value={country.dial_code}>
                                            {country.name} ({country.dial_code})
                                        </option>
                                    ))}
                                </select>
                                <input type="tel" id="whatsapp" name="whatsappNumber" className="form-control"
                                       value={formData.whatsappNumber}
                                       onChange={handleChange}/>
                            </div>
                        </div>
                    </div>
                </div>
                <hr className="my-4"/>
                <div className="d-flex justify-content-end mt-3">
                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Guardando...' : (heladeriaToEdit ? 'Actualizar Heladería' : 'Añadir Heladería')}
                    </button>
                </div>
            </form>
        </>
    );
};

export default AddHeladeriaForm;