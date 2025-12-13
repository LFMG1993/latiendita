import {FC, useState, useEffect} from "react";
import Breadcrumbs from "../../components/general/Breadcrumbs.tsx";
import {useAuthStore} from "../../store/authStore.ts";
import {Sale, Ingredient, CashSession, Purchase, Expense} from "../../types";
import {getIngredients} from "../../services/ingredientServices.ts";
import {getSalesByDateRange} from "../../services/saleServices.ts";
import DateRangePicker from "../../components/reports/DateRangePicker.tsx";
import {QuickRangeKey} from "../../components/reports/QuickDateRangeButtons.tsx";
import {startOfWeek, startOfMonth, subMonths, startOfYear, subDays} from 'date-fns';
import {toDate, format} from 'date-fns-tz';
import ReportSidebar, {ReportType} from "../../components/reports/ReportSidebar.tsx";
import SalesReport from "../../components/reports/SalesReport.tsx";
import {getCashSessionsForPeriod, getPurchasesForPeriod} from "../../services/dashboardService.ts";
import {getExpensesForPeriod} from "../../services/expenseServices.ts";
import PurchasesReport from "../../components/reports/PurchasesReport.tsx";
import ProfitReport from "../../components/reports/ProfitReport.tsx";
import SessionsReport from "../../components/reports/SessionsReport.tsx";

// Función de ayuda para mostrar fechas en formato DD-MM-YYYY
const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
};

const ReportsPage: FC = () => {
    const {activeIceCreamShop} = useAuthStore();
    const [activeReport, setActiveReport] = useState<ReportType>('sales');
    const [loading, setLoading] = useState(false);
    const [sales, setSales] = useState<Sale[]>([]);
    const [sessions, setSessions] = useState<CashSession[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    // El estado ahora se inicializa con la fecha correcta en la zona horaria de la tienda, si existe.
    const initialDateString = activeIceCreamShop?.timezone
        ? format(new Date(), 'yyyy-MM-dd', {timeZone: activeIceCreamShop.timezone})
        : new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(initialDateString);
    const [endDate, setEndDate] = useState(initialDateString);

    const handleFetchReport = async () => {
        if (!activeIceCreamShop?.id || !activeIceCreamShop.timezone) {
            console.warn("No hay heladería activa o no tiene zona horaria definida.");
            return;
        }
        setLoading(true);
        try {
            const start = toDate(`${startDate}T00:00:00`, {timeZone: activeIceCreamShop.timezone});
            const end = toDate(`${endDate}T23:59:59`, {timeZone: activeIceCreamShop.timezone});

            if (activeReport === 'sales') {
                const [salesData, ingredientsData] = await Promise.all([
                    getSalesByDateRange(activeIceCreamShop.id, start, end),
                    getIngredients(activeIceCreamShop.id) // Necesario para el modal de detalles
                ]);
                setSales(salesData);
                setIngredients(ingredientsData);
            } else if (activeReport === 'sessions') {
                const sessionsData = await getCashSessionsForPeriod(activeIceCreamShop.id, start, end);
                setSessions(sessionsData);
            } else if (activeReport === 'purchases') {
                const purchasesData = await getPurchasesForPeriod(activeIceCreamShop.id, start, end);
                setPurchases(purchasesData);
            } else if (activeReport === 'profit') {
                // Para el reporte de ganancias, necesitamos todos los datos
                const [salesData, purchasesData, sessionsData, expensesData] = await Promise.all([
                    getSalesByDateRange(activeIceCreamShop.id, start, end),
                    getPurchasesForPeriod(activeIceCreamShop.id, start, end),
                    getCashSessionsForPeriod(activeIceCreamShop.id, start, end),
                    getExpensesForPeriod(activeIceCreamShop.id, start, end)
                ]);
                setSales(salesData);
                setPurchases(purchasesData);
                setSessions(sessionsData);
                setExpenses(expensesData);
            }
        } catch (error) {
            console.error("Error al generar el reporte:", error);
        } finally {
            setLoading(false);
        }
    };

    // Limpiamos los datos cuando se cambia de tipo de reporte
    useEffect(() => {
        setSales([]);
        setSessions([]);
        setPurchases([]);
        setExpenses([]);
        setIngredients([]);
    }, [activeReport]);

    const handleQuickRangeSelect = (range: QuickRangeKey) => {
        if (!activeIceCreamShop?.timezone) return;

        // Obtenemos la fecha "ahora" pero en la zona horaria de la tienda
        const nowInShopTimezone = toDate(new Date(), {timeZone: activeIceCreamShop.timezone});

        let newStartDate: Date;
        let newEndDate: Date = nowInShopTimezone;

        switch (range) {
            case 'today':
                newStartDate = nowInShopTimezone;
                break;
            case 'yesterday':
                newStartDate = newEndDate = subDays(nowInShopTimezone, 1);
                break;
            case 'this_week':
                newStartDate = startOfWeek(nowInShopTimezone, {weekStartsOn: 1}); // Lunes
                break;
            case 'this_month':
                newStartDate = startOfMonth(nowInShopTimezone);
                break;
            case 'last_3_months':
                newStartDate = subMonths(nowInShopTimezone, 3);
                break;
            case 'last_6_months':
                newStartDate = subMonths(nowInShopTimezone, 6);
                break;
            case 'this_year':
                newStartDate = startOfYear(nowInShopTimezone);
                break;
        }

        setStartDate(format(newStartDate, 'yyyy-MM-dd', {timeZone: activeIceCreamShop.timezone}));
        setEndDate(format(newEndDate, 'yyyy-MM-dd', {timeZone: activeIceCreamShop.timezone}));
    };

    return (
        <main className="px-md-4">
            <Breadcrumbs/>
            <div
                className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">Reportes de Ventas</h1>
            </div>

            <div className="row">
                {/* Columna de Navegación de Reportes */}
                <div className="col-md-3">
                    <ReportSidebar activeReport={activeReport} onSelectReport={setActiveReport}/>
                </div>

                {/* Columna Principal de Contenido */}
                <div className="col-md-9">
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                        onQuickRangeSelect={handleQuickRangeSelect}
                        onFetchReport={handleFetchReport}
                        loading={loading}
                    />
                    {/* Título dinámico que muestra el rango de fechas del reporte generado */}
                    {(sales.length > 0 || sessions.length > 0 || purchases.length > 0 || expenses.length > 0) && !loading && activeReport !== 'profit' && (
                        <h4 className="text-muted my-3 fw-normal">
                            Mostrando resultados
                            para: {formatDateForDisplay(startDate)} al {formatDateForDisplay(endDate)}
                        </h4>
                    )}

                    {/* Renderizado condicional del reporte activo */}
                    {activeReport === 'sales' &&
                        <SalesReport sales={sales} ingredients={ingredients} loading={loading}/>}
                    {activeReport === 'purchases' && <PurchasesReport purchases={purchases} loading={loading}/>}
                    {activeReport === 'sessions' &&
                        <SessionsReport sessions={sessions} loading={loading}/>}
                    {activeReport === 'profit' &&
                        <ProfitReport sales={sales} purchases={purchases} sessions={sessions} expenses={expenses} loading={loading}/>}
                </div>
            </div>
        </main>
    );
};

export default ReportsPage;