<<<<<<< HEAD
import { FC, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useRegisterSW } from 'virtual:pwa-register/react';

// --- RUTAS SAAS PUBLIC (landing) ---
import HomePage from "./pages/landing/HomePage";
import RegisterPage from "./pages/landing/RegisterPage";
import LoginPage from "./pages/landing/LoginPage";
import PendingApprovalPage from "./pages/landing/PendingApprovalPage";

// --- RUTAS PORTAL DE CLIENTES (shopPublic) ---
import ProductShowcasePage from "./pages/shopPublic/ProductShowcasePage";
import ClientLoginPage from "./pages/shopPublic/ClientLoginPage";
import ClientRegisterPage from "./pages/shopPublic/ClientRegisterPage";
import ClientDashboardPage from "./pages/shopPublic/ClientDashboardPage";

// --- RUTAS TENANT (shop) ---
import DashboardPage from "./pages/shop/DashboardPage";
import ShopPage from "./pages/shop/ShopPage";
import TeamManagementPage from "./pages/shop/TeamManagementPage";
import ProductsPage from "./pages/shop/ProductsPage";
import PurchasesPage from "./pages/shop/PurchasesPage";
import SuppliersPage from "./pages/shop/SuppliersPage";
import PointOfSalePage from "./pages/shop/PointOfSalePage";
import ReportsPage from "./pages/shop/ReportsPage";
import CashSessionPage from "./pages/shop/CashSessionPage";
import SettingsPage from "./pages/shop/SettingsPage";
import PromotionsPage from "./pages/shop/PromotionsPage";
import ExpensesPage from "./pages/shop/ExpensesPage";
import AdminOrdersPage from "./pages/shop/AdminOrdersPage";
import AdminClientsPage from "./pages/shop/AdminClientsPage";
import AdminDebtPaymentsPage from "./pages/shop/AdminDebtPaymentsPage";
import IngredientsPage from "./pages/shop/IngredientsPage";

// --- RUTAS SUPER ADMIN (admin) ---
import { SuperAdminDashboard } from "./pages/admin/SuperAdminDashboard";
import { SaasClientsPage } from "./pages/admin/SaasClientsPage";

// --- RUTAS SHARED (shared) ---
import ProfilePage from "./pages/shared/ProfilePage";

// --- COMPONENTES Y SERVICIOS ---
import { useAuthStore } from './store/authStore';
import { getShopsByUserId } from "./services/shop/tenantUserServices";
import { getMe } from "./services/shared/authServices";
import ProtectedRoute from './components/shared/ProtectedRoute';
import FullScreenLoader from "./components/shared/FullScreenLoader";
import MainLayout from "./components/shared/MainLayout";
import UpdateNotification from "./components/shared/UpdateNotification";
import { TenantProvider } from "./context/TenantContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { Shop } from "./types";
=======
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
import PendingApprovalPage from "./pages/public/PendingApprovalPage.tsx";
import ProtectedRoute from './components/ProtectedRoute';
import IceCreamShopPage from "./pages/admin/IceCreamShopPage.tsx";
import FullScreenLoader from "./components/general/FullScreenLoader";
import MainLayout from "./components/MainLayout";
import ProfilePage from "./pages/admin/ProfilePage.tsx";
import ProductsPage from "./pages/admin/ProductsPage.tsx";
import PurchasesPage from "./pages/admin/PurchasesPage.tsx";
import TeamManagementPage from "./pages/admin/TeamManagementPage.tsx";
import {AdminProductsPage} from "./pages/admin/AdminProductsPage.tsx";
import {SuperAdminDashboard} from "./pages/admin/SuperAdminDashboard.tsx";
import {SaasClientsPage} from "./pages/admin/SaasClientsPage.tsx";
import MasterCatalogPage from "./pages/admin/MasterCatalogPage.tsx";
import ProductRequestsPage from "./pages/admin/ProductRequestsPage.tsx";
import {PublicShopPage} from "./pages/public/PublicShopPage.tsx";
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
import {TenantProvider} from "./context/TenantContext";
import {ThemeProvider} from "./context/ThemeContext";
import {ToastProvider} from "./context/ToastContext";
>>>>>>> refs/remotes/origin/main

const App: FC = () => {
    const { loading, setLoading, setAuthUser, setUserShop } = useAuthStore();

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
            try {
                const parsedUser = await getMe();

                let shops: Shop[] = [];
                if (parsedUser.role !== 'client') {
                    shops = await getShopsByUserId(parsedUser.uid || "");
                }

                parsedUser.shopIds = parsedUser.role === 'client' ? [] : shops.map(h => h.id);

                setUserShop(shops);
                setAuthUser(parsedUser);
            } catch (error) {
                console.error("No active session:", error);
                localStorage.removeItem("authenticated_user");
                setUserShop([]);
                setAuthUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkLocalAuth();
<<<<<<< HEAD
    }, [setAuthUser, setUserShop, setLoading]);
=======
    }, [setAuthUser, setUserIceCreamShop, setLoading]);

    // Se activa cuando el usuario se carga en el store.
    useEffect(() => {
        if (user && !initialRedirectDone) {
            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/catalogo') || currentPath.startsWith('/employee-claim')) {
                setInitialRedirectDone(true);
                return;
            }

            // Verificar si el owner tiene solo tiendas en estado 'pending'
            if (user.role === 'owner') {
                const iceCreamShops = useAuthStore.getState().iceCreamShops;
                const hasActiveShop = iceCreamShops.some(shop => shop.status === 'active' || shop.status === undefined);
                const hasPendingShop = iceCreamShops.some(shop => shop.status === 'pending');
                
                if (!hasActiveShop && hasPendingShop) {
                    navigate('/pending-approval', {replace: true});
                    setInitialRedirectDone(true);
                    return;
                }
            }

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
>>>>>>> refs/remotes/origin/main

    if (loading) {
        return <FullScreenLoader />;
    }

    return (
        <>
            {needRefresh && <UpdateNotification onUpdate={() => updateServiceWorker(true)} />}
            <Routes>
                {/* --- RUTAS SAAS PUBLIC --- */}
                <Route path="/" element={<HomePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/pending-approval" element={<PendingApprovalPage />} />

                {/* --- RUTAS PORTAL CLIENTES --- */}
                <Route path="/catalogo" element={<ProductShowcasePage />} />
                <Route path="/client-login" element={<ClientLoginPage />} />
                <Route path="/client-register" element={<ClientRegisterPage />} />
                <Route path="/client/dashboard" element={<ProtectedRoute><ClientDashboardPage /></ProtectedRoute>} />

                {/* --- RUTAS SHARED --- */}
                <Route path="/profile" element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />

                {/* --- RUTAS SUPER ADMIN --- */}
                <Route path="/super-admin"
                    element={<ProtectedRoute requiredPermission="super_admin_access"><MainLayout><SuperAdminDashboard /></MainLayout></ProtectedRoute>} />
                <Route path="/super-admin/clients"
<<<<<<< HEAD
                    element={<ProtectedRoute requiredPermission="super_admin_access"><MainLayout><SaasClientsPage /></MainLayout></ProtectedRoute>} />

                {/* --- RUTAS TENANT --- */}
                <Route path="/dashboard"
                    element={<ProtectedRoute requiredPermission="shop_details_manage"><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>} />
=======
                       element={<ProtectedRoute
                           requiredPermission="super_admin_access"><MainLayout><SaasClientsPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/super-admin/catalog"
                       element={<ProtectedRoute
                           requiredPermission="super_admin_access"><MainLayout><MasterCatalogPage/></MainLayout></ProtectedRoute>}/>
                <Route path="/super-admin/product-requests"
                       element={<ProtectedRoute
                           requiredPermission="super_admin_access"><MainLayout><ProductRequestsPage/></MainLayout></ProtectedRoute>}/>
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
>>>>>>> refs/remotes/origin/main
                <Route path="/ice-cream-shop"
                    element={<ProtectedRoute requiredPermission="shop_details_manage"><MainLayout><ShopPage /></MainLayout></ProtectedRoute>} />
                <Route path="/team-management"
                    element={<ProtectedRoute requiredPermission="team_view"><MainLayout><TeamManagementPage /></MainLayout></ProtectedRoute>} />
                <Route path="/settings"
                    element={<ProtectedRoute requiredPermission="shop_details_manage"><MainLayout><SettingsPage /></MainLayout></ProtectedRoute>} />
                <Route path="/reports"
                    element={<ProtectedRoute requiredPermission="reports_view_sales"><MainLayout><ReportsPage /></MainLayout></ProtectedRoute>} />
                <Route path="/expenses"
                    element={<ProtectedRoute requiredPermission="expenses_view"><MainLayout><ExpensesPage /></MainLayout></ProtectedRoute>} />
                <Route path="/promotions"
                    element={<ProtectedRoute requiredPermission="promotions_view"><MainLayout><PromotionsPage /></MainLayout></ProtectedRoute>} />
                <Route path="/products"
                    element={<ProtectedRoute requiredPermission="products_view"><MainLayout><ProductsPage /></MainLayout></ProtectedRoute>} />
                <Route path="/ingredients-page"
                    element={<ProtectedRoute requiredPermission="ingredients_view"><MainLayout><IngredientsPage /></MainLayout></ProtectedRoute>} />
                <Route path="/purchases"
                    element={<ProtectedRoute requiredPermission="purchases_view"><MainLayout><PurchasesPage /></MainLayout></ProtectedRoute>} />
                <Route path="/suppliers"
                    element={<ProtectedRoute requiredPermission="suppliers_view"><MainLayout><SuppliersPage /></MainLayout></ProtectedRoute>} />

                {/* --- RUTAS OPERATIVAS TENANT (POS) --- */}
                <Route path="/pos"
                    element={<ProtectedRoute requiredPermission="pos_access"><MainLayout><PointOfSalePage /></MainLayout></ProtectedRoute>} />
                <Route path="/cash-session"
                    element={<ProtectedRoute requiredPermission="cash_session_access"><MainLayout><CashSessionPage /></MainLayout></ProtectedRoute>} />
                <Route path="/orders"
                    element={<ProtectedRoute requiredPermission="pos_access"><MainLayout><AdminOrdersPage /></MainLayout></ProtectedRoute>} />
                <Route path="/clients"
                    element={<ProtectedRoute requiredPermission="pos_access"><MainLayout><AdminClientsPage /></MainLayout></ProtectedRoute>} />
                <Route path="/debt-payments"
                    element={<ProtectedRoute requiredPermission="pos_access"><MainLayout><AdminDebtPaymentsPage /></MainLayout></ProtectedRoute>} />
            </Routes>
        </>
    );
}

const AppWrapper: FC = () => {
    return (
        <Router>
            <ThemeProvider>
                <TenantProvider>
                    <ToastProvider>
                        <App />
                    </ToastProvider>
                </TenantProvider>
            </ThemeProvider>
        </Router>
    );
}

export default AppWrapper;
