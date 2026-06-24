import {FC} from 'react';
import {Basket} from 'react-bootstrap-icons';
import {useCart} from '../../context/CartContext';
import {useTenant} from '../../context/TenantContext';

interface FloatingCartProps {
    onClick: () => void;
}

const FloatingCart: FC<FloatingCartProps> = ({onClick}) => {
    const {totalItems, totalAmount} = useCart();
    const {tenant} = useTenant();

    if (totalItems === 0) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <button 
            onClick={onClick}
            className="position-fixed bottom-0 end-0 m-4 btn rounded-pill shadow-lg d-flex align-items-center gap-2 p-3 text-white border-0 z-3 floating-cart-btn"
            style={{
                backgroundColor: tenant.theme.primaryColor,
                zIndex: 1050, // Above everything
                animation: 'bounceIn 0.5s'
            }}
        >
            <div className="position-relative">
                <Basket size={24} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white">
                    {totalItems}
                </span>
            </div>
            <div className="d-flex flex-column align-items-start ms-2 lh-1 text-start">
                <span className="small fw-bold">Ver Pedido</span>
                <span className="small opacity-75">{formatCurrency(totalAmount)}</span>
            </div>
        </button>
    );
};

export default FloatingCart;
