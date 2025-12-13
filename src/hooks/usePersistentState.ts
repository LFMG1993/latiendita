import * as React from "react";
import { useState, useEffect } from 'react';

/**
 * Un hook personalizado que se comporta como useState, pero persiste el estado
 * en el localStorage del navegador para sobrevivir a los refrescos de página.
 * @param key La clave única para almacenar el valor en localStorage.
 * @param initialValue El valor inicial a usar si no hay nada en localStorage.
 */
export function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        try {
            const storedValue = window.localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : initialValue;
        } catch (error) {
            console.error(`Error al leer del localStorage para la clave "${key}":`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        window.localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}