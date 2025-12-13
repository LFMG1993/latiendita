import {FC} from 'react';
import {BarChartLine, BoxSeam, CashStack, PiggyBank} from 'react-bootstrap-icons';

export type ReportType = 'sales' | 'purchases' | 'sessions' | 'profit';

interface ReportSidebarProps {
    activeReport: ReportType;
    onSelectReport: (report: ReportType) => void;
}

const reportOptions = [
    {key: 'sales', label: 'Reporte de Ventas', Icon: BarChartLine},
    {key: 'purchases', label: 'Reporte de Compras', Icon: BoxSeam},
    {key: 'sessions', label: 'Reporte de Sesiones', Icon: CashStack},
    {key: 'profit', label: 'Reporte de Ganancias', Icon: PiggyBank},
];

const ReportSidebar: FC<ReportSidebarProps> = ({activeReport, onSelectReport}) => {
    return (
        <div className="list-group">
            {reportOptions.map(({key, label, Icon}) => (
                <a
                    key={key}
                    href="#"
                    className={`list-group-item list-group-item-action d-flex align-items-center ${activeReport === key ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        onSelectReport(key as ReportType);
                    }}
                >
                    <Icon className="me-2"/>
                    {label}
                </a>
            ))}
        </div>
    );
};

export default ReportSidebar;