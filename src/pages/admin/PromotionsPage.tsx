import {FC, useState, useEffect} from "react";
import Breadcrumbs from "../../components/general/Breadcrumbs.tsx";
import {useAuthStore} from "../../store/authStore.ts";
import FullScreenLoader from "../../components/general/FullScreenLoader.tsx";
import {Promotion, Product} from "../../types";
import {getAllPromotions, deletePromotion} from "../../services/promotionServices.ts";
import {getProducts} from "../../services/productServices.ts";
import Modal from "../../components/general/Modal.tsx";
import PromotionsTable from "../../components/promotions/PromotionsTable.tsx";
import PromotionForm from "../../components/promotions/PromotionForm.tsx";
import {usePermissions} from "../../hooks/usePermissions.ts";

const PromotionsPage: FC = () => {
    const {activeIceCreamShopId: shopId, loading: authLoading} = useAuthStore();
    const {hasPermission} = usePermissions();
    const [pageLoading, setPageLoading] = useState(true);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | undefined>(undefined);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            if (!shopId) return;
            setPageLoading(true);
            try {
                const [promotionsData, productsData] = await Promise.all([
                    getAllPromotions(shopId),
                    getProducts(shopId)
                ]);
                setPromotions(promotionsData);
                setProducts(productsData);
            } catch (error) {
                console.error("Error al obtener datos:", error);
            } finally {
                setPageLoading(false);
            }
        };
        fetchData();
    }, [shopId, refetchTrigger]);

    if (authLoading || pageLoading) return <FullScreenLoader/>;

    const handleOpenAddModal = () => {
        setEditingPromotion(undefined);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (promo: Promotion) => {
        setEditingPromotion(promo);
        setIsModalOpen(true);
    };

    const handleDelete = async (promoId: string) => {
        if (shopId && window.confirm("¿Estás seguro de que quieres eliminar esta promoción?")) {
            await deletePromotion(shopId, promoId);
            setRefetchTrigger(c => c + 1);
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
                <div className="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 className="h2">Gestión de Promociones</h1>
                    {hasPermission('promotions_create') && (
                        <button className="btn btn-primary" onClick={handleOpenAddModal}>+ Crear Promoción</button>
                    )}
                </div>
                <PromotionsTable promotions={promotions} onEdit={handleOpenEditModal} onDelete={handleDelete}/>
            </main>
            <Modal title={editingPromotion ? "Editar Promoción" : "Crear Nueva Promoción"} show={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
                <PromotionForm products={products} onSubmit={handleFormSubmit} promotionToEdit={editingPromotion} shopId={shopId!} />
            </Modal>
        </>
    );
};

export default PromotionsPage;