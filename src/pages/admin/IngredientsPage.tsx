import {useState, useEffect, FC} from "react";
import AddIngredientForm from "../../components/ingredients/AddIngredientForm.tsx";
import IngredientTable from "../../components/ingredients/IngredientTable.tsx";
import {deleteIngredient, getIngredients} from "../../services/ingredientServices.ts";
import {useAuthStore} from "../../store/authStore.ts";
import FullScreenLoader from "../../components/general/FullScreenLoader.tsx";
import Modal from "../../components/general/Modal.tsx";
import Breadcrumbs from "../../components/general/Breadcrumbs.tsx";
import {Ingredient} from "../../types";
import AdjustStockModal from "../../components/ingredients/AdjustStockModal.tsx";

const IngredientsPage: FC = () => {
    const {activeIceCreamShopId: heladeriaId, loading: authLoading} = useAuthStore();
    const [pageLoading, setPageLoading] = useState(true);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adjustingIngredient, setAdjustingIngredient] = useState<Ingredient | null>(null);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | undefined>(undefined);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    useEffect(() => {
        const fetchIngredients = async () => {
            if (!heladeriaId) return;
            setPageLoading(true);
            try {
                const data = await getIngredients(heladeriaId);
                setIngredients(data);
            } catch (error) {
                console.error("Error al obtener los ingredientes:", error);
            } finally {
                setPageLoading(false);
            }
        };

        fetchIngredients();
    }, [heladeriaId, refetchTrigger]);
    if (authLoading || pageLoading) return <FullScreenLoader/>;

    if (!heladeriaId) {
        return <p>Por favor, selecciona una heladería para gestionar los ingredientes.</p>;
    }

    const handleOpenAddModal = () => {
        setEditingIngredient(undefined);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient);
        setIsModalOpen(true);
    };

    const handleDelete = async (ingredientId: string) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar este ingrediente?`)) {
            try {
                await deleteIngredient(heladeriaId, ingredientId);
                // Disparamos la recarga para asegurar que la UI refleje el estado de la DB
                setRefetchTrigger(c => c + 1);
            } catch (error) {
                alert("Error al eliminar el ingrediente.");
            }
        }
    };

    const handleFormSubmit = () => {
        setIsModalOpen(false);
        setRefetchTrigger(c => c + 1);
    };

    const handleAdjustmentSuccess = () => {
        setAdjustingIngredient(null);
        setRefetchTrigger(c => c + 1);
    };

    return (
        <>
            <main className="px-md-4">
                <Breadcrumbs/>
                <div
                    className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
                    <h1 className="h2">Gestión de Ingredientes</h1>
                    <div className="btn-toolbar mb-2 mb-md-0">
                        <button type="button" className="btn btn-sm btn-outline-primary"
                                onClick={handleOpenAddModal}>
                            + Añadir Ingrediente
                        </button>
                    </div>
                </div>
                <IngredientTable ingredients={ingredients} onEdit={handleOpenEditModal}
                                 onAdjust={setAdjustingIngredient}
                                 onDelete={handleDelete}/>
            </main>

            <Modal title={editingIngredient ? `Editando: ${editingIngredient.name}` : "Añadir Nuevo Ingrediente"}
                   show={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <AddIngredientForm
                    onFormSubmit={handleFormSubmit}
                    ingredientToEdit={editingIngredient}
                    heladeriaId={heladeriaId}
                />
            </Modal>
            <AdjustStockModal
                ingredient={adjustingIngredient}
                onClose={() => setAdjustingIngredient(null)}
                onSuccess={handleAdjustmentSuccess}
            />
        </>
    );
};

export default IngredientsPage;
