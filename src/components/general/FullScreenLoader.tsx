import {FC} from 'react';
import '../../style/FullScreenLoader.css';

const FullScreenLoader: FC = () => {
    return (
        <div className="loader-overlay cinematic-loader">
            <div className="wave-container">
                <div className="wave wave-1"></div>
                <div className="wave wave-2"></div>
                <div className="wave wave-3"></div>
            </div>
            <div className="cinematic-content">
                <h1 className="cinematic-title">La Tiendita</h1>
                <div className="cinematic-divider"></div>
                <p className="cinematic-subtitle">Gracias por elegirnos...</p>
            </div>
        </div>
    );
};

export default FullScreenLoader;