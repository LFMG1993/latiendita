import {FC, useEffect, useState} from 'react';
import FullScreenLoader from "../../shared/FullScreenLoader.tsx";
import {getSalesForPeriod, processSalesByWeekday} from '../../../services/shop/dashboardService';
import {useAuthStore} from '../../../store/authStore';
import ChartComponent from '../../shared/Chart';
import {ChartData} from 'chart.js';
import {startOfMonth, endOfMonth} from 'date-fns';
import {toDate} from 'date-fns-tz';

const EmptyChartMessage: FC = () => (
    <div className="d-flex justify-content-center align-items-center h-100 text-muted">
        <p>No hay datos de ventas.</p>
    </div>
);

interface Props {
    selectedDate: Date;
}

const WeekdayRadarChart: FC<Props> = ({selectedDate}) => {
    const {activeShopId, activeShop} = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<ChartData<'radar'>>();

    useEffect(() => {
        const fetchData = async () => {

            try {
                if (!activeShopId || !activeShop?.timezone) {
                    return;
                }
                const timeZone = activeShop.timezone;
                const startDate = toDate(startOfMonth(selectedDate), {timeZone});
                const endDate = toDate(endOfMonth(selectedDate), {timeZone});

                const sales = await getSalesForPeriod(activeShopId, startDate, endDate);
                const salesByWeekday = processSalesByWeekday(sales);

                // Si todos los días son 0, no mostramos el gráfico
                if (salesByWeekday.every(day => day === 0)) {
                    setChartData(undefined);
                    return;
                }

                setChartData({
                    labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
                    datasets: [{
                        label: 'Total de Ventas por Día',
                        data: salesByWeekday,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }]
                });
            } catch (error) {
                console.error("Error al cargar gráfico de días de la semana:", error);
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
            <h5 className="card-title">Rendimiento del Mes por Día</h5>
            {chartData ? <ChartComponent type="radar" data={chartData} options={{responsive: true}}/> :
                <EmptyChartMessage/>}
        </>
    );
};

export default WeekdayRadarChart;