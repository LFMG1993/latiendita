import {FC} from 'react';
import {PublicProduct} from '../../types/public.types';
import {TagFill, CartPlus, Plus, Dash} from 'react-bootstrap-icons';
import { useTenant } from '../../context/TenantContext';
import { useCart } from '../../context/CartContext';

interface PublicProductCardProps {
    product: PublicProduct;
}

const PublicProductCard: FC<PublicProductCardProps> = ({product}) => {
    const { tenant } = useTenant();
    const { addToCart, items, decreaseQuantity } = useCart();
    
    // Check if item in cart
    const cartItem = items.find(item => item.product.id === product.id);
    const quantity = cartItem ? cartItem.quantity : 0;
    
    // Formato de moneda
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="card h-100 shadow-sm border-0 product-card hover-lift bg-body">
            <div className="position-relative">
                 {/* Placeholder de imagen o imagen real */}
                <div style={{
                    height: '200px', 
                    backgroundColor: 'var(--bs-tertiary-bg)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderTopLeftRadius: '0.375rem',
                    borderTopRightRadius: '0.375rem',
                    overflow: 'hidden'
                }}>
                    {product.imageURL ? (
                        <img src={product.imageURL} alt={product.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    ) : (
                        <TagFill size={48} className="text-secondary opacity-25" />
                    )}
                </div>
                <div className="card-badge position-absolute top-0 end-0 m-3 badge rounded-pill bg-body-secondary text-body shadow-sm">
                   {product.category}
                </div>
            </div>

            <div className="card-body d-flex flex-column">
                <h5 className="card-title fw-bold mb-2 text-body">{product.name}</h5>
                {product.description && (
                    <p className="card-text text-secondary small mb-3 flex-grow-1">
                        {product.description}
                    </p>
                )}
                
                <div className="mt-auto d-flex justify-content-between align-items-center pt-3 border-top">
                    <span className="h5 mb-0 fw-bold" style={{color: tenant.theme.primaryColor}}>
                        {formatCurrency(product.price)}
                    </span>
                    
                    {quantity === 0 ? (
                        <button 
                            className="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-2" 
                            title="Añadir al carrito"
                            onClick={() => addToCart(product)}
                        >
                            <span>Añadir</span>
                            <CartPlus size={20} />
                        </button>
                    ) : (
                        <div className="d-flex align-items-center bg-body-tertiary rounded-pill border">
                            <button 
                                className="btn btn-sm btn-link text-secondary p-0 px-2"
                                onClick={() => decreaseQuantity(product.id)}
                            >
                                <Dash size={18}/>
                            </button>
                            <span className="fw-bold px-1 text-body small">{quantity}</span>
                             <button 
                                className="btn btn-sm btn-link text-primary p-0 px-2"
                                onClick={() => addToCart(product)}
                            >
                                <Plus size={18}/>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicProductCard;
