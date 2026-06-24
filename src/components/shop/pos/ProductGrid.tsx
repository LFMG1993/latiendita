import {FC, useMemo, useState} from "react";
import {SellableProduct, Ingredient} from "../../../types";
import '../../style/ProductGrid.css';

interface ProductGridProps {
    products: SellableProduct[];
    ingredients: Ingredient[];
    onProductSelect: (product: SellableProduct) => void;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP', maximumFractionDigits: 0}).format(value);

const ProductGrid: FC<ProductGridProps> = ({products, onProductSelect}) => {
    const categories = useMemo(() => {
        const cats = Array.from(new Set(products.map(p => p.category || 'Sin Categoría')));
        return ['Todos', ...cats];
    }, [products]);

    const [activeCategory, setActiveCategory] = useState('Todos');

    const filteredProducts = useMemo(() => {
        if (activeCategory === 'Todos') return products;
        return products.filter(p => (p.category || 'Sin Categoría') === activeCategory);
    }, [products, activeCategory]);

    return (
        <div>
            {/* Filtros de categoría */}
            <div
                className="d-flex align-items-center gap-2 mb-4 pb-2"
                style={{overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none'}}
            >
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className="product-category-chip"
                        style={{
                            padding: '6px 18px',
                            borderRadius: '999px',
                            border: '2px solid',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'all 0.18s ease',
                            borderColor: activeCategory === cat ? 'var(--bs-primary)' : 'var(--bs-border-color)',
                            background: activeCategory === cat ? 'var(--bs-primary)' : 'transparent',
                            color: activeCategory === cat ? '#fff' : 'var(--bs-body-color)',
                            boxShadow: activeCategory === cat ? '0 3px 10px rgba(13,110,253,0.3)' : 'none',
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid de productos */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '12px',
                }}
            >
                {filteredProducts.map(product => {
                    const available = product.isAvailable;
                    return (
                        <div
                            key={product.id}
                            className={`product-card-new ${!available ? 'product-card-disabled' : ''}`}
                            title={!available ? 'Sin stock suficiente' : product.name}
                            onClick={() => {
                                if (available) onProductSelect(product);
                            }}
                        >
                            {/* Emoji / Initial */}
                            <div className="product-card-emoji">
                                {product.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="product-card-name">{product.name}</div>
                            <div className="product-card-price">{formatCurrency(product.price)}</div>
                            {!available && (
                                <div className="product-card-unavailable-badge">Sin stock</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-5 text-muted">
                    <div style={{fontSize: '2rem', opacity: 0.3}}>🛒</div>
                    <p className="mt-2 small">No hay productos en esta categoría</p>
                </div>
            )}
        </div>
    );
};

export default ProductGrid;