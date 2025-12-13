import { WorkSchedule, ScheduleException } from "../types";

/**
 * Verifica si la hora actual está dentro de un horario de trabajo válido,
 * considerando el horario regular y las excepciones.
 * @param schedule - El horario regular del empleado.
 * @param exceptions - Las excepciones de horario.
 */
export const checkSchedule = (schedule?: WorkSchedule[], exceptions?: ScheduleException[]): boolean => {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // "HH:mm"
    const dayOfWeek = now.getDay();

    // 1. Comprobar si hay una excepción para hoy que nos dé acceso.
    const activeException = exceptions?.find(ex => ex.date === today);
    if (activeException) {
        return currentTime >= activeException.startTime && currentTime <= activeException.endTime;
    }

    // 2. Si no hay excepción, comprobar el horario regular.
    const activeShift = schedule?.find(s => s.dayOfWeek === dayOfWeek);
    if (activeShift) {
        // Manejo de turnos que cruzan la medianoche (ej: 22:00 - 02:00)
        if (activeShift.startTime > activeShift.endTime) {
            return currentTime >= activeShift.startTime || currentTime <= activeShift.endTime;
        }
        return currentTime >= activeShift.startTime && currentTime <= activeShift.endTime;
    }

    // 3. Si no hay ni excepción ni turno para hoy, el acceso es denegado.
    return false;
};