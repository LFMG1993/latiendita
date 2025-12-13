import {FC, useState, useEffect, FormEvent, useMemo} from 'react';
import {NewProductData, RecipeItem, EnrichedIngredient, Product, UpdateProductData} from "../../types";
import {addProduct, updateProduct} from "../../services/productServices.ts";
import {Trash} from "react-bootstrap-icons";

interface ProductFormProps {
    shopId: string;
    onFormSubmit: () => void;
    productToEdit?: Product | null;
    availableIngredients: EnrichedIngredient[];
}

const ProductForm: FC<ProductFormProps> = ({shopId, onFormSubmit, productToEdit, availableIngredients}) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [category, setCategory] = useState('');
    const [recipe, setRecipe] = useState<RecipeItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculamos dinámicamente las categorías únicas a partir de los ingredientes disponibles.
    const uniqueCategories = useMemo(() => {
        const categories = availableIngredients.map(ing => ing.category).filter(Boolean); // Filtra categorías vacías
        return [...new Set(categories)]; // Devuelve un array de categorías únicas
    }, [availableIngredients]);

    // Efecto para rellenar el formulario si estamos en modo edición
    useEffect(() => {
        if (productToEdit) {
            setName(productToEdit.name);
            setPrice(productToEdit.price);
            setCategory(productToEdit.category || '');
            setRecipe(productToEdit.recipe || []);
        } else {
            // Resetea el formulario si no hay producto para editar (modo creación)
            setName('');
            setPrice(0);
            setCategory('');
            setRecipe([]);
        }
    }, [productToEdit]);

    // --- Manejadores de la Receta Dinámica ---
    const handleAddRecipeItem = () => {
        setRecipe([...recipe, {ingredientId: '', quantity: 0}]);
    };

    const handleRemoveRecipeItem = (index: number) => {
        const newRecipe = recipe.filter((_, i) => i !== index);
        setRecipe(newRecipe);
    };

    const handleRecipeChange = (index: number, field: keyof RecipeItem, value: string | number) => {
        const newRecipe = recipe.map((item, i) => {
            if (i === index) {
                return {...item, [field]: value};
            }
            return item;
        });
        setRecipe(newRecipe);
    };

    // --- Manejador del Envío del Formulario ---
    const calculateRecipeCost = (): number => {
        const ingredientsMap = new Map(availableIngredients.map(ing => [ing.id, ing]));
        return recipe.reduce((total, item) => {
            // Ignoramos las categorías variables en el cálculo de costo base
            if (item.ingredientId.startsWith('CATEGORY::')) return total;

            const ingredient = ingredientsMap.get(item.ingredientId);
            if (!ingredient) return total;

            // Asumimos que el costo del ingrediente está en su 'purchaseUnit'.
            // Necesitamos el costo por 'consumptionUnit'.
            const costPerPurchaseUnit = ingredient.cost || 0;
            const unitsPerPurchase = ingredient.consumptionUnitsPerPurchaseUnit || 1;
            const costPerConsumptionUnit = costPerPurchaseUnit / unitsPerPurchase;

            return total + (costPerConsumptionUnit * item.quantity);
        }, 0);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const calculatedCost = calculateRecipeCost();

        const productData: NewProductData | UpdateProductData = {
            name, price, category, recipe,
            cost: calculatedCost
        };

        try {
            if (productToEdit) {
                await updateProduct(shopId, productToEdit.id, productData as UpdateProductData);
            } else {
                await addProduct(shopId, productData as NewProductData);
            }
            onFormSubmit(); // Llama a la función del padre para cerrar el modal y recargar
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al guardar el producto.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="row mb-3">
                <div className="col-md-6">
                    <label htmlFor="productName" className="form-label">Nombre del Producto</label>
                    <input type="text" id="productName" className="form-control" value={name}
                           onChange={(e) => setName(e.target.value)} required/>
                </div>
                <div className="col-md-3">
                    <label htmlFor="price" className="form-label">Precio de Venta</label>
                    <input type="number" id="price" className="form-control" value={price}
                           onChange={(e) => setPrice(Number(e.target.value))} required/>
                </div>
                <div className="col-md-3">
                    <label htmlFor="category" className="form-label">Categoría</label>
                    <input type="text" id="category" className="form-control" value={category}
                           onChange={(e) => setCategory(e.target.value)} placeholder="Ej: Bebidas, Postres"/>
                </div>
            </div>

            <hr/>

            <h5>Receta</h5>
            {recipe.map((item, index) => (
                <div key={index} className="row g-2 mb-2 align-items-center">
                    <div className="col-6">
                        <select
                            className="form-select"
                            value={item.ingredientId}
                            onChange={(e) => handleRecipeChange(index, 'ingredientId', e.target.value)}
                            required
                        >
                            <option value="" disabled>Selecciona...</option>
                            <optgroup label="Categorías de Ingredientes (Variable)">
                                {uniqueCategories.map(category => (
                                    <option key={`cat-${category}`} value={`CATEGORY::${category}`}>
                                        Cualquier {category}
                                    </option>
                                ))}
                            </optgroup>
                            <optgroup label="Ingredientes Específicos (Fijo)">
                                {availableIngredients.map(ing => (
                                    <option key={ing.id} value={ing.id}>
                                        {ing.name} ({ing.consumptionUnit})
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                    <div className="col-4">
                        <input
                            type="number"
                            className="form-control"
                            placeholder="Cantidad"
                            value={item.quantity}
                            onChange={(e) => handleRecipeChange(index, 'quantity', Number(e.target.value))}
                            required
                        />
                    </div>
                    <div className="col-2">
                        <button type="button" className="btn btn-outline-danger"
                                onClick={() => handleRemoveRecipeItem(index)}>
                            <Trash/>
                        </button>
                    </div>
                </div>
            ))}

            <button type="button" className="btn btn-sm btn-outline-secondary mb-3" onClick={handleAddRecipeItem}>
                + Añadir Ingrediente
            </button>

            <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Producto'}
                </button>
            </div>
        </form>
    );
};

export default ProductForm;