import {FC} from "react";

export type QuickRangeKey = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_3_months' | 'last_6_months' | 'this_year';

interface QuickDateRangeButtonsProps {
    onSelect: (range: QuickRangeKey) => void;
}

const ranges: { key: QuickRangeKey, label: string }[] = [
    {key: 'today', label: 'Hoy'},
    {key: 'yesterday', label: 'Ayer'},
    {key: 'this_week', label: 'Esta Semana'},
    {key: 'this_month', label: 'Este Mes'},
    {key: 'last_3_months', label: 'Últimos 3 Meses'},
    {key: 'last_6_months', label: 'Últimos 6 Meses'},
    {key: 'this_year', label: 'Este Año'},
];

const QuickDateRangeButtons: FC<QuickDateRangeButtonsProps> = ({onSelect}) => {
    return (
        <div className="btn-group btn-group-sm flex-wrap" role="group">
            {ranges.map(({key, label}) => (
                <button key={key} type="button" className="btn btn-outline-secondary" onClick={() => onSelect(key)}>
                    {label}
                </button>
            ))}
        </div>
    );
};

export default QuickDateRangeButtons;