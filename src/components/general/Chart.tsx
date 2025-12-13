import {FC} from 'react';
import {Line, Bar, Radar} from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
    ChartData,
    ChartOptions
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, Title, Tooltip, Legend, Filler);

interface ChartComponentProps {
    type?: 'line' | 'bar' | 'radar';
    data: ChartData<any>;
    options?: ChartOptions<any>;
}

const ChartComponent: FC<ChartComponentProps> = ({ type = 'line', data, options }) => {
    // Este componente ahora es un "wrapper" genérico para múltiples tipos de gráficos.
    switch (type) {
        case 'bar':
            return <Bar data={data} options={options} />;
        case 'radar':
            return <Radar data={data} options={options} />;
        case 'line':
        default:
            return <Line data={data} options={options} />;
    }
};

export default ChartComponent;