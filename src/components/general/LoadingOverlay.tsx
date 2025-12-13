import { FC, ReactNode } from 'react';
import Spinner from './Spinner';

interface LoadingOverlayProps {
    loading: boolean;
    children: ReactNode;
}

const LoadingOverlay: FC<LoadingOverlayProps> = ({ loading, children }) => {
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                <Spinner />
            </div>
        );
    }

    return <>{children}</>;
};

export default LoadingOverlay;