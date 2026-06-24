import imageCompression from 'browser-image-compression';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = 'congelados';

/**
 * Comprime y sube una imagen a Cloudinary.
 * @param {File} file - El archivo de imagen a subir.
 * @param {string} folder - La carpeta en Cloudinary donde se guardará la imagen.
 * @param {string} publicId - El nombre de archivo personalizado (sin extensión).
 * @returns {Promise<string>} La URL segura de la imagen subida.
 */
export const uploadImageToCloudinary = async (file: File, folder: string, publicId: string): Promise<string> => {
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
    };

    const compressedFile = await imageCompression(file, options);

    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);
    formData.append('public_id', publicId);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error.message || 'Error al subir la imagen a Cloudinary');
    }

    return data.secure_url;
};