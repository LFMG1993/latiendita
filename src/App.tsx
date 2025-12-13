import {FC, useEffect, useState} from "react";
import {BrowserRouter as Router, Routes, Route, useNavigate} from "react-router-dom";
import {useRegisterSW} from 'virtual:pwa-register/react';
import HomePage from "./pages/public/HomePage.tsx";
import RegisterPage from "./pages/public/RegisterPage.tsx";
import {Timestamp} from "firebase/firestore";
import LoginPage from "./pages/public/LoginPage.tsx";
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
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    const profileData = await getUserProfileData(currentUser.uid);
                    let heladerias: Heladeria[] = [];
                    try {
                        // Esta llamada fallará para un usuario no aprobado.
                        heladerias = await getHeladeriasByUserId(currentUser.uid);
                    } catch (error) {
                        // Capturamos el error de permisos esperado y continuamos.
                        console.warn("No se pudieron obtener las heladerías, el usuario podría estar pendiente de aprobación:", error);
                    }

                    let userPermissions: string[] = [];
                    // Los permisos vienen directamente del perfil del miembro en la heladería.
                    if (heladerias.length > 0 && currentUser) {
                        const memberData = heladerias[0].members?.[currentUser.uid];
                        const permissionsMap = memberData?.permissions || {};
                        userPermissions = Object.keys(permissionsMap).filter(key => permissionsMap[key] === true);
                    }

                    // Verificación de horario para empleados
                    const memberProfile = heladerias[0]?.members?.[currentUser.uid];
                    if (profileData?.role === 'employee' && memberProfile) {
                        if (!checkSchedule(memberProfile.workSchedule, memberProfile.scheduleExceptions)) {
                            alert("Estás intentando acceder fuera de tu horario de trabajo autorizado. Se cerrará la sesión.");
                            auth.signOut();
                            return;
                        }
                    }

                    const fullUserProfile = {
                        ...currentUser,
                        ...profileData,
                        firstName: profileData?.firstName ?? '',
                        lastName: profileData?.lastName ?? '',
                        email: currentUser.email ?? '',
                        role: profileData?.role ?? 'employee',
                        identify: profileData?.identify ?? '',
                        phone: profileData?.phone ?? '',
                        photoURL: profileData?.photoURL ?? currentUser.photoURL,
                        createdAt: profileData?.createdAt ?? Timestamp.fromDate(new Date(currentUser.metadata.creationTime!)),
                        iceCreamShopIds: heladerias.map(h => h.id),
                        permissions: userPermissions,
                    };

                    setAuthUser(fullUserProfile);
                    setUserIceCreamShop(heladerias);

                } catch (error) {
                    console.error("Error al cargar datos del usuario:", error);
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
        });
        return () => unsubscribe();
    }, [setAuthUser, setUserIceCreamShop, setLoading]);

    // Se activa cuando el usuario se carga en el store.
    useEffect(() => {
        if (user && !initialRedirectDone) {
            if (user.role === 'employee') {
                navigate('/cash-session', {replace: true});
            } else if (user.role === 'owner') {
                navigate('/dashboard', {replace: true});
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
                {/* Rutas protegidas */}
                <Route path="/dashboard"
                       element={<ProtectedRoute
                           requiredPermission="shop_details_manage"><MainLayout><DashboardPage/></MainLayout></ProtectedRoute>}/>
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
            </Routes>
        </>
    );
}

const AppWrapper: FC = () => {
    // Envolvemos App en el Router para que el hook useNavigate esté disponible
    return (
        <Router>
            <App/>
        </Router>
    );
}

export default AppWrapper;
