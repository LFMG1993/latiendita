import {FC, useEffect, useState} from 'react';
import {useAuthStore} from '../../store/authStore';
import {getClientFinancials, ClientFinancials} from '../../services/clientService';
import {getClientOrders} from '../../services/orderService';
import {Order} from '../../types/order.types';
import FullScreenLoader from '../../components/general/FullScreenLoader';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Wallet2, Receipt, ClockHistory, BoxArrowRight, GeoAltFill, MoonFill, SunFill, Plus, Dash, CartFill} from 'react-bootstrap-icons';
import {useTenant} from '../../context/TenantContext';
import {useTheme} from '../../context/ThemeContext';
import {getPublicProducts} from '../../services/publicProductService';
import {PublicProduct} from '../../types/public.types';
import {createOrder} from '../../services/orderService';

const ClientDashboardPage: FC = () => {
    const {user} = useAuthStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {tenant} = useTenant();
    const {theme, toggleTheme} = useTheme();
    
    const [financials, setFinancials] = useState<ClientFinancials>({credits: 0, debt: 0, isCreditEnabled: false});
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'order'>('order');

    // Estado para pedidos desde el dashboard
    const [products, setProducts] = useState<PublicProduct[]>([]);
    const [cart, setCart] = useState<{product: PublicProduct, quantity: number}[]>([]);
    const [submittingOrder, setSubmittingOrder] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user) return;
            
            try {
                // 1. Obtener datos básicos
                const [finData, ordersData] = await Promise.all([
                    getClientFinancials(user.uid),
                    getClientOrders(user.uid)
                ]);
                
                setFinancials(finData);
                setOrders(ordersData);

                // 2. Determinar shopId con resiliencia
                const urlShopId = searchParams.get('shopId');
                const localShopId = localStorage.getItem('last_shop_id');
                // Si no hay en URL ni local, buscamos en el último pedido
                const lastOrderShopId = ordersData.length > 0 ? ordersData[0].shopId : null;
                
                const shopId = urlShopId || localShopId || lastOrderShopId || user.iceCreamShopIds?.[0];

                if (shopId) {
                    if (!localShopId) localStorage.setItem('last_shop_id', shopId);
                    const productsData = await getPublicProducts(shopId);
                    setProducts(productsData);
                }
            } catch (err) {
                console.error("Error cargando dashboard:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [user, searchParams]);

    if (loading) return <FullScreenLoader />;

    const pendingOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
    const historyOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));
    const currentList = activeTab === 'pending' ? pendingOrders : historyOrders;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP', minimumFractionDigits: 0}).format(amount);
    };

    const addToCart = (product: PublicProduct) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) {
                return prev.map(i => i.product.id === product.id ? {...i, quantity: i.quantity + 1} : i);
            }
            return [...prev, {product, quantity: 1}];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.product.id === productId) {
                const newQty = Math.max(1, i.quantity + delta);
                return {...i, quantity: newQty};
            }
            return i;
        }));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (!user || cart.length === 0) return;
        
        const urlShopId = searchParams.get('shopId');
        const localShopId = localStorage.getItem('last_shop_id');
        const shopId = urlShopId || localShopId || user.iceCreamShopIds?.[0];
        
        if (!shopId) {
            alert("No se pudo identificar la tienda. Por favor escanea el código QR de nuevo.");
            return;
        }

        setSubmittingOrder(true);
        try {
            const orderData = {
                shopId,
                clientId: user.uid,
                clientName: `${user.firstName} ${user.lastName}`,
                clientPhone: user.phone || 'N/A',
                items: cart.map(item => ({
                    product: item.product,
                    quantity: item.quantity,
                    priceAtPurchase: item.product.price
                })),
                totalAmount: cartTotal,
                totalItems: cart.reduce((sum, i) => sum + i.quantity, 0),
                paymentMethod: paymentMethod
            };

            await createOrder(orderData);
            
            // Actualizar vista
            const [newFin, newOrders] = await Promise.all([
                getClientFinancials(user.uid),
                getClientOrders(user.uid)
            ]);
            setFinancials(newFin);
            setOrders(newOrders);
            setCart([]);
            setActiveTab('pending');
            alert("¡Pedido realizado con éxito!");
        } catch (error) {
            console.error(error);
            alert("Error al procesar el pedido.");
        } finally {
            setSubmittingOrder(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'pending': return <span className="badge bg-warning text-dark">Pendiente</span>;
            case 'preparing': return <span className="badge bg-info text-dark">Preparando</span>;
            case 'ready': return <span className="badge bg-primary">Listo</span>;
            case 'delivered': return <span className="badge bg-success">Entregado</span>;
            case 'cancelled': return <span className="badge bg-danger">Cancelado</span>;
            default: return <span className="badge bg-secondary">{status}</span>;
        }
    };

    return (
        <div className="min-vh-100 bg-body-tertiary">
            {/* Navbar Simple */}
            <nav className="navbar navbar-expand-lg navbar-dark shadow-sm" style={{backgroundColor: tenant.theme.primaryColor}}>
                <div className="container">
                    <span className="navbar-brand fw-bold d-flex align-items-center">
                        <GeoAltFill className="me-2"/>
                        {tenant.terminology.shopLabel}
                    </span>
                    <div className="d-flex gap-2">
                        <button 
                            onClick={toggleTheme}
                            className="btn btn-outline-light btn-sm d-flex align-items-center justify-content-center"
                            style={{width: '32px', height: '32px'}}
                            title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
                        >
                            {theme === 'light' ? <MoonFill/> : <SunFill/>}
                        </button>
                        <button className="btn btn-outline-light btn-sm d-flex align-items-center" onClick={() => navigate('/catalogo')}>
                            <BoxArrowRight className="me-2"/>
                            Volver al Menú
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container py-4">
                {/* Header Bienvenida */}
                <div className="row mb-4">
                    <div className="col-12">
                        <h2 className="fw-bold mb-0">Hola, {user?.firstName}</h2>
                        <p className="text-secondary">Este es tu resumen de cuenta y pedidos.</p>
                    </div>
                </div>

                {/* Resumen Financiero */}
                <div className="row g-3 mb-4">
                    <div className="col-md-6">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body d-flex align-items-center">
                                <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                                    <Wallet2 className="text-success" size={24}/>
                                </div>
                                <div>
                                    <h6 className="text-muted mb-1">Saldo a Favor (Créditos)</h6>
                                    <h3 className="mb-0 fw-bold text-success">{formatCurrency(financials.credits)}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body d-flex align-items-center">
                                <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                                    <Receipt className="text-danger" size={24}/>
                                </div>
                                <div>
                                    <h6 className="text-muted mb-1">Deuda Pendiente</h6>
                                    <h3 className="mb-0 fw-bold text-danger">{formatCurrency(financials.debt)}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs de Pedidos */}
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-bottom-0 pt-4 px-4">
                        <ul className="nav nav-tabs card-header-tabs">
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === 'order' ? 'active fw-bold' : 'text-secondary'}`}
                                    onClick={() => setActiveTab('order')}
                                >
                                    Hacer Pedido
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === 'pending' ? 'active fw-bold' : 'text-secondary'}`}
                                    onClick={() => setActiveTab('pending')}
                                >
                                    Mis Pedidos ({pendingOrders.length})
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === 'history' ? 'active fw-bold' : 'text-secondary'}`}
                                    onClick={() => setActiveTab('history')}
                                >
                                    Historial
                                </button>
                            </li>
                        </ul>
                    </div>
                    <div className="card-body p-0">
                        {activeTab === 'order' ? (
                            <div className="row g-0">
                                {/* Lista de Productos */}
                                <div className="col-lg-8 border-end p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="fw-bold mb-0">Nuestro Menú</h5>
                                        <div className="d-flex gap-2 overflow-auto pb-1" style={{maxWidth: '60%'}}>
                                            {['Todas', ...Array.from(new Set(products.map(p => p.category)))].map(cat => (
                                                <button 
                                                    key={cat}
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className={`btn btn-sm rounded-pill px-3 ${selectedCategory === cat ? 'btn-primary' : 'btn-outline-secondary border-0 bg-body-tertiary'}`}
                                                    style={selectedCategory === cat ? {backgroundColor: tenant.theme.primaryColor, borderColor: tenant.theme.primaryColor} : {}}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="row g-3">
                                        {products.length > 0 ? (
                                            products.filter(p => selectedCategory === 'Todas' || p.category === selectedCategory).map(product => (
                                                <div key={product.id} className="col-md-6 col-xl-4">
                                                    <div className="card border-0 shadow-sm h-100 bg-body-tertiary">
                                                        <div className="card-body p-3">
                                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                                <h6 className="fw-bold mb-0 text-truncate" style={{maxWidth: '70%'}}>{product.name}</h6>
                                                                <span className="badge bg-primary bg-opacity-10 text-primary">{formatCurrency(product.price)}</span>
                                                            </div>
                                                            <p className="small text-muted mb-3 text-truncate-2" style={{height: '40px'}}>{product.description}</p>
                                                            <button 
                                                                className="btn btn-sm w-100 fw-bold rounded-pill" 
                                                                style={{backgroundColor: tenant.theme.primaryColor, color: '#fff'}}
                                                                onClick={() => addToCart(product)}
                                                            >
                                                                <Plus className="me-1"/> Agregar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-12 text-center py-5">
                                                <p className="text-secondary">No hay productos disponibles en este momento.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Carrito Lateral */}
                                <div className="col-lg-4 p-4 bg-body">
                                    <h5 className="fw-bold mb-4 d-flex align-items-center">
                                        <CartFill className="me-2 text-primary"/> Tu Carrito
                                    </h5>
                                    
                                    {cart.length > 0 ? (
                                        <>
                                            <div className="mb-4" style={{maxHeight: '300px', overflowY: 'auto'}}>
                                                {cart.map(item => (
                                                    <div key={item.product.id} className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom border-light">
                                                        <div className="flex-grow-1 min-w-0">
                                                            <div className="fw-bold small text-truncate text-body">{item.product.name}</div>
                                                            <div className="small text-primary fw-bold">{formatCurrency(item.product.price * item.quantity)}</div>
                                                        </div>
                                                        <div className="d-flex align-items-center bg-body-tertiary rounded-pill px-2 py-1 ms-3">
                                                            <button className="btn btn-sm p-0 text-muted" onClick={() => updateQuantity(item.product.id, -1)}><Dash/></button>
                                                            <span className="mx-2 small fw-bold text-body">{item.quantity}</span>
                                                            <button className="btn btn-sm p-0 text-primary" onClick={() => updateQuantity(item.product.id, 1)}><Plus/></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="bg-body-tertiary p-3 rounded-4 mb-4">
                                                <label className="form-label small fw-bold text-muted text-uppercase mb-3">Método de Pago</label>
                                                <div className="d-flex flex-column gap-2">
                                                    <button 
                                                        className={`btn btn-sm text-start d-flex align-items-center justify-content-between p-2 rounded-3 border-2 ${paymentMethod === 'cash' ? 'border-primary bg-primary bg-opacity-10' : 'border-light bg-body'}`}
                                                        onClick={() => setPaymentMethod('cash')}
                                                        style={paymentMethod === 'cash' ? {borderColor: tenant.theme.primaryColor} : {}}
                                                    >
                                                        <span className={`small fw-bold ${paymentMethod === 'cash' ? 'text-primary' : 'text-body'}`}>Efectivo</span>
                                                        {paymentMethod === 'cash' && <div className="rounded-circle bg-primary" style={{width: '8px', height: '8px', backgroundColor: tenant.theme.primaryColor}}></div>}
                                                    </button>
                                                    {financials.isCreditEnabled && (
                                                        <button 
                                                            className={`btn btn-sm text-start d-flex align-items-center justify-content-between p-2 rounded-3 border-2 ${paymentMethod === 'credit' ? 'border-danger bg-danger bg-opacity-10' : 'border-light bg-body'}`}
                                                            onClick={() => setPaymentMethod('credit')}
                                                        >
                                                            <span className={`small fw-bold ${paymentMethod === 'credit' ? 'text-danger' : 'text-body'}`}>Fiado (Crédito)</span>
                                                            {paymentMethod === 'credit' && <div className="rounded-circle bg-danger" style={{width: '8px', height: '8px'}}></div>}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center mb-4">
                                                <h6 className="mb-0 text-secondary">Total a pagar:</h6>
                                                <h4 className="mb-0 fw-bold text-body">{formatCurrency(cartTotal)}</h4>
                                            </div>

                                            <button 
                                                className="btn btn-primary w-100 py-3 fw-bold rounded-pill shadow-sm"
                                                style={{backgroundColor: tenant.theme.primaryColor, borderColor: tenant.theme.primaryColor}}
                                                onClick={handleCheckout}
                                                disabled={submittingOrder}
                                            >
                                                {submittingOrder ? 'Procesando...' : 'Confirmar Pedido'}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-center py-5 bg-body-tertiary rounded-4">
                                            <CartFill size={32} className="text-muted opacity-25 mb-3"/>
                                            <p className="small text-muted px-4">Selecciona productos del menú para comenzar tu pedido.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : currentList.length > 0 ? (
                            <div className="list-group list-group-flush">
                                {currentList.map(order => (
                                    <div key={order.id} className="list-group-item p-4">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="fw-bold">Pedido #{order.id.slice(-6).toUpperCase()}</span>
                                                {getStatusBadge(order.status)}
                                                {order.paymentMethod === 'credit' && order.status !== 'delivered' && (order.pendingDebt || 0) > 0 && (
                                                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 shadow-sm" style={{fontSize: '0.75rem'}}>
                                                        Pendiente de cobro
                                                    </span>
                                                )}
                                            </div>
                                            <small className="text-secondary">
                                                {order.createdAt?.toDate().toLocaleDateString()} {order.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </small>
                                        </div>
                                        <div className="mb-2">
                                            <p className="mb-1 small text-secondary">Items: {order.totalItems}</p>
                                            <ul className="list-unstyled mb-0 small text-muted ps-2 border-start">
                                                {order.items.map((item, idx) => (
                                                    <li key={idx}>{item.quantity}x {item.product.name}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                                            <div className="d-flex flex-column">
                                                <span className="small text-muted">Pago: {order.paymentMethod === 'credit' ? 'Fiado / Crédito' : 'Efectivo / Transferencia'}</span>
                                                {order.paymentMethod === 'credit' && (order.usedCredits || 0) > 0 && (
                                                    <span className="small text-success fw-medium">Cubierto con saldo: -{formatCurrency(order.usedCredits!)}</span>
                                                )}
                                            </div>
                                            <div className="text-end">
                                                <span className="fw-bold fs-5">{formatCurrency(order.totalAmount)}</span>
                                                {order.paymentMethod === 'credit' && order.status !== 'delivered' && (order.pendingDebt || 0) > 0 && (
                                                    <div className="small text-danger fw-bold" style={{marginTop: '-2px'}}>Por cobrar: {formatCurrency(order.pendingDebt!)}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <ClockHistory size={32} className="text-muted opacity-50 mb-3"/>
                                <p className="text-secondary">No hay pedidos en esta sección.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboardPage;
