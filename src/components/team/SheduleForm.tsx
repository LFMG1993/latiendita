import {FC, useState, FormEvent} from 'react';
import {Member, WorkSchedule, ScheduleException} from "../../types";
import {updateMemberSchedule} from "../../services/teamServices.ts";
import {Trash} from "react-bootstrap-icons";

interface ScheduleFormProps {
    shopId: string;
    member: Member;
    onFormSubmit: () => void;
}

const daysOfWeek = [
    {value: 1, label: 'Lunes'}, {value: 2, label: 'Martes'}, {value: 3, label: 'Miércoles'},
    {value: 4, label: 'Jueves'}, {value: 5, label: 'Viernes'}, {value: 6, label: 'Sábado'}, {value: 0, label: 'Domingo'}
];

const ScheduleForm: FC<ScheduleFormProps> = ({shopId, member, onFormSubmit}) => {
    const [workSchedule, setWorkSchedule] = useState<WorkSchedule[]>(member.workSchedule || []);
    const [exceptions, setExceptions] = useState<ScheduleException[]>(member.scheduleExceptions || []);
    const [loading, setLoading] = useState(false);

    // --- Handlers para Horario Regular ---
    const addWorkShift = () => {
        setWorkSchedule([...workSchedule, {dayOfWeek: 1, startTime: '08:00', endTime: '17:00'}]);
    };

    const updateWorkShift = (index: number, field: keyof WorkSchedule, value: string | number) => {
        const updatedSchedule = [...workSchedule];
        updatedSchedule[index] = {...updatedSchedule[index], [field]: value};
        setWorkSchedule(updatedSchedule);
    };

    const removeWorkShift = (index: number) => {
        setWorkSchedule(workSchedule.filter((_, i) => i !== index));
    };

    // --- Handlers para Excepciones ---
    const addException = () => {
        const today = new Date().toISOString().split('T')[0];
        setExceptions([...exceptions, {date: today, startTime: '08:00', endTime: '17:00'}]);
    };

    const updateException = (index: number, field: keyof ScheduleException, value: string) => {
        const updatedExceptions = [...exceptions];
        updatedExceptions[index] = {...updatedExceptions[index], [field]: value};
        setExceptions(updatedExceptions);
    };

    const removeException = (index: number) => {
        setExceptions(exceptions.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateMemberSchedule(shopId, member.uid, {workSchedule, scheduleExceptions: exceptions});
            onFormSubmit();
        } catch (error) {
            console.error("Error al guardar el horario:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Sección de Horario Regular */}
            <h5>Horario Regular</h5>
            {workSchedule.map((shift, index) => (
                <div key={index} className="row g-2 mb-2 align-items-center">
                    <div className="col">
                        <select className="form-select" value={shift.dayOfWeek}
                                onChange={(e) => updateWorkShift(index, 'dayOfWeek', parseInt(e.target.value))}>
                            {daysOfWeek.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}
                        </select>
                    </div>
                    <div className="col">
                        <input type="time" className="form-control" value={shift.startTime}
                               onChange={(e) => updateWorkShift(index, 'startTime', e.target.value)}/>
                    </div>
                    <div className="col">
                        <input type="time" className="form-control" value={shift.endTime}
                               onChange={(e) => updateWorkShift(index, 'endTime', e.target.value)}/>
                    </div>
                    <div className="col-auto">
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeWorkShift(index)}>
                            <Trash/>
                        </button>
                    </div>
                </div>
            ))}
            <button type="button" className="btn btn-sm btn-secondary mb-3" onClick={addWorkShift}>+ Añadir Turno</button>

            <hr/>

            {/* Sección de Excepciones */}
            <h5>Excepciones de Horario</h5>
            <p className="text-muted small">Usa esto para añadir un turno único en un día que normalmente no trabaja, o para sobreescribir su horario regular.</p>
            {exceptions.map((ex, index) => (
                <div key={index} className="row g-2 mb-2 align-items-center">
                    <div className="col">
                        <input type="date" className="form-control" value={ex.date}
                               onChange={(e) => updateException(index, 'date', e.target.value)}/>
                    </div>
                    <div className="col">
                        <input type="time" className="form-control" value={ex.startTime}
                               onChange={(e) => updateException(index, 'startTime', e.target.value)}/>
                    </div>
                    <div className="col">
                        <input type="time" className="form-control" value={ex.endTime}
                               onChange={(e) => updateException(index, 'endTime', e.target.value)}/>
                    </div>
                    <div className="col-auto">
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeException(index)}>
                            <Trash/>
                        </button>
                    </div>
                </div>
            ))}
            <button type="button" className="btn btn-sm btn-secondary mb-3" onClick={addException}>+ Añadir Excepción</button>

            <div className="d-flex justify-content-end mt-4">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Horario'}
                </button>
            </div>
        </form>
    );
};

export default ScheduleForm;