import {FC, useEffect, useState} from 'react';
import FullScreenLoader from "../general/FullScreenLoader.tsx";
import {getSalesForPeriod, processTopProducts} from '../../services/dashboardService';
import {useAuthStore} from '../../store/authStore';
import ChartComponent from '../general/Chart';
import {ChartData} from 'chart.js';
import {startOfMonth, endOfMonth} from 'date-fns';
import {toDate} from 'date-fns-tz';

const EmptyChartMessage: FC = () => (
    <div className="d-flex justify-content-center align-items-center h-100 text-muted">
        <p>No hay productos vendidos.</p>
    </div>
);

interface Props {
    selectedDate: Date;
}

const TopProductsBarChart: FC<Props> = ({selectedDate}) => {
    const {activeIceCreamShopId, activeIceCreamShop} = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<ChartData<'bar'>>();

    useEffect(() => {
        const fetchData = async () => {

            try {
                if (!activeIceCreamShopId || !activeIceCreamShop?.timezone) {
                    return;
                }
                const timeZone = activeIceCreamShop.timezone;
                const startDate = toDate(startOfMonth(selectedDate), {timeZone});
                const endDate = toDate(endOfMonth(selectedDate), {timeZone});

                const sales = await getSalesForPeriod(activeIceCreamShopId, startDate, endDate);
                const topProducts = processTopProducts(sales);

                if (topProducts.length === 0) {
                    setChartData(undefined);
                    return;
                }

                setChartData({
                    labels: topProducts.map(p => p.name),
                    datasets: [{
                        label: 'Ingresos por producto',
                        data: topProducts.map(p => p.revenue),
                        backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    }]
                });
            } catch (error) {
                console.error("Error al cargar gráfico de productos top:", error);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        fetchData();
    }, [activeIceCreamShopId, activeIceCreamShop?.timezone, selectedDate]);

    if (loading) return <FullScreenLoader/>;

    return (
        <>
            <h5 className="card-title">Top 5 Productos del Mes</h5>
            {chartData ? (
                <ChartComponent type="bar" data={chartData} options={{responsive: true, indexAxis: 'y'}}/>
            ) : (
                <EmptyChartMessage/>
            )}
        </>
    );
};

export default TopProductsBarChart;