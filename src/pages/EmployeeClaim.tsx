import {useState, useEffect, FC} from 'react';
import {useLocation} from 'react-router-dom';
import {auth} from '../firebase';
import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'firebase/auth';
import {createInvitedUser, claimInvitation, getInvitationData} from "../services/teamServices";
import {PendingInvitation} from "../types";

// Hook para leer parámetros de la URL de forma sencilla
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const EmployeeClaim: FC = () => {
    const query = useQuery();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [invitationData, setInvitationData] = useState<PendingInvitation | null>(null);

    const invitationId = query.get('invitationId');
    const shopId = query.get('shopId');

    useEffect(() => {
        if (!invitationId || !shopId) {
            setError("URL de invitación inválida. Faltan parámetros.");
            return;
        }
        const fetchInvitation = async () => {
            setLoading(true);
            try {
                const data = await getInvitationData(shopId, invitationId);
                if (data && data.status === 'pending') {
                    setInvitationData(data);
                    setEmail(data.email);
                } else {
                    setError("Esta invitación no es válida o ya ha sido reclamada.");
                }
            } catch (e) {
                setError("No se pudo cargar la información de la invitación.");
            } finally {
                setLoading(false);
            }
        };

        fetchInvitation();
    }, [invitationId, shopId]);

    const handleAction = async (action: 'login' | 'register') => {
        setError('');
        setLoading(true);
        if (!invitationData) {
            setError("Error: Datos de la invitación no disponibles.");
            setLoading(false);
            return;
        }
        try {
            const userCredential = action === 'register'
                ? await createUserWithEmailAndPassword(auth, email, password)
                : await signInWithEmailAndPassword(auth, email, password);

            // Pasamos el roleId al crear el perfil del usuario.
            await createInvitedUser(userCredential.user, invitationData.roleId);
            // "Reclamar" la invitación para vincular el UID
            await claimInvitation(invitationData.shopId, invitationData.id, userCredential.user.uid);

            setIsSuccess(true);
            // Cerramos la ventana automáticamente tras unos segundos.
            setTimeout(() => window.close(), 3000);
        } catch (err) {
            const firebaseError = err as { code?: string };
            switch (firebaseError.code) {
                case 'auth/email-already-in-use':
                    setError('Este correo ya está registrado. Intenta iniciar sesión.');
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError('El correo o la contraseña son incorrectos.');
                    break;
                case 'auth/weak-password':
                    setError('La contraseña es muy débil. Debe tener al menos 6 caracteres.');
                    break;
                default:
                    setError('Ocurrió un error. Por favor, inténtalo de nuevo.');
                    break;
            }
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="container text-center mt-5 p-4">
                <div className="alert alert-success">
                    <h4>¡Cuenta Creada!</h4>
                    <p>Tu cuenta ha sido creada exitosamente. El dueño de la tienda confirmará tu acceso. Esta ventana
                        se cerrará en breve.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-12">
                    <div className="card border-0">
                        <div className="card-body">
                            <h3 className="card-title text-center mb-3">Únete al equipo</h3>
                            <p className="text-center text-muted small mb-4">Crea una cuenta o inicia sesión para
                                aceptar la invitación.</p>
                            {error && <div className="alert alert-danger small p-2">{error}</div>}
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Correo Electrónico</label>
                                    <input type="email" className="form-control" id="email" value={email}
                                           onChange={(e) => setEmail(e.target.value)} required
                                           readOnly={!!invitationData}/>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">Contraseña</label>
                                    <input type="password" className="form-control" id="password" value={password}
                                           onChange={(e) => setPassword(e.target.value)} required/>
                                </div>
                                <div className="d-grid gap-2 mt-4">
                                    <button type="button" className="btn btn-primary"
                                            onClick={() => handleAction('register')} disabled={loading}>
                                        {loading ? 'Procesando...' : 'Crear Cuenta y Unirse'}
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary"
                                            onClick={() => handleAction('login')} disabled={loading}>
                                        {loading ? 'Procesando...' : 'Ya tengo cuenta'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeClaim;