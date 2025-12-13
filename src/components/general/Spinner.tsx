import {FC} from 'react';
import '../../style/Spinner.css';

interface SpinnerProps {
    size?: number;
}

const Spinner: FC<SpinnerProps> = ({size = 150}) => {
    const style = {
        height: `${size}px`,
        width: `${size * 0.66}px`,
    };
    return (
        <div className="loader" style={style}></div>
    );
};

export default Spinner;