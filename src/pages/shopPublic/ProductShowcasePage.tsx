import {FC, useEffect, useState} from 'react';
import {useSearchParams, Link, useNavigate} from 'react-router-dom';
import {getPublicProducts} from '../../services/shopPublic/publicProductService';
import {PublicProduct} from '../../types/public.types';
import PublicProductCard from '../../components/shopPublic/PublicProductCard';
import FullScreenLoader from '../../components/shared/FullScreenLoader';
import FloatingCart from '../../components/shopPublic/FloatingCart';
import CartSummaryModal from '../../components/shopPublic/CartSummaryModal';
import {CartProvider, useCart} from '../../context/CartContext';
import {useAuthStore} from '../../store/authStore';
import {useTenant} from '../../context/TenantContext'; // Importante: TenantContext puede no tener datos correctos si no hay ID aún.
import {Search, Grid, GeoAltFill, MoonFill, SunFill} from 'react-bootstrap-icons';
import {useTheme} from '../../context/ThemeContext';
import {createOrder} from '../../services/shop/orderService';
import {getClientFinancials} from '../../services/shopPublic/clientService';
import {NewOrderData} from '../../types/order.types';

// ID de la heladería principal. 
// NOTA: En un sistema multi-tenant real por dominio, esto vendría del subdominio.
// Por ahora, para "Latiendita" hardcodeamos o buscamos la primera, pero idealmente debería ser dinámico.
// Para este MVP, asumiremos que si hay un usuario logueado en caché usamos esa, o si no una default,
// o simplemente pedimos el ID por URL ?shopId=....
// Si no hay ID, mostraremos un mensaje amigable.
// UPDATE: Revisando App.tsx, el tenant context depende de `activeShop` del auth store.
// Sin auth, no hay `activeShop`.
// Solución: Usaremos un ID por defecto para DEMO si no viene en param, o listaremos "tiendas" (fuera de scope).
// Asumiremos un ID de demo conocido o instrucción al usuario.
// Para hacerlo fácil: Si el usuario ya inició sesión alguna vez, quizás quedó algo. Si no, ERROR.
// Mejor approach: Permitir pasar `?shopId=xyz`.

// Wrapper interno para usar useCart sin error
const ProductShowcaseContent: FC<{targetShopId: string | null, DEFAULT_SHOP_ID: string}> = ({targetShopId, DEFAULT_SHOP_ID}) => {
    const [products, setProducts] = useState<PublicProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
    const [error, setError] = useState<string | null>(null);
    const {tenant} = useTenant();
    const {theme, toggleTheme} = useTheme();
    
    // Cart hook
    const {initializeCart} = useCart();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
    const [isCreditEnabled, setIsCreditEnabled] = useState(false);
    const [creditLimit, setCreditLimit] = useState(0);
    const [currentDebt, setCurrentDebt] = useState(0);
    
    // Auth
    const {isAuthenticated, user} = useAuthStore();
    const navigate = useNavigate(); // Necesitamos usar useNavigate del router
    
    useEffect(() => {
        if (targetShopId && targetShopId !== DEFAULT_SHOP_ID) {
            initializeCart(targetShopId);
            // PERSISTENCIA: Guardamos el shopId para que el dashboard sepa qué tienda mostrar
            localStorage.setItem('last_shop_id', targetShopId);
        }
    }, [targetShopId, initializeCart]);


    useEffect(() => {
        const fetchData = async () => {
            if (!targetShopId || targetShopId === DEFAULT_SHOP_ID) {
                setLoading(false);
                return;
            }

            try {
                const data = await getPublicProducts(targetShopId);
                setProducts(data);
                setError(null);
            } catch (err: any) {
                console.error("Error fetching public products", err);
                setError(err.message || "Error desconocido al cargar productos");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [targetShopId]);

    // Checkout Logic
    const {items: cart, totalAmount, totalItems, clearCart} = useCart();

    useEffect(() => {
        if (isAuthenticated && user?.uid) {
            getClientFinancials(user.uid).then(fin => {
                setIsCreditEnabled(fin.isCreditEnabled);
                setCreditLimit(fin.creditLimit || 0);
                setCurrentDebt(fin.debt || 0);
            }).catch(console.error);
        }
    }, [isAuthenticated, user?.uid]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleCheckout = async () => {
        if (isAuthenticated && user) {
            if (paymentMethod === 'credit' && creditLimit > 0) {
                const newDebt = currentDebt + totalAmount;
                if (newDebt > creditLimit) {
                    alert(`¡Cupo de crédito excedido!\n\nTu límite de crédito es de ${formatCurrency(creditLimit)} y tu deuda actual es de ${formatCurrency(currentDebt)}.\nEste pedido por ${formatCurrency(totalAmount)} supera tu cupo disponible.`);
                    return;
                }
            }

            try {
                // 1. Preparar datos del pedido
                const orderData: NewOrderData = {
                    shopId: targetShopId!,
                    clientId: user.uid,
                    clientName: `${user.firstName} ${user.lastName}`,
                    clientPhone: user.phone || 'N/A',
                    items: cart.map(item => ({
                        product: item.product,
                        quantity: item.quantity,
                        priceAtPurchase: item.product.price
                    })),
                    totalAmount: totalAmount,
                    totalItems: totalItems,
                    paymentMethod: paymentMethod
                };

                // 2. Crear pedido - Sanitizamos los datos para evitar errores de Firebase con 'undefined'
                const sanitizedOrderData = JSON.parse(JSON.stringify(orderData));
                await createOrder(sanitizedOrderData);
                
                // 3. Limpiar y notificar
                clearCart();
                setIsCartOpen(false);
                alert("¡Pedido realizado con éxito! Puedes verlo en tu panel.");
                navigate('/client/dashboard');

            } catch (error) {
                console.error("Error al crear pedido:", error);
                alert("Hubo un error al procesar tu pedido. Inténtalo de nuevo.");
            }
        } else {
            // Redirigir a login de CLIENTES con returnUrl
            const returnUrl = encodeURIComponent(`/catalogo?shopId=${targetShopId}&action=checkout`);
            navigate(`/client-login?redirect=${returnUrl}`);
        }
    };

    // Filtrado
    const categories = ['Todas', ...Array.from(new Set(products.map(p => p.category)))];
    
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) return <FullScreenLoader />;

    if (error) {
        return (
            <div className="container py-5 text-center">
                 <h3 className="text-danger mb-3">Error al cargar productos</h3>
                 <p className="text-secondary">{error}</p>
                 <div className="alert alert-warning d-inline-block text-start">
                    <small>
                        <strong>Posible solución:</strong> Revisa las reglas de seguridad de Firebase Firestore. 
                        Asegúrate de que la colección <code>shops/{targetShopId}/productos</code> sea legible públicamente.
                    </small>
                 </div>
                 <br />
                 <Link to="/" className="btn btn-outline-secondary mt-3">Volver al Inicio</Link>
            </div>
        );
    }

    if (!targetShopId || targetShopId === DEFAULT_SHOP_ID) {
        return (
            <div className="container py-5 text-center">
                 <h2 className="fw-bold mb-3 text-body">¡Bienvenido a nuestro Menú Digital!</h2>
                 <p className="text-secondary">Para ver los productos, necesitas escanear el código QR de la tienda o usar un enlace válido.</p>
                 <Link to="/" className="btn btn-primary mt-3">Volver al Inicio</Link>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-body-tertiary">
             {/* Header Hero */}
             <div className="text-white py-5 shadow-sm" style={{backgroundColor: tenant.theme.primaryColor}}>
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-8">
                             <h1 className="fw-bold display-5 mb-2">Nuestro Menú</h1>
                             <p className="lead opacity-75 mb-0">Explora nuestros deliciosos productos, frescos y hechos con amor.</p>
                        </div>
                             <div className="d-flex justify-content-lg-end align-items-center gap-2">
                                <button 
                                    onClick={toggleTheme}
                                    className="btn btn-light rounded-circle shadow-sm p-2 d-flex align-items-center justify-content-center"
                                    style={{width: '42px', height: '42px'}}
                                    title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
                                >
                                    {theme === 'light' ? <MoonFill className="text-secondary"/> : <SunFill className="text-warning"/>}
                                </button>
                                 <div className="badge bg-white text-primary p-3 rounded-pill shadow-sm">
                                    <span className="fw-bold d-flex align-items-center normal-text-color">
                                        <GeoAltFill className="me-2"/>
                                        {tenant.terminology.shopLabel}
                                    </span>
                                 </div>
                             </div>
                    </div>
                </div>
             </div>

             {/* Controles de Filtros */}
             <div className="container my-5">
                <div className="row g-3 mb-4 sticky-top bg-body-tertiary py-2" style={{zIndex: 10}}>
                     <div className="col-md-6">
                        <div className="input-group shadow-sm">
                            <span className="input-group-text bg-body border-end-0">
                                <Search className="text-secondary"/>
                            </span>
                            <input 
                                type="text" 
                                className="form-control border-start-0 ps-0" 
                                placeholder="Buscar productos..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                     </div>
                     <div className="col-md-6">
                        <div className="d-flex overflow-auto pb-2 gap-2" style={{whiteSpace: 'nowrap'}}>
                            {categories.map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`btn rounded-pill px-4 fw-medium ${selectedCategory === cat ? 'btn-primary' : 'btn-outline-secondary border-0 bg-body'}`}
                                    style={selectedCategory === cat ? {backgroundColor: tenant.theme.primaryColor, borderColor: tenant.theme.primaryColor} : {}}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                     </div>
                </div>

                {/* Grid de Productos */}
                {filteredProducts.length > 0 ? (
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4 pb-5">
                        {filteredProducts.map(product => (
                            <div className="col" key={product.id}>
                                <PublicProductCard product={product} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-5 text-secondary">
                        <Grid size={48} className="mb-3 opacity-25"/>
                        <h4>No encontramos productos</h4>
                        <p>Intenta con otra búsqueda o categoría.</p>
                    </div>
                )}
             </div>
             
             {/* Footer simple */}
             <footer className="text-center py-4 text-secondary small border-top bg-body mt-auto">
                 <p className="mb-0">Powered by <strong>{tenant.terminology.shopLabel}</strong></p>
             </footer>

             {/* Componentes del Carrito */}
             <FloatingCart onClick={() => setIsCartOpen(true)} />
             <CartSummaryModal 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)} 
                onCheckout={handleCheckout} 
                paymentMethod={paymentMethod}
                onChangePaymentMethod={setPaymentMethod}
                isCreditEnabled={isCreditEnabled}
             />
        </div>
    );
};

const ProductShowcasePage: FC = () => {
    const [searchParams] = useSearchParams();
    const shopIdFromUrl = searchParams.get('shopId');
    const DEFAULT_SHOP_ID = "DEMO_SHOP_ID_PLACEHOLDER";
    
    // Necesitamos envolver el contenido en el Provider
    return (
        <CartProvider>
            <ProductShowcaseContent 
                targetShopId={shopIdFromUrl || DEFAULT_SHOP_ID} 
                DEFAULT_SHOP_ID={DEFAULT_SHOP_ID} 
            />
        </CartProvider>
    );
};

export default ProductShowcasePage;
