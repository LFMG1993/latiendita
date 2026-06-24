import {FC, useEffect, useState} from 'react';
import FullScreenLoader from "../../general/FullScreenLoader.tsx";
import {getSalesForPeriod, processSalesByDay} from '../../../services/shop/dashboardService';
import {useAuthStore} from '../../../store/authStore';
import ChartComponent from '../../general/Chart';
import {ChartData} from 'chart.js';
import {startOfMonth, endOfMonth} from 'date-fns';
import {toDate} from 'date-fns-tz';

const EmptyChartMessage: FC = () => (
    <div className="d-flex justify-content-center align-items-center h-100 text-muted">
        <p>No hay ventas en este período.</p>
    </div>
);

interface Props {
    selectedDate: Date;
}

const SalesLineChart: FC<Props> = ({selectedDate}) => {
    const {activeShopId, activeShop} = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<ChartData<'line'>>();

    useEffect(() => {
        const fetchData = async () => {

            try {
                if (!activeShopId || !activeShop?.timezone) {
                    return;
                }
                // Usamos la zona horaria de la tienda para definir el inicio y fin del mes
                const timeZone = activeShop.timezone;
                const startDate = toDate(startOfMonth(selectedDate), {timeZone});
                const endDate = toDate(endOfMonth(selectedDate), {timeZone});

                const sales = await getSalesForPeriod(activeShopId, startDate, endDate);
                if (sales.length === 0) {
                    setChartData(undefined);
                    return;
                }

                const dailySales = processSalesByDay(sales);
                setChartData({
                    labels: Object.keys(dailySales),
                    datasets: [{
                        label: 'Ventas por día',
                        data: Object.values(dailySales),
                        fill: true,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        tension: 0.3
                    }]
                });
            } catch (error) {
                console.error("Error al cargar gráfico de ventas:", error);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        fetchData();
    }, [activeShopId, activeShop?.timezone, selectedDate]);

    if (loading) return <FullScreenLoader/>;

    return (
        <>
            <h5 className="card-title">Ventas del Mes</h5>
            {chartData ? (
                <ChartComponent type="line" data={chartData} options={{responsive: true}}/>
            ) : (
                <EmptyChartMessage/>
            )}
        </>
    );
};

export default SalesLineChart;