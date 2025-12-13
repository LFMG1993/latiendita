/**
 * Configuración centralizada para las unidades de medida.
 * Define las categorías de unidades (Masa, Volumen, etc.) y los factores de conversión
 * relativos a una unidad base (gramo, mililitro).
 */
export const unitConfig = {
    Masa: {
        Kilogramo: 1000,
        gramo: 1,
    },
    Volumen: {
        Litro: 1000,
        mililitro: 1,
    },
    Unidad: {
        Unidad: 1,
        Paquete: 1,
    },
};

/**
 * Tipos derivados de la configuración para usar en toda la aplicación,
 * garantizando la consistencia y autocompletado.
 */
export type UnitCategory = keyof typeof unitConfig;

export const unitCategories = Object.keys(unitConfig) as UnitCategory[];

export const getUnitsForCategory = (category: UnitCategory) => {
    return Object.keys(unitConfig[category]);
};