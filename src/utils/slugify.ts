/**
 * Convierte una cadena de texto en un formato "slug" amigable para URL y nombres de archivo.
 * @param {string} text - El texto a convertir.
 * @returns {string} El texto en formato slug.
 */

const slugify = (text: string): string => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')           // Reemplaza espacios con -
        .replace(/[^\w\-]+/g, '')       // Elimina todos los caracteres que no son palabras o guiones
        .replace(/\-\-+/g, '-')         // Reemplaza múltiples - con uno solo
        .replace(/^-+/, '')             // Quita guiones del inicio
        .replace(/-+$/, '');            // Quita guiones del final
};

export default slugify;