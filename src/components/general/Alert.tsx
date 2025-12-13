import {FC} from "react";

type AlertType = 'success' | 'danger' | 'warning' | 'info' | 'primary';

interface AlertProps {
    type: AlertType;
    message: string | null;
}

const Alert: FC<AlertProps> = ({type, message}) => {
    if (!message) {
        return null;
    }
    return (
        <div className={`alert alert-${type} d-flex align-items-center`} role="alert">
            <div>{message}</div>
        </div>
    );
};

export default Alert;