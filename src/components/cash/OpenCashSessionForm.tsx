import {FC, useState, FormEvent} from "react";

interface OpenCashSessionFormProps {
    onSubmit: (openingBalance: number) => void;
    loading: boolean;
}

const OpenCashSessionForm: FC<OpenCashSessionFormProps> = ({onSubmit, loading}) => {
    const [balance, setBalance] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const openingBalance = parseFloat(balance);
        if (!isNaN(openingBalance) && openingBalance >= 0) {
            onSubmit(openingBalance);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="openingBalance" className="form-label">Base Inicial en Caja</label>
                <input
                    type="number"
                    id="openingBalance"
                    className="form-control"
                    value={balance}
                    onChange={e => setBalance(e.target.value)}
                    required
                    autoFocus
                    min="0"
                    step="any"
                />
                <small className="form-text text-muted">Ingresa el monto de efectivo con el que inicias el turno.</small>
            </div>
            <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-success" disabled={loading}>
                    {loading ? 'Abriendo...' : 'Confirmar e Iniciar Sesión'}
                </button>
            </div>
        </form>
    );
};

export default OpenCashSessionForm;