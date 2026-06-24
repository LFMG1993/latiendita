import {FC} from "react";
import QuickDateRangeButtons, {QuickRangeKey} from "./QuickDateRangeButtons";

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    onQuickRangeSelect: (range: QuickRangeKey) => void;
    onFetchReport: () => void;
    loading: boolean;
}

const DateRangePicker: FC<DateRangePickerProps> = ({
                                                       startDate,
                                                       endDate,
                                                       onStartDateChange,
                                                       onEndDateChange,
                                                       onQuickRangeSelect,
                                                       onFetchReport,
                                                       loading
                                                   }) => {
    return (
        <div className="card shadow-sm mb-4">
            <div className="card-body">
                <div className="row g-3 align-items-end">
                    <div className="col-md">
                        <label htmlFor="startDate" className="form-label">Fecha de Inicio</label>
                        <input type="date" id="startDate" className="form-control" value={startDate}
                               onChange={e => onStartDateChange(e.target.value)}/>
                    </div>
                    <div className="col-md">
                        <label htmlFor="endDate" className="form-label">Fecha de Fin</label>
                        <input type="date" id="endDate" className="form-control" value={endDate}
                               onChange={e => onEndDateChange(e.target.value)}/>
                    </div>
                    <div className="col-md-auto">
                        <button className="btn btn-primary w-100" onClick={onFetchReport} disabled={loading}>
                            {loading ? 'Cargando...' : 'Generar Reporte'}
                        </button>
                    </div>
                    <div className="col-12 mt-3">
                        <QuickDateRangeButtons onSelect={onQuickRangeSelect}/>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DateRangePicker;