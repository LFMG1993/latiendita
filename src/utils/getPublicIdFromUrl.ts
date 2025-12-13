/**
 * Extrae el 'public_id' de una URL completa de Cloudinary.
 * Es robusto y maneja de forma segura URLs nulas, indefinidas o malformadas.
 * @param {string | null | undefined} url - La URL completa de Cloudinary.
 * @returns {string | null} El public_id extraído o null si no se puede encontrar.
 */
export const getPublicIdFromUrl = (url: string | null | undefined): string | null => {
    // Si la URL es nula, indefinida o no es una cadena, no hay nada que hacer.
    if (!url || typeof url !== 'string') {
        return null;
    }

    try {
        // Usamos el constructor de URL para analizar la URL de forma segura.
        const path = new URL(url).pathname;
        // El public_id suele estar después de /image/upload/v.../
        // Esta expresión regular busca la parte relevante.
        const regex = /\/upload\/(?:v\d+\/)?([^\.]+)/;
        const match = path.match(regex);

        // Si encontramos una coincidencia, el public_id está en el primer grupo de captura.
        return match ? match[1] : null;
    } catch (error) {
        // Si la URL no es válida, el constructor de URL lanzará un error.
        console.error("URL de Cloudinary malformada:", url, error);
        return null;
    }
};