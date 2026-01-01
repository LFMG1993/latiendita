import {FC} from 'react';
import {useCart} from '../../context/CartContext';
import {useTenant} from '../../context/TenantContext';
import {Plus, Dash, Basket} from 'react-bootstrap-icons';

import {useAuthStore} from '../../store/authStore';

interface CartSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCheckout: () => void;
    paymentMethod: 'cash' | 'credit';
    onChangePaymentMethod: (method: 'cash' | 'credit') => void;
    isCreditEnabled: boolean;
}

const CartSummaryModal: FC<CartSummaryModalProps> = ({
    isOpen, 
    onClose, 
    onCheckout, 
    paymentMethod, 
    onChangePaymentMethod,
    isCreditEnabled
}) => {
    const {items, totalAmount, addToCart, decreaseQuantity, removeFromCart} = useCart();
    const {tenant} = useTenant();
    const {isAuthenticated} = useAuthStore();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="offcanvas offcanvas-end show" tabIndex={-1} style={{visibility: 'visible', zIndex: 1050}} data-bs-backdrop="true">
                <div className="offcanvas-header border-bottom">
                    <h5 className="offcanvas-title fw-bold">Tu Pedido</h5>
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                </div>
                <div className="offcanvas-body d-flex flex-column bg-body-tertiary p-0">
                    {items.length === 0 ? (
                        <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center p-4 text-center text-secondary">
                            <Basket size={48} className="mb-3 opacity-25" />
                            <p>Tu carrito está vacío</p>
                            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>
                                Volver al menú
                            </button>
                        </div>
                    ) : (
                        <div className="flex-grow-1 overflow-auto p-3">
                            {items.map(item => (
                                <div key={item.product.id} className="card border-0 shadow-sm mb-3 bg-body">
                                    <div className="card-body p-3 d-flex align-items-center gap-3">
                                        {/* Imagen mini */}
                                        <div className="rounded bg-body-secondary d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '60px', height: '60px', overflow: 'hidden'}}>
                                            {item.product.imageURL ? (
                                                <img src={item.product.imageURL} alt={item.product.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                            ) : (
                                                <span className="text-secondary small">Img</span>
                                            )}
                                        </div>
                                        
                                        {/* Info */}
                                        <div className="flex-grow-1 min-w-0">
                                            <h6 className="mb-1 text-truncate text-body fw-bold">{item.product.name}</h6>
                                            <div className="text-primary small fw-bold">
                                                {formatCurrency(item.product.price * item.quantity)}
                                            </div>
                                        </div>

                                        {/* Controles */}
                                        <div className="d-flex flex-column align-items-end gap-2">
                                            <div className="d-flex align-items-center bg-body-secondary rounded-pill p-1">
                                                <button 
                                                    className="btn btn-sm btn-link text-secondary p-0 px-1" 
                                                    onClick={() => decreaseQuantity(item.product.id)}
                                                >
                                                    <Dash size={16}/>
                                                </button>
                                                <span className="mx-2 small fw-bold text-body" style={{minWidth: '20px', textAlign: 'center'}}>{item.quantity}</span>
                                                <button 
                                                    className="btn btn-sm btn-link text-primary p-0 px-1"
                                                    onClick={() => addToCart(item.product)}
                                                >
                                                    <Plus size={16}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {items.length > 0 && (
                    <div className="offcanvas-footer p-3 bg-body border-top shadow-lg z-2">
                        {/* Selector de Método de Pago */}
                        {isAuthenticated && (
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-muted text-uppercase mb-2">Método de Pago</label>
                                <div className="d-flex flex-column gap-2">
                                    <button 
                                        className={`btn text-start d-flex align-items-center justify-content-between p-3 rounded-3 border-2 ${paymentMethod === 'cash' ? 'border-primary bg-primary bg-opacity-10' : 'border-light bg-body-secondary'}`}
                                        onClick={() => onChangePaymentMethod('cash')}
                                        style={paymentMethod === 'cash' ? {borderColor: tenant.theme.primaryColor} : {}}
                                    >
                                        <div>
                                            <div className={`fw-bold ${paymentMethod === 'cash' ? 'text-primary' : 'text-body'}`} style={paymentMethod === 'cash' ? {color: tenant.theme.primaryColor} : {}}>Efectivo</div>
                                            <div className="small text-muted">Paga al recibir o retirar</div>
                                        </div>
                                        {paymentMethod === 'cash' && <div className="rounded-circle bg-primary" style={{width: '12px', height: '12px', backgroundColor: tenant.theme.primaryColor}}></div>}
                                    </button>

                                    {isCreditEnabled && (
                                        <button 
                                            className={`btn text-start d-flex align-items-center justify-content-between p-3 rounded-3 border-2 ${paymentMethod === 'credit' ? 'border-danger bg-danger bg-opacity-10' : 'border-light bg-body-secondary'}`}
                                            onClick={() => onChangePaymentMethod('credit')}
                                        >
                                            <div>
                                                <div className={`fw-bold ${paymentMethod === 'credit' ? 'text-danger' : 'text-body'}`}>Fiado (A Crédito)</div>
                                                <div className="small text-muted">Se cargará a tu cuenta pendiente</div>
                                            </div>
                                            {paymentMethod === 'credit' && <div className="rounded-circle bg-danger" style={{width: '12px', height: '12px'}}></div>}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="text-secondary">Total</span>
                            <span className="h4 mb-0 fw-bold text-body">{formatCurrency(totalAmount)}</span>
                        </div>
                        <button 
                            className="btn w-100 py-3 fw-bold shadow-sm d-flex justify-content-between align-items-center px-4"
                            style={{
                                backgroundColor: tenant.theme.primaryColor, 
                                borderColor: tenant.theme.primaryColor,
                                color: '#fff'
                            }}
                            onClick={onCheckout}
                        >
                            <span>Confirmar Pedido</span>
                            <span>{formatCurrency(totalAmount)}</span>
                        </button>
                    </div>
                )}
            </div>
            
            {/* Backdrop simple para cerrar al hacer clic fuera */}
            {isOpen && (
                <div 
                    className="modal-backdrop fade show" 
                    style={{zIndex: 1040}} 
                    onClick={onClose}
                ></div>
            )}
        </>
    );
};

export default CartSummaryModal;
