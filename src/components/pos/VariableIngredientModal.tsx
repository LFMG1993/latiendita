import {FC, useState, useEffect} from "react";
import {Product, Ingredient, IngredientUsage} from "../../types";
import Modal from "../general/Modal";

interface VariableIngredientModalProps {
    show: boolean;
    onClose: () => void;
    product: Product | null;
    ingredients: Ingredient[];
    consumedStock: Map<string, number>;
    selectionIndex: number;
    totalSelections: number;
    onConfirm: (selectedIngredient: IngredientUsage) => void;
}

const VariableIngredientModal: FC<VariableIngredientModalProps> = ({
                                                                       show,
                                                                       onClose,
                                                                       product,
                                                                       ingredients,
                                                                       consumedStock,
                                                                       selectionIndex,
                                                                       totalSelections,
                                                                       onConfirm
                                                                   }) => {
    const [variableItem, setVariableItem] = useState<{ category: string, quantity: number } | null>(null);
    const [availableOptions, setAvailableOptions] = useState<Ingredient[]>([]);
    const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');

    useEffect(() => {
        if (product) {
            const variableRecipeItem = product.recipe.filter(item => item.ingredientId.startsWith('CATEGORY::'))[selectionIndex];
            if (variableRecipeItem) {
                const category = variableRecipeItem.ingredientId.split('::')[1];
                setVariableItem({category, quantity: variableRecipeItem.quantity});
                // Filtramos por categoría y por stock disponible.
                const available = ingredients.filter(ing => {
                    const stockInCart = consumedStock.get(ing.id) || 0;
                    return ing.category === category && (ing.stock || 0) > stockInCart;
                });
                setAvailableOptions(available);
            }
        }
        // Resetear la selección cuando el modal se cierra o cambia el producto
        setSelectedIngredientId('');
    }, [product, ingredients, show, selectionIndex]);

    const handleConfirm = () => {
        if (selectedIngredientId && variableItem) {
            onConfirm({
                ingredientId: selectedIngredientId,
                quantity: variableItem.quantity,
            });
        }
    };

    return (
        <Modal title={`Selecciona el Sabor ${selectionIndex + 1} de ${totalSelections} para: ${product?.name}`}
               show={show} onClose={onClose}>
            <div className="list-group">
                {availableOptions.map(option => (
                    <button
                        key={option.id}
                        type="button"
                        className={`list-group-item list-group-item-action ${selectedIngredientId === option.id ? 'active' : ''}`}
                        onClick={() => setSelectedIngredientId(option.id)}
                    >
                        {option.name}
                    </button>
                ))}
            </div>
            <div className="d-flex justify-content-end mt-3">
                <button className="btn btn-primary" onClick={handleConfirm} disabled={!selectedIngredientId}>Confirmar
                    Selección
                </button>
            </div>
        </Modal>
    );
};

export default VariableIngredientModal;