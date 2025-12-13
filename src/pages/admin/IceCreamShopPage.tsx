import {useState, FC} from 'react';
import HeladeriasTable from '../../components/iceCreamShop/HeladeriasTable.tsx';
import AddHeladeriaForm from '../../components/iceCreamShop/AddHeladeriaForm.tsx';
import {useAuthStore} from '../../store/authStore.ts';
import {deleteHeladeria, getHeladeriasByUserId} from '../../services/userServices.ts';
import Modal from '../../components/general/Modal.tsx';
import Breadcrumbs from "../../components/general/Breadcrumbs.tsx";
import {Heladeria} from "../../types";

const IceCreamShopPage: FC = () => {
    const {user, iceCreamShops, setUserIceCreamShop} = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHeladeria, setEditingHeladeria] = useState<Heladeria | null>(null);
    const [modalTitle, setModalTitle] = useState('');

    const handleOpenAddModal = () => {
        setEditingHeladeria(null);
        setModalTitle('Añadir Nueva Heladería');
        setIsModalOpen(true);
    };
    const handleOpenEditModal = (heladeria: Heladeria) => {
        setEditingHeladeria(heladeria);
        setModalTitle(`Editando: ${heladeria.name}`);
        setIsModalOpen(true);
    };

    const handleDelete = async (heladeriaId: string) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar esta heladería? Esta acción no se puede deshacer.")) {
            if (!user) return;
            await deleteHeladeria(user.uid, heladeriaId);
            const updatedHeladerias = iceCreamShops.filter(h => h.id !== heladeriaId);
            setUserIceCreamShop(updatedHeladerias);
        }
    };

    const handleFormSuccess = async () => {
        setIsModalOpen(false);
        if (!user) return;
        const updatedShops = await getHeladeriasByUserId(user.uid);
        setUserIceCreamShop(updatedShops);
    };

    return (
        <>
            <main className="px-md-4">
                <Breadcrumbs/>
                <div
                    className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 className="h2">Gestión de Heladerías</h1>
                    <div className="btn-toolbar mb-2 mb-md-0">
                        <button type="button" className="btn btn-sm btn-primary" onClick={handleOpenAddModal}>
                            <i className="bi bi-plus-circle-fill me-1"></i>
                            Añadir Nueva Heladería
                        </button>
                    </div>
                </div>
                <HeladeriasTable heladerias={iceCreamShops} onEdit={handleOpenEditModal}
                                 onDelete={handleDelete}/>
                <hr/>
            </main>

            <Modal title={modalTitle} show={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <AddHeladeriaForm onFormSubmit={handleFormSuccess} heladeriaToEdit={editingHeladeria ?? undefined}/>
            </Modal>
        </>
    );
};

export default IceCreamShopPage;