import {FC, useEffect, useState} from 'react';
import {useAuthStore} from '../../store/authStore';
import {getClientFinancials, ClientFinancials} from '../../services/clientService';
import {getClientOrders} from '../../services/orderService';
import {Order} from '../../types/order.types';
import {PaymentMethod, DebtPaymentRequest} from '../../types';
import {getActivePaymentMethods} from '../../services/paymentMethodServices';
import {getClientDebtPayments, createDebtPaymentRequest} from '../../services/debtPaymentService';
import FullScreenLoader from '../../components/general/FullScreenLoader';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Wallet2, Receipt, ClockHistory, BoxArrowRight, GeoAltFill, MoonFill, SunFill, Plus, Dash, CartFill, PersonCircle, CheckLg, KeyFill} from 'react-bootstrap-icons';
import {useTenant} from '../../context/TenantContext';
import {useTheme} from '../../context/ThemeContext';
import {getPublicProducts, getAllPublicShops} from '../../services/publicProductService';
import {PublicProduct} from '../../types/public.types';
import {createOrder} from '../../services/orderService';
import {auth} from '../../firebase';
import {signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential} from 'firebase/auth';
import {doc, updateDoc} from 'firebase/firestore';
import {db} from '../../firebase';
import {useToast} from '../../context/ToastContext';

const ClientDashboardPage: FC = () => {
    const {user} = useAuthStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {tenant} = useTenant();
    const {theme, toggleTheme} = useTheme();
    const {showToast} = useToast();
    
    const [financials, setFinancials] = useState<ClientFinancials>({credits: 0, debt: 0, isCreditEnabled: false});
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'order' | 'profile' | 'debt_payments'>('order');

    // Estado para pagos de deuda
    const [debtPaymentsList, setDebtPaymentsList] = useState<DebtPaymentRequest[]>([]);
    const [paymentMethodsList, setPaymentMethodsList] = useState<PaymentMethod[]>([]);
    const [showDebtModal, setShowDebtModal] = useState(false);
    const [debtPaymentAmount, setDebtPaymentAmount] = useState('');
    const [debtPaymentMethodId, setDebtPaymentMethodId] = useState('');
    const [debtVoucherNumber, setDebtVoucherNumber] = useState('');
    const [submittingDebtPayment, setSubmittingDebtPayment] = useState(false);

    // Estado para pedidos desde el dashboard
    const [products, setProducts] = useState<PublicProduct[]>([]);
    const [cart, setCart] = useState<{product: PublicProduct, quantity: number}[]>([]);
    const [submittingOrder, setSubmittingOrder] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
    const [visibleProductsCount, setVisibleProductsCount] = useState(6);
    const [availableShops, setAvailableShops] = useState<{id: string, name: string, logoURL?: string}[]>([]);
    const [currentShopId, setCurrentShopId] = useState<string | null>(null);
    const [showShopSelectorModal, setShowShopSelectorModal] = useState(false);

    // Estado para el perfil
    const [profileFirstName, setProfileFirstName] = useState('');
    const [profileLastName, setProfileLastName] = useState('');
    const [profilePhone, setProfilePhone] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError] = useState('');
    // Cambio de contraseña
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user) return;
            
            try {
                // 1. Obtener datos básicos
                const [finData, ordersData, debtData] = await Promise.all([
                    getClientFinancials(user.uid),
                    getClientOrders(user.uid),
                    getClientDebtPayments(user.uid)
                ]);
                
                setFinancials(finData);
                setOrders(ordersData);
                setDebtPaymentsList(debtData);

                // 2. Determinar shopId con resiliencia
                const urlShopId = searchParams.get('shopId');
                const localShopId = localStorage.getItem('last_shop_id');
                // Si no hay en URL ni local, buscamos en el último pedido
                const lastOrderShopId = ordersData.length > 0 ? ordersData[0].shopId : null;
                
                const shopId = urlShopId || localShopId || lastOrderShopId || user.iceCreamShopIds?.[0];
                setCurrentShopId(shopId || null);

                if (shopId) {
                    if (!localShopId) localStorage.setItem('last_shop_id', shopId);
                    const [productsData, shops, methodsData] = await Promise.all([
                        getPublicProducts(shopId),
                        getAllPublicShops(),
                        getActivePaymentMethods(shopId)
                    ]);
                    setProducts(productsData);
                    setAvailableShops(shops);
                    setPaymentMethodsList(methodsData.filter(m => m.type !== 'credit'));
                } else {
                    const shops = await getAllPublicShops();
                    setAvailableShops(shops);
                }
            } catch (err) {
                console.error("Error cargando dashboard:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [user, searchParams]);

    // Sincronizar datos del perfil cuando el usuario cargue
    useEffect(() => {
        if (user) {
            setProfileFirstName(user.firstName || '');
            setProfileLastName(user.lastName || '');
            setProfilePhone(user.phone || '');
        }
    }, [user]);



    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/client-login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            showToast('No se pudo cerrar sesión.', 'danger');
        }
    };

    if (loading) return <FullScreenLoader />;

    const handleSelectShop = async (selectedShopId: string) => {
        setCurrentShopId(selectedShopId);
        localStorage.setItem('last_shop_id', selectedShopId);
        setShowShopSelectorModal(false);
        setLoading(true);
        try {
            const [productsData, methodsData] = await Promise.all([
                getPublicProducts(selectedShopId),
                getActivePaymentMethods(selectedShopId)
            ]);
            setProducts(productsData);
            setPaymentMethodsList(methodsData.filter(m => m.type !== 'credit'));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user?.uid) return;
        setSavingProfile(true);
        setProfileError('');
        setProfileSuccess('');
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                firstName: profileFirstName.trim(),
                lastName: profileLastName.trim(),
                phone: profilePhone.trim()
            });
            setProfileSuccess('Perfil actualizado correctamente.');
        } catch {
            setProfileError('Error al guardar los cambios.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!auth.currentUser || !user?.email) return;
        if (newPassword !== confirmNewPassword) {
            setProfileError('Las contraseñas nuevas no coinciden.');
            return;
        }
        if (newPassword.length < 6) {
            setProfileError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        setSavingPassword(true);
        setProfileError('');
        setProfileSuccess('');
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setProfileSuccess('Contraseña cambiada correctamente.');
        } catch (err: any) {
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setProfileError('La contraseña actual es incorrecta.');
            } else {
                setProfileError('Error al cambiar la contraseña.');
            }
        } finally {
            setSavingPassword(false);
        }
    };

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
            showToast("No se pudo identificar la tienda. Por favor escanea el código QR de nuevo.", "danger");
            return;
        }

        if (paymentMethod === 'credit') {
            const currentDebt = financials.debt || 0;
            const newDebt = currentDebt + cartTotal;
            if (financials.creditLimit && financials.creditLimit > 0 && newDebt > financials.creditLimit) {
                showToast(`¡Cupo de crédito excedido! Este pedido por ${formatCurrency(cartTotal)} supera tu cupo disponible de ${formatCurrency(Math.max(0, financials.creditLimit - currentDebt))}.`, "warning");
                return;
            }
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
            showToast("¡Pedido realizado con éxito!", "success");
        } catch (error) {
            console.error(error);
            showToast("Error al procesar el pedido.", "danger");
        } finally {
            setSubmittingOrder(false);
        }
    };

    const handleSubmitDebtPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !currentShopId || !debtPaymentMethodId || !debtVoucherNumber) return;
        const amount = parseFloat(debtPaymentAmount);
        if (isNaN(amount) || amount <= 0 || amount > financials.debt) {
            showToast('Monto inválido. No puede ser mayor a la deuda actual.', 'warning');
            return;
        }

        setSubmittingDebtPayment(true);
        try {
            const method = paymentMethodsList.find(m => m.id === debtPaymentMethodId);
            await createDebtPaymentRequest({
                clientId: user.uid,
                clientName: `${user.firstName} ${user.lastName}`,
                clientPhone: user.phone || '',
                shopId: currentShopId,
                amount,
                paymentMethodId: debtPaymentMethodId,
                paymentMethodName: method?.name || 'Desconocido',
                voucherNumber: debtVoucherNumber,
                status: 'pending'
            });
            setShowDebtModal(false);
            setDebtPaymentAmount('');
            setDebtVoucherNumber('');
            setDebtPaymentMethodId('');
            showToast('Solicitud enviada correctamente. El administrador la revisará pronto.', 'success');
            
            const newDebtData = await getClientDebtPayments(user.uid);
            setDebtPaymentsList(newDebtData);
            setActiveTab('debt_payments');
        } catch (err) {
            console.error('Error submitting debt payment:', err);
            showToast('Ocurrió un error al enviar el pago.', 'danger');
        } finally {
            setSubmittingDebtPayment(false);
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
            {/* Navbar */}
            <nav className="navbar navbar-dark shadow" style={{
                background: `linear-gradient(135deg, ${tenant.theme.primaryColor} 0%, ${tenant.theme.primaryColor}cc 100%)`,
                minHeight: '64px',
                borderBottom: `3px solid ${tenant.theme.primaryColor}40`
            }}>
                <div className="container d-flex align-items-center justify-content-between">
                    {/* Logo / Marca */}
                    <span className="navbar-brand fw-bold d-flex align-items-center fs-5 mb-0">
                        <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center me-2" style={{width:36, height:36}}>
                            <GeoAltFill className="text-white" size={18}/>
                        </div>
                        <span className="text-white">{tenant.terminology.shopLabel}</span>
                    </span>

                    {/* Acciones */}
                    <div className="d-flex align-items-center gap-2">
                        {/* Toggle tema */}
                        <button
                            onClick={toggleTheme}
                            className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center text-white"
                            style={{width:36, height:36, backgroundColor:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)'}}
                            title={`Modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
                        >
                            {theme === 'light' ? <MoonFill size={14}/> : <SunFill size={14}/>}
                        </button>

                        {/* Selector de tiendas */}
                        {/* Selector de tiendas siempre visible */}
                        <select
                            className="form-select form-select-sm"
                            style={{backgroundColor:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:20, padding:'2px 6px', maxWidth:'200px'}}
                            value={currentShopId || ''}
                            onChange={e => handleSelectShop(e.target.value)}
                        >
                            <option value="" disabled>Seleccionar tienda</option>
                            {availableShops.map(shop => (
                                <option key={shop.id} value={shop.id}>{shop.name}</option>
                            ))}
                        </select>

                        {/* Botón de Perfil */}
                        <button
                            className="btn btn-sm d-flex align-items-center gap-2 text-white fw-bold"
                            style={{
                                background: 'rgba(255,255,255,0.25)',
                                border: '2px solid rgba(255,255,255,0.7)',
                                borderRadius: 24,
                                padding: '6px 16px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                            onClick={() => { setProfileSuccess(''); setProfileError(''); setActiveTab('profile'); }}
                        >
                            <PersonCircle size={20}/>
                            <span className="small">{user?.firstName || 'Mi cuenta'}</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container py-4 pb-5 mb-4 mb-md-0 pb-md-4">
                {/* Header Bienvenida */}
                <div className="row mb-4">
                    <div className="col-12">
                        <h2 className="fw-bold mb-0">Hola, {user?.firstName}</h2>
                        <p className="text-secondary">Este es tu resumen de cuenta y pedidos.</p>
                    </div>
                </div>

                {/* Resumen Financiero */}
                <div className="row g-3 mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body d-flex flex-column flex-sm-row justify-content-between align-items-sm-center p-4">
                                <div className="d-flex align-items-center mb-3 mb-sm-0">
                                    <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                                        <Receipt className="text-danger" size={32}/>
                                    </div>
                                    <div>
                                        <h6 className="text-muted mb-1 text-uppercase small fw-bold">Deuda Pendiente (Fiado)</h6>
                                        <h2 className="mb-0 fw-bold text-danger">{formatCurrency(financials.debt)}</h2>
                                        {financials.isCreditEnabled && financials.creditLimit && financials.creditLimit > 0 ? (
                                            <div className="small text-muted mt-2 d-flex align-items-center gap-2" style={{fontSize: '0.85rem'}}>
                                                <span>Cupo máx: <strong className="text-body">{formatCurrency(financials.creditLimit)}</strong></span>
                                                <span className="text-muted">•</span>
                                                <span>Disponible: <strong className="text-success">{formatCurrency(Math.max(0, financials.creditLimit - financials.debt))}</strong></span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                {financials.debt > 0 && (
                                    <button 
                                        className="btn btn-danger px-4 py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center gap-2"
                                        onClick={() => setShowDebtModal(true)}
                                        style={{transition: 'transform 0.2s', padding: '12px 24px'}}
                                    >
                                        <Wallet2 size={18}/> Abonar a Deuda
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs de Pedidos */}
                <div className="card border-0 shadow-sm bg-body">
                    <div className="card-header bg-transparent border-bottom-0 pt-4 px-4 d-none d-md-block">
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
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === 'debt_payments' ? 'active fw-bold' : 'text-secondary'}`}
                                    onClick={() => setActiveTab('debt_payments')}
                                >
                                    Abonos ({debtPaymentsList.length})
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === 'profile' ? 'active fw-bold' : 'text-secondary'}`}
                                    onClick={() => { setProfileSuccess(''); setProfileError(''); setActiveTab('profile'); }}
                                >
                                    Mi Perfil
                                </button>
                            </li>
                        </ul>
                    </div>
                    <div className="card-body p-0">
                        {activeTab === 'profile' ? (
                            <div className="p-4 bg-body">
                                <div className="row g-4">
                                    {/* Datos Personales */}
                                    <div className="col-md-6">
                                        <div className="card border-0 bg-body-tertiary p-4 rounded-4 h-100">
                                            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2 text-body">
                                                <PersonCircle className="text-primary" size={20}/> Datos Personales
                                            </h5>
                                            
                                            {profileSuccess && <div className="alert alert-success py-2 small d-flex align-items-center gap-2"><CheckLg/> {profileSuccess}</div>}
                                            {profileError && <div className="alert alert-danger py-2 small">{profileError}</div>}
                                            
                                            <div className="row g-2 mb-3">
                                                <div className="col-6">
                                                    <label className="form-label small fw-semibold text-secondary">Nombre</label>
                                                    <input
                                                        type="text" className="form-control rounded-3 border"
                                                        value={profileFirstName}
                                                        onChange={e => setProfileFirstName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label small fw-semibold text-secondary">Apellido</label>
                                                    <input
                                                        type="text" className="form-control rounded-3 border"
                                                        value={profileLastName}
                                                        onChange={e => setProfileLastName(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label small fw-semibold text-secondary">Celular / WhatsApp</label>
                                                <input
                                                    type="tel" className="form-control rounded-3 border"
                                                    value={profilePhone}
                                                    onChange={e => setProfilePhone(e.target.value)}
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label small fw-semibold text-muted">Correo (No editable)</label>
                                                <input type="email" className="form-control rounded-3 bg-secondary bg-opacity-10 border-0" value={user?.email || ''} disabled/>
                                            </div>
                                            <div className="mb-4">
                                                <label className="form-label small fw-semibold text-muted">Doc. de Identidad (No editable)</label>
                                                <input type="text" className="form-control rounded-3 bg-secondary bg-opacity-10 border-0" value={(user as any)?.documentId || 'No registrado'} disabled/>
                                            </div>
                                            <button
                                                className="btn btn-primary w-100 rounded-pill fw-bold py-2"
                                                style={{backgroundColor: tenant.theme.primaryColor, borderColor: tenant.theme.primaryColor}}
                                                onClick={handleSaveProfile}
                                                disabled={savingProfile}
                                            >
                                                {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Seguridad y Preferencias */}
                                    <div className="col-md-6">
                                        <div className="card border-0 bg-body-tertiary p-4 rounded-4 h-100 d-flex flex-column justify-content-between">
                                            <div>
                                                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2 text-body">
                                                    <KeyFill className="text-warning" size={20}/> Seguridad y Preferencias
                                                </h5>
                                                
                                                <div className="mb-4">
                                                    <label className="form-label small fw-semibold text-secondary">Apariencia</label>
                                                    <button
                                                        className={`btn ${theme === 'light' ? 'btn-dark' : 'btn-light text-dark'} w-100 rounded-pill fw-bold py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm`}
                                                        onClick={toggleTheme}
                                                    >
                                                        {theme === 'light' ? <MoonFill/> : <SunFill className="text-warning"/>}
                                                        {theme === 'light' ? 'Activar Modo Oscuro' : 'Activar Modo Claro'}
                                                    </button>
                                                </div>

                                                <hr className="text-muted opacity-25 my-4" />

                                                <h6 className="fw-bold mb-3 text-body">Cambiar Contraseña</h6>

                                                <div className="mb-2">
                                                    <label className="form-label small fw-semibold text-secondary">Contraseña actual</label>
                                                    <input
                                                        type="password" className="form-control rounded-3 border"
                                                        placeholder="Tu contraseña actual"
                                                        value={currentPassword}
                                                        onChange={e => setCurrentPassword(e.target.value)}
                                                    />
                                                </div>
                                                <div className="mb-2">
                                                    <label className="form-label small fw-semibold text-secondary">Nueva contraseña</label>
                                                    <input
                                                        type="password" className="form-control rounded-3 border"
                                                        placeholder="Mínimo 6 caracteres"
                                                        value={newPassword}
                                                        onChange={e => setNewPassword(e.target.value)}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label small fw-semibold text-secondary">Confirmar nueva contraseña</label>
                                                    <input
                                                        type="password" className="form-control rounded-3 border"
                                                        placeholder="Repita la nueva contraseña"
                                                        value={confirmNewPassword}
                                                        onChange={e => setConfirmNewPassword(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4">
                                                <button
                                                    className="btn btn-outline-warning w-100 rounded-pill fw-bold py-2 mb-3"
                                                    onClick={handleChangePassword}
                                                    disabled={savingPassword || !currentPassword || !newPassword}
                                                >
                                                    {savingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
                                                </button>
                                                
                                                <button 
                                                    className="btn btn-danger w-100 rounded-pill fw-bold py-2 d-flex align-items-center justify-content-center gap-2" 
                                                    onClick={handleLogout}
                                                >
                                                    <BoxArrowRight/> Cerrar Sesión
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'order' ? (
                            !currentShopId ? (
                                <div className="p-5 text-center">
                                    <h4 className="text-secondary mb-3">No has seleccionado una tienda</h4>
                                    <button className="btn btn-primary rounded-pill px-4" onClick={() => setShowShopSelectorModal(true)}>
                                        Ver tiendas disponibles
                                    </button>
                                </div>
                            ) : (
                                <div className="row g-0">
                                    {/* Lista de Productos */}
                                    <div className="col-lg-8 border-end p-4">
                                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                                            <h5 className="fw-bold mb-0">Nuestro Menú</h5>
                                            <div 
                                                className="d-flex gap-2 overflow-auto pb-2 hide-scrollbar" 
                                                style={{ 
                                                    maxWidth: '100%',
                                                    scrollbarWidth: 'none',
                                                    msOverflowStyle: 'none'
                                                }}
                                            >
                                                {['Todas', ...Array.from(new Set(products.map(p => p.category)))].map(cat => (
                                                    <button 
                                                        key={cat}
                                                        onClick={() => { setSelectedCategory(cat); setVisibleProductsCount(6); }}
                                                        className={`btn btn-sm rounded-pill px-3 text-nowrap ${selectedCategory === cat ? 'btn-primary' : 'btn-outline-secondary border-0 bg-body-tertiary'}`}
                                                        style={selectedCategory === cat ? {backgroundColor: tenant.theme.primaryColor, borderColor: tenant.theme.primaryColor} : {}}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    <div className="row g-3">
                                        {products.length > 0 ? (
                                            (() => {
                                                const filtered = products.filter(p => selectedCategory === 'Todas' || p.category === selectedCategory);
                                                const visible = filtered.slice(0, visibleProductsCount);
                                                return (
                                                    <>
                                                        {visible.map(product => (
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
                                                        ))}
                                                        {filtered.length > visibleProductsCount && (
                                                            <div className="col-12 text-center mt-4">
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-outline-primary rounded-pill px-4 fw-bold"
                                                                    style={{ borderColor: tenant.theme.primaryColor, color: tenant.theme.primaryColor }}
                                                                    onClick={() => setVisibleProductsCount(prev => prev + 6)}
                                                                >
                                                                    Ver más productos
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()
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
                                                    {/* Métodos electrónicos disponibles en la tienda */}
                                                    {paymentMethodsList.map(m => (
                                                        <div key={m.id}>
                                                            <button 
                                                                className={`btn btn-sm text-start w-100 d-flex align-items-center justify-content-between p-2 rounded-3 border-2 ${paymentMethod === m.id ? 'border-success bg-success bg-opacity-10' : 'border-light bg-body'}`}
                                                                onClick={() => setPaymentMethod(m.id as any)}
                                                            >
                                                                <span className={`small fw-bold ${paymentMethod === m.id ? 'text-success' : 'text-body'}`}>{m.name}</span>
                                                                {paymentMethod === m.id && <div className="rounded-circle bg-success" style={{width: '8px', height: '8px'}}></div>}
                                                            </button>
                                                            {paymentMethod === m.id && m.accountDetails && (
                                                                <div className="alert alert-success py-2 px-3 mt-1 mb-0 small d-flex align-items-center gap-2" style={{borderRadius: '10px'}}>
                                                                    <span>💳</span>
                                                                    <span>Transfiere a: <strong>{m.accountDetails}</strong></span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
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
                            )
                        ) : activeTab === 'debt_payments' ? (
                            debtPaymentsList.length > 0 ? (
                                <div className="list-group list-group-flush">
                                    {debtPaymentsList.map(payment => (
                                        <div key={payment.id} className="list-group-item p-4">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="fw-bold">Abono #{payment.id.slice(-6).toUpperCase()}</span>
                                                    {payment.status === 'pending' && <span className="badge bg-warning text-dark">Pendiente</span>}
                                                    {payment.status === 'approved' && <span className="badge bg-success">Aprobado</span>}
                                                    {payment.status === 'rejected' && <span className="badge bg-danger">Rechazado</span>}
                                                </div>
                                                <small className="text-secondary">
                                                    {payment.createdAt?.toDate().toLocaleDateString()}
                                                </small>
                                            </div>
                                            <div className="mb-2 small text-secondary">
                                                Método: <span className="fw-medium text-body">{payment.paymentMethodName}</span> | 
                                                Comprobante: <span className="fw-medium text-body">{payment.voucherNumber}</span>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                                                <div className="text-muted small">{payment.notes ? `Nota: ${payment.notes}` : ''}</div>
                                                <div className="text-end">
                                                    <span className="fw-bold fs-5 text-success">+{formatCurrency(payment.amount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <Receipt size={32} className="text-muted opacity-50 mb-3"/>
                                    <p className="text-secondary">No tienes abonos registrados.</p>
                                </div>
                            )
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

            {/* ===== MODAL SELECTOR DE TIENDAS ===== */}
            {showShopSelectorModal && (
                <div className="modal show d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1060}}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header border-0 px-4 pt-4 pb-2" style={{background: `linear-gradient(135deg, ${tenant.theme.primaryColor}20, transparent)`}}>
                                <div>
                                    <h4 className="modal-title fw-bold mb-0">Selecciona una Tienda</h4>
                                    <p className="text-muted small mb-0 mt-1">Elige la tienda para ver su catálogo</p>
                                </div>
                                {currentShopId && (
                                    <button type="button" className="btn-close ms-auto" onClick={() => setShowShopSelectorModal(false)}></button>
                                )}
                            </div>
                            <div className="modal-body p-4">
                                {availableShops.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <GeoAltFill size={48} className="mb-3 opacity-25"/>
                                        <p>No hay tiendas disponibles.</p>
                                    </div>
                                ) : (
                                    <div className="row g-3">
                                        {availableShops.map(shop => {
                                            const isSelected = currentShopId === shop.id;
                                            return (
                                                <div key={shop.id} className="col-12 col-md-6 col-lg-4">
                                                    <div
                                                        className={`card h-100 border-2 shop-card ${isSelected ? 'border-primary' : 'border-light'}`}
                                                        style={{cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: isSelected ? `0 0 0 3px ${tenant.theme.primaryColor}40` : ''}}
                                                        onClick={() => handleSelectShop(shop.id)}
                                                    >
                                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                                            <div className={`rounded-circle d-inline-flex p-3 mb-3 ${isSelected ? 'bg-primary' : 'bg-body-tertiary'}`}>
                                                                {shop.logoURL ? (
                                                                    <img src={shop.logoURL} alt={shop.name} height="36" width="36" className="object-fit-contain" style={{borderRadius: '50%'}}/>
                                                                ) : (
                                                                    <GeoAltFill size={28} className={isSelected ? 'text-white' : 'text-secondary'}/>
                                                                )}
                                                            </div>
                                                            <h6 className="fw-bold mb-1">{shop.name}</h6>
                                                            {isSelected && (
                                                                <span className="badge rounded-pill mt-1" style={{backgroundColor: tenant.theme.primaryColor}}>
                                                                    ✓ Seleccionada
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {currentShopId && (
                                <div className="modal-footer border-0 px-4 pb-4 pt-0">
                                    <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setShowShopSelectorModal(false)}>
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL PAGO DE DEUDA ===== */}
            {showDebtModal && (
                <div className="modal show d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1060}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header border-0 px-4 pt-4 pb-2" style={{background: `linear-gradient(135deg, ${tenant.theme.primaryColor}20, transparent)`}}>
                                <div>
                                    <h4 className="modal-title fw-bold mb-0">Abonar a Deuda</h4>
                                    <p className="text-muted small mb-0 mt-1">Registra tu pago para que sea validado</p>
                                </div>
                                <button type="button" className="btn-close ms-auto" onClick={() => setShowDebtModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmitDebtPayment}>
                                <div className="modal-body p-4">
                                    <div className="alert alert-info py-2 small mb-4">
                                        Deuda actual: <strong className="fs-6">{formatCurrency(financials.debt)}</strong>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Monto a abonar</label>
                                        <div className="input-group">
                                            <span className="input-group-text">$</span>
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                required 
                                                min="1" 
                                                max={financials.debt} 
                                                value={debtPaymentAmount}
                                                onChange={e => setDebtPaymentAmount(e.target.value)}
                                                placeholder="Ej: 15000"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Medio de Pago</label>
                                        <select 
                                            className="form-select" 
                                            required
                                            value={debtPaymentMethodId}
                                            onChange={e => setDebtPaymentMethodId(e.target.value)}
                                        >
                                            <option value="" disabled>Selecciona el método de pago</option>
                                            {paymentMethodsList.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                        {/* Mostrar número de cuenta al cliente */}
                                        {debtPaymentMethodId && (() => {
                                            const sel = paymentMethodsList.find(m => m.id === debtPaymentMethodId);
                                            return sel?.accountDetails ? (
                                                <div className="alert alert-success py-2 px-3 mt-2 mb-0 small d-flex align-items-center gap-2" style={{borderRadius: '10px'}}>
                                                    <span>💳</span>
                                                    <span>Transfiere a: <strong>{sel.accountDetails}</strong></span>
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label small fw-semibold text-secondary">Número de Comprobante / Referencia</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            required 
                                            value={debtVoucherNumber}
                                            onChange={e => setDebtVoucherNumber(e.target.value)}
                                            placeholder="Ej: 123456789"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer border-0 px-4 pb-4 pt-0">
                                    <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setShowDebtModal(false)}>
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary rounded-pill px-4 fw-bold"
                                        style={{backgroundColor: tenant.theme.primaryColor, borderColor: tenant.theme.primaryColor}}
                                        disabled={submittingDebtPayment || paymentMethodsList.length === 0}
                                    >
                                        {submittingDebtPayment ? 'Enviando...' : 'Enviar Solicitud'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Barra de navegación inferior móvil estilo Instagram */}
            <div className="d-md-none fixed-bottom bg-body border-top shadow-lg py-2 px-3 z-3">
                <div className="d-flex justify-content-around align-items-center">
                    <button
                        onClick={() => setActiveTab('order')}
                        className={`btn btn-link p-1 d-flex flex-column align-items-center text-decoration-none border-0 ${activeTab === 'order' ? 'text-primary fw-bold' : 'text-secondary'}`}
                        style={{ fontSize: '0.7rem', width: '20%' }}
                    >
                        <CartFill size={20} className="mb-1" />
                        <span>Pedir</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`btn btn-link p-1 d-flex flex-column align-items-center text-decoration-none border-0 position-relative ${activeTab === 'pending' ? 'text-primary fw-bold' : 'text-secondary'}`}
                        style={{ fontSize: '0.7rem', width: '20%' }}
                    >
                        <Receipt size={20} className="mb-1" />
                        {pendingOrders.length > 0 && (
                            <span className="position-absolute top-0 start-50 translate-middle-x badge rounded-pill bg-danger" style={{ fontSize: '0.55rem', transform: 'translate(10px, -2px)' }}>
                                {pendingOrders.length}
                            </span>
                        )}
                        <span>Pendientes</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('history')}
                        className={`btn btn-link p-1 d-flex flex-column align-items-center text-decoration-none border-0 ${activeTab === 'history' ? 'text-primary fw-bold' : 'text-secondary'}`}
                        style={{ fontSize: '0.7rem', width: '20%' }}
                    >
                        <ClockHistory size={20} className="mb-1" />
                        <span>Historial</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('debt_payments')}
                        className={`btn btn-link p-1 d-flex flex-column align-items-center text-decoration-none border-0 ${activeTab === 'debt_payments' ? 'text-primary fw-bold' : 'text-secondary'}`}
                        style={{ fontSize: '0.7rem', width: '20%' }}
                    >
                        <Wallet2 size={20} className="mb-1" />
                        <span>Abonos</span>
                    </button>

                    <button
                        onClick={() => { setProfileSuccess(''); setProfileError(''); setActiveTab('profile'); }}
                        className={`btn btn-link p-1 d-flex flex-column align-items-center text-decoration-none border-0 ${activeTab === 'profile' ? 'text-primary fw-bold' : 'text-secondary'}`}
                        style={{ fontSize: '0.7rem', width: '20%' }}
                    >
                        <PersonCircle size={20} className="mb-1" />
                        <span>Perfil</span>
                    </button>
                </div>
            </div>

            <style>{`
                .hover-card:hover { transform: translateY(-4px); box-shadow: 0 .5rem 1.5rem rgba(0,0,0,.15)!important; }
                .shop-card:hover { transform: translateY(-4px); box-shadow: 0 .5rem 1.5rem rgba(0,0,0,.12)!important; }
                .text-truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            `}</style>
        </div>
    );
};

export default ClientDashboardPage;
