import {FC} from 'react';
import '../../style/Spinner.css';

interface SpinnerProps {
    size?: number;
}

const Spinner: FC<SpinnerProps> = ({size = 100}) => {
    const scale = size / 100;
    return (
        <div className="loader-3d-container" style={{ transform: `scale(${scale})` }}>
            <div className="cube">
                <div className="face top"></div>
                <div className="face bottom"></div>
                <div className="face left"></div>
                <div className="face right"></div>
                <div className="face front"></div>
                <div className="face back"></div>
            </div>
            <div className="shadow-3d"></div>
        </div>
    );
};

export default Spinner;