import {FC} from 'react';
import { Cloudinary } from '@cloudinary/url-gen';
import { AdvancedImage } from '@cloudinary/react';
import { fill } from "@cloudinary/url-gen/actions/resize";



const cld = new Cloudinary({
    cloud: {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    }
});

interface CloudinaryImageProps {
    publicId: string | null | undefined;
    width: number;
    height: number;
    alt?: string;
}

const CloudinaryImage: FC<CloudinaryImageProps> = ({ publicId, width, height, alt = "Imagen" }) => {
    if (!publicId) {
        return (
            <div className="text-muted text-center d-flex align-items-center justify-content-center"
                 style={{ width: `${width}px`, height: `${height}px`, background: '#f0f0f0', borderRadius: '0.25rem' }}>
                Sin foto
            </div>
        );
    }

    const img = cld.image(publicId)
        .resize(fill().width(width).height(height))
        .format('auto') // f_auto: entrega el mejor formato (AVIF, WebP, etc.)
        .quality('auto'); // q_auto: ajusta la calidad automáticamente

    return <AdvancedImage cldImg={img} alt={alt} style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '0.25rem' }} />;};

export default CloudinaryImage;