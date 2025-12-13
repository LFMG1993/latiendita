import {FC, useEffect, useState} from 'react';
import FullScreenLoader from "../general/FullScreenLoader.tsx";
import {getSalesForPeriod, getPurchasesForPeriod} from '../../services/dashboardService';
import {useAuthStore} from '../../store/authStore';
import ChartComponent from '../general/Chart';
import {ChartData} from 'chart.js';
import {startOfMonth, endOfMonth} from 'date-fns';
import {toDate} from 'date-fns-tz';

const EmptyChartMessage: FC = () => (
    <div className="d-flex justify-content-center align-items-center h-100 text-muted">
        <p>No hay datos financieros para este mes.</p>
    </div>
);

interface Props {
    selectedDate: Date;
}

const IncomeVsExpensesChart: FC<Props> = ({selectedDate}) => {
    const {activeIceCreamShopId, activeIceCreamShop} = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<ChartData<'bar'>>();

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!activeIceCreamShopId || !activeIceCreamShop?.timezone) {
                    // Si no hay datos, simplemente dejamos de cargar y no mostramos nada.
                    return;
                }
                // Usamos la zona horaria de la tienda para definir el inicio y fin del mes
                const timeZone = activeIceCreamShop.timezone;
                const start = toDate(startOfMonth(selectedDate), {timeZone});
                const end = toDate(endOfMonth(selectedDate), {timeZone});

                const sales = await getSalesForPeriod(activeIceCreamShopId, start, end);
                const purchases = await getPurchasesForPeriod(activeIceCreamShopId, start, end);

                const totalIncome = sales.reduce((sum, sale) => sum + sale.total, 0);
                const totalExpenses = purchases.reduce((sum, purchase) => sum + purchase.total, 0);

                if (totalIncome === 0 && totalExpenses === 0) {
                    setChartData(undefined);
                    return;
                }

                setChartData({
                    labels: ['Finanzas del Mes'],
                    datasets: [
                        {
                            label: 'Ingresos',
                            data: [totalIncome],
                            backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        },
                        {
                            label: 'Gastos',
                            data: [totalExpenses],
                            backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        }
                    ]
                });
            } catch (error) {
                console.error("Error al cargar gráfico de Ingresos vs Gastos:", error);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        fetchData();
    }, [activeIceCreamShopId, activeIceCreamShop, selectedDate]);

    if (loading) return <FullScreenLoader/>;

    return (
        <>
            <h5 className="card-title">Ingresos vs. Gastos</h5>
            {chartData ? <ChartComponent type="bar" data={chartData} options={{responsive: true}}/> :
                <EmptyChartMessage/>}
        </>
    );
};

export default IncomeVsExpensesChart;