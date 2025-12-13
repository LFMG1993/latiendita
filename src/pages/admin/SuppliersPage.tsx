import {FC, useState, useEffect} from "react";
import Breadcrumbs from "../../components/general/Breadcrumbs.tsx";
import {useAuthStore} from "../../store/authStore.ts";
import FullScreenLoader from "../../components/general/FullScreenLoader.tsx";
import {Supplier} from "../../types";
import {getSuppliers, deleteSupplier} from "../../services/supplierService.ts";
import Modal from "../../components/general/Modal.tsx";
import SupplierForm from "../../components/suppliers/SupplierForm.tsx";
import SuppliersTable from "../../components/suppliers/SuppliersTable.tsx";

const SuppliersPage: FC = () => {

    const {activeIceCreamShopId: shopId, loading: authLoading} = useAuthStore();
    const [pageLoading, setPageLoading] = useState(true);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            if (!shopId) return;
            setPageLoading(true);
            try {
                const data = await getSuppliers(shopId);
                setSuppliers(data);
            } catch (error) {
                console.error("Error al obtener los proveedores:", error);
            } finally {
                setPageLoading(false);
            }
        };
        fetchData();
    }, [shopId, refetchTrigger]);

    if (authLoading || pageLoading) return <FullScreenLoader/>;

    const handleOpenAddModal = () => {
        setEditingSupplier(undefined);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleDelete = async (supplierId: string) => {
        if (shopId && window.confirm("¿Estás seguro de que quieres eliminar este proveedor?")) {
            try {
                await deleteSupplier(shopId, supplierId);
                setRefetchTrigger(c => c + 1);
            } catch (error) {
                console.error("Error al eliminar el proveedor:", error);
            }
        }
    };

    const handleFormSubmit = () => {
        setIsModalOpen(false);
        setRefetchTrigger(c => c + 1);
    };

    return (
        <>
            <main className="px-md-4">
                <Breadcrumbs/>
                <div
                    className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 className="h2">Gestión de Proveedores</h1>
                    <div className="btn-toolbar mb-2 mb-md-0">
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleOpenAddModal}>
                            + Añadir Proveedor
                        </button>
                    </div>
                </div>
                <SuppliersTable suppliers={suppliers} onEdit={handleOpenEditModal} onDelete={handleDelete}/>
            </main>
            <Modal title={editingSupplier ? "Editar Proveedor" : "Añadir Nuevo Proveedor"} show={isModalOpen}
                   onClose={() => setIsModalOpen(false)}>
                <SupplierForm onFormSubmit={handleFormSubmit} supplierToEdit={editingSupplier} shopId={shopId!}/>
            </Modal>
        </>
    );
};

export default SuppliersPage;