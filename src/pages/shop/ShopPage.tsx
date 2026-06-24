import {useState, FC} from 'react';
import ShopsTable from '../../components/shop/management/ShopsTable.tsx';
import AddShopForm from '../../components/shop/management/AddShopForm.tsx';
import {useAuthStore} from '../../store/authStore.ts';
import { getShopsByUserId } from "../../services/shop/tenantUserServices";
import { deleteShop } from "../../services/admin/adminShopServices";
import Modal from '../../components/shared/Modal.tsx';
import Breadcrumbs from "../../components/shared/Breadcrumbs.tsx";
import {Shop} from "../../types";

const ShopPage: FC = () => {
    const {user, shops, setUserShop} = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const [modalTitle, setModalTitle] = useState('');

    const handleOpenAddModal = () => {
        setEditingShop(null);
        setModalTitle('Añadir Nueva Heladería');
        setIsModalOpen(true);
    };
    const handleOpenEditModal = (shop: Shop) => {
        setEditingShop(shop);
        setModalTitle(`Editando: ${shop.name}`);
        setIsModalOpen(true);
    };

    const handleDelete = async (shopId: string) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar esta heladería? Esta acción no se puede deshacer.")) {
            if (!user) return;
            await deleteShop(user.uid, shopId);
            const updatedShops = shops.filter(h => h.id !== shopId);
            setUserShop(updatedShops);
        }
    };

    const handleFormSuccess = async () => {
        setIsModalOpen(false);
        if (!user) return;
        const updatedShops = await getShopsByUserId(user.uid);
        setUserShop(updatedShops);
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
                <ShopsTable shops={shops} onEdit={handleOpenEditModal}
                                 onDelete={handleDelete}/>
                <hr/>
            </main>

            <Modal title={modalTitle} show={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <AddShopForm onFormSubmit={handleFormSuccess} shopToEdit={editingShop ?? undefined}/>
            </Modal>
        </>
    );
};

export default ShopPage;