import {FC, useMemo} from 'react';
import {Purchase} from '../../types';
import PurchaseReportTable from "./PurchaseReportTable.tsx";

interface PurchasesReportProps {
    purchases: Purchase[];
    loading: boolean;
}

const PurchasesReport: FC<PurchasesReportProps> = ({purchases, loading}) => {

    const totalSpent = useMemo(() => {
        return purchases.reduce((sum, purchase) => sum + purchase.total, 0);
    }, [purchases]);

    if (loading) {
        return <div className="text-center p-5">
            <div className="spinner-border" role="status"><span className="visually-hidden">Cargando...</span></div>
        </div>;
    }

    if (purchases.length === 0 && !loading) {
        return <div className="alert alert-light text-center">Selecciona un rango de fechas y haz clic en "Generar
            Reporte" para ver los datos.</div>;
    }

    return (
        <>
            <div className="row">
                <div className="col-md-4 mb-3">
                    <div className="card text-center h-100">
                        <div className="card-body">
                            <h5 className="card-title">Gasto Total</h5>
                            <p className="card-text fs-2 fw-bold text-danger">{new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                maximumFractionDigits: 0
                            }).format(totalSpent)}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    {/* Placeholder para futuras métricas */}
                </div>
            </div>

            <div className="mt-4">
                <h5 className="mb-3">Detalle de Compras</h5>
                <PurchaseReportTable purchases={purchases}/>
            </div>
        </>
    );
};

export default PurchasesReport;