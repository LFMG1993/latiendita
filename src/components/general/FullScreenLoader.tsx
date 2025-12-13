import {FC} from 'react';
import '../../style/FullScreenLoader.css';
import Spinner from "./Spinner.tsx";

const FullScreenLoader: FC = () => {
    return (
        <div className="loader-overlay">
            <Spinner size={150}/>
        </div>
    );
};

export default FullScreenLoader;