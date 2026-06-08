import {FC, useEffect, useState} from "react";
import {BrowserRouter as Router, Routes, Route, useNavigate} from "react-router-dom";
import {useRegisterSW} from 'virtual:pwa-register/react';
import HomePage from "./pages/public/HomePage.tsx";
import RegisterPage from "./pages/public/RegisterPage.tsx";
import ProductShowcasePage from "./pages/public/ProductShowcasePage.tsx";
import {Timestamp} from "firebase/firestore";
import LoginPage from "./pages/public/LoginPage.tsx";
import ClientLoginPage from "./pages/public/ClientLoginPage.tsx";
import ClientRegisterPage from "./pages/public/ClientRegisterPage.tsx";
import ClientDashboardPage from "./pages/public/ClientDashboardPage.tsx";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage.tsx";
import AdminClientsPage from "./pages/admin/AdminClientsPage.tsx";
import AdminDebtPaymentsPage from "./pages/admin/AdminDebtPaymentsPage.tsx";
import DashboardPage from "./pages/admin/DashboardPage.tsx";
import IngredientsPage from "./pages/admin/IngredientsPage.tsx";
import {auth} from './firebase';
import {onAuthStateChanged} from 'firebase/auth';
import {useAuthStore} from './store/authStore';
import {getHeladeriasByUserId, getUserProfileData} from './services/userServices';
import ProtectedRoute from './components/ProtectedRoute';
import IceCreamShopPage from "./pages/admin/IceCreamShopPage.tsx";
import FullScreenLoader from "./components/general/FullScreenLoader";
import MainLayout from "./components/MainLayout";
import ProfilePage from "./pages/admin/ProfilePage.tsx";
import ProductsPage from "./pages/admin/ProductsPage.tsx";
import PurchasesPage from "./pages/admin/PurchasesPage.tsx";
import TeamManagementPage from "./pages/admin/TeamManagementPage.tsx";
import EmployeeClaim from "./pages/EmployeeClaim";
import SuppliersPage from "./pages/admin/SuppliersPage.tsx";
import PointOfSalePage from "./pages/admin/PointOfSalePage.tsx";
import ReportsPage from "./pages/admin/ReportsPage.tsx";
import CashSessionPage from "./pages/admin/CashSessionPage.tsx";
import SettingsPage from "./pages/admin/SettingsPage.tsx";
import PromotionsPage from "./pages/admin/PromotionsPage.tsx";
import ExpensesPage from "./pages/admin/ExpensesPage.tsx";
import {checkSchedule} from "./utils/scheduleUtils.ts";
import {Heladeria} from "./types";
import UpdateNotification from "./components/general/UpdateNotification.tsx";
import {SuperAdminDashboard} from "./pages/admin/SuperAdminDashboard.tsx";
import {TenantProvider} from "./context/TenantContext";
import {ThemeProvider} from "./context/ThemeContext";
import {ToastProvider} from "./context/ToastContext";

const App: FC = () => {
    const {loading, setLoading, setAuthUser, setUserIceCreamShop, user} = useAuthStore();
    const navigate = useNavigate();
    const [initialRedirectDone, setInitialRedirectDone] = useState(false);

    //  Lógica para manejar la actualización del Service Worker
    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered() {
            console.log('Service Worker registrado.');
        },
        onRegisterError(error) {
            console.error('Error al registrar el Service Worker:', error);
        },
    });

    useEffect(() => {
        const checkLocalAuth = async () => {
            const savedUserJson = localStorage.getItem("authenticated_user");
            if (savedUserJson) {
                try {
                    const parsedUser = JSON.parse(savedUserJson);
                    
                    // Crear heladería mock si el usuario es owner/employee para evitar dependencias con Firestore
                    let heladerias: Heladeria[] = [];
                    if (parsedUser.role !== 'client') {
                        const mockHeladeria: Heladeria = {
                            id: "mock-shop-id-123",
                            name: "Mi Heladería Local",
                            owner: parsedUser.uid,
                            timezone: "America/Bogota",
                            createdAt: Timestamp.fromDate(new Date()),
                            theme: {
                                primaryColor: "#0d6efd",
                                secondaryColor: "#6c757d"
                            },
                            terminology: {
                                shopLabel: "Heladería",
                                productLabel: "Producto"
                            },
                            members: {
                                [parsedUser.uid]: {
                                    roleId: "owner-role-id",
                                    role: "owner",
                                    email: parsedUser.email,
                                    addedAt: Timestamp.fromDate(new Date()),
                                    permissions: {
                                        shop_details_manage: true,
                                        pos_access: true,
                                        ingredients_view: true,
                                        products_view: true,
                                        purchases_view: true,
                                        team_view: true,
                                        promotions_view: true,
                                        suppliers_view: true,
                                        reports_view_sales: true,
                                        cash_session_access: true,
                                        expenses_view: true
                                    }
                                }
                            }
                        };
                        heladerias = [mockHeladeria];
                    }

                    // Completamos el perfil del usuario para el store
                    const fullUserProfile = {
                        uid: parsedUser.uid,
                        id: parsedUser.id,
                        firstName: parsedUser.firstName,
                        lastName: parsedUser.lastName,
                        email: parsedUser.email,
                        role: parsedUser.role,
                        identify: parsedUser.identify,
                        phone: parsedUser.phone,
                        photoURL: parsedUser.photoURL || "",
                        createdAt: Timestamp.fromDate(new Date()),
                        iceCreamShopIds: parsedUser.role === 'client' 
                            ? [] 
                            : heladerias.map(h => h.id),
                        permissions: parsedUser.permissions || [],
                    };

                    setAuthUser(fullUserProfile);
                    setUserIceCreamShop(heladerias);
                } catch (error) {
                    console.error("Error cargando sesión local:", error);
                    setAuthUser(null);
                    setUserIceCreamShop([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setAuthUser(null);
                setUserIceCreamShop([]);
                setInitialRedirectDone(false);
                setLoading(false);
            }
        };

        checkLocalAuth();
    }, [setAuthUser, setUserIceCreamShop, setLoading]);

    // Se activa cuando el usuario se carga en el store.
    useEffect(() => {
        if (user && !initialRedirectDone) {
            if (user.role === 'employee') {
                navigate('/cash-session', {replace: true});
            } else if (user.role === 'owner') {
                navigate('/dashboard', {replace: true});
            } else if (user.role === 'superAdmin') {
                navigate('/super-admin', {replace: true});
            } else if (user.role === 'client') {
                navigate('/client/dashboard', {replace: true});
            }
            setInitialRedirectDone(true); // Marcamos que la redirección ya se hizo.
        }
    }, [user, initialRedirectDone, navigate]);

    if (loading) {
        return <FullScreenLoader/>;
    }

    return (
        <>
            {needRefresh && <UpdateNotification onUpdate={() => updateServiceWorker(true)}/>}
            <Routes>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/employee-claim" element={<EmployeeClaim/>}/>
                <Route path="/catalogo" element={<ProductShowcasePage/>}/>
                <Route path="/client-login" element={<ClientLoginPage/>}/>
                <Route path="/client-register" element={<ClientRegisterPage/>}/>
                <Route path="/client/dashboard" element={<ProtectedRoute><ClientDashboardPage/></ProtectedRoute>}/>
                {/* Rutas protegidas */}
                <Route path="/dashboard"
                       element={<ProtectedRoute
                           requiredPermission="shop_details_manage"><MainLayout><DashboardPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/orders"
                       element={<ProtectedRoute
                           requiredPermission="pos_access"><MainLayout><AdminOrdersPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/clients"
                       element={<ProtectedRoute
                           requiredPermission="pos_access"><MainLayout><AdminClientsPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/debt-payments"
                       element={<ProtectedRoute
                           requiredPermission="pos_access"><MainLayout><AdminDebtPaymentsPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/ingredients-page"
                       element={<ProtectedRoute
                           requiredPermission="ingredients_view"><MainLayout><IngredientsPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/ice-cream-shop"
                       element={<ProtectedRoute
                           requiredPermission="shop_details_manage"><MainLayout><IceCreamShopPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/profile"
                       element={<ProtectedRoute><MainLayout><ProfilePage/></MainLayout></ProtectedRoute>}/>
                <Route path="/products"
                       element={<ProtectedRoute
                           requiredPermission="products_view"><MainLayout><ProductsPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/purchases"
                       element={<ProtectedRoute
                           requiredPermission="purchases_view"><MainLayout><PurchasesPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/team-management"
                       element={<ProtectedRoute
                           requiredPermission="team_view"><MainLayout><TeamManagementPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/promotions"
                       element={<ProtectedRoute
                           requiredPermission="promotions_view"><MainLayout><PromotionsPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/suppliers"
                       element={<ProtectedRoute
                           requiredPermission="suppliers_view"><MainLayout><SuppliersPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/pos"
                       element={<ProtectedRoute
                           requiredPermission="pos_access"><MainLayout><PointOfSalePage/></MainLayout></ProtectedRoute>}/>
                <Route path="/reports"
                       element={<ProtectedRoute
                           requiredPermission="reports_view_sales"><MainLayout><ReportsPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/cash-session"
                       element={<ProtectedRoute
                           requiredPermission="cash_session_access"><MainLayout><CashSessionPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/settings"
                       element={<ProtectedRoute
                           requiredPermission="shop_details_manage"><MainLayout><SettingsPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/expenses"
                       element={<ProtectedRoute
                           requiredPermission="expenses_view"><MainLayout><ExpensesPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/super-admin"
                       element={<ProtectedRoute><MainLayout><SuperAdminDashboard/></MainLayout></ProtectedRoute>}/>
            </Routes>
        </>
    );
}


const AppWrapper: FC = () => {
    // Envolvemos App en el Router para que el hook useNavigate esté disponible
    return (
        <Router>
            <ThemeProvider>
                <TenantProvider>
                    <ToastProvider>
                        <App/>
                    </ToastProvider>
                </TenantProvider>
            </ThemeProvider>
        </Router>
    );
}

export default AppWrapper;
