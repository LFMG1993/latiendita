import {createContext, FC, PropsWithChildren, useContext, useEffect, useState} from "react";

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: FC<PropsWithChildren> = ({children}) => {
    // 1. Inicializar estado desde localStorage o preferencia del sistema
    const [theme, setTheme] = useState<Theme>(() => {
        const storedTheme = localStorage.getItem('theme') as Theme | null;
        if (storedTheme) {
            return storedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    // 2. Efecto para aplicar el atributo data-bs-theme al html
    useEffect(() => {
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // 3. Escuchar cambios en el tema del sistema (si el usuario no ha forzado un tema)
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = (e: MediaQueryListEvent) => {
            // Solo aplicamos el cambio del sistema si el usuario decide borrar su localStorage o podemos forzar el sincro
            const newTheme = e.matches ? 'dark' : 'light';
            setTheme(newTheme);
            document.documentElement.setAttribute('data-bs-theme', newTheme);
        };

        // Agregar listener
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{theme, toggleTheme}}>
            {children}
        </ThemeContext.Provider>
    );
};
