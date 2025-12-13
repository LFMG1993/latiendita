import { FC } from 'react';

interface MonthYearPickerProps {
    selectedDate: Date;
    onChange: (date: Date) => void;
}

const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const MonthYearPicker: FC<MonthYearPickerProps> = ({ selectedDate, onChange }) => {
    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(parseInt(e.target.value));
        onChange(newDate);
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(parseInt(e.target.value));
        onChange(newDate);
    };

    return (
        <div className="d-flex gap-2">
            <select className="form-select form-select-sm" value={selectedDate.getMonth()} onChange={handleMonthChange}>
                {months.map((month, index) => (
                    <option key={month} value={index}>{month}</option>
                ))}
            </select>
            <select className="form-select form-select-sm" value={selectedDate.getFullYear()} onChange={handleYearChange}>
                {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
        </div>
    );
};

export default MonthYearPicker;