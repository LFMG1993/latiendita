import {FC, useMemo, useState} from 'react';
import {ProductSalesReport, Sale, Ingredient} from '../../types';
import ReportSalesTable from './ReportSalesTable';
import SaleDetailModal from '../cash/SaleDetailModal';

interface SalesReportProps {
    sales: Sale[];
    ingredients: Ingredient[];
    loading: boolean;
}

const SalesReport: FC<SalesReportProps> = ({sales, ingredients, loading}) => {
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    // --- Cálculos de Reportes con useMemo para eficiencia ---
    const totalRevenue = useMemo(() => {
        return sales.reduce((sum, sale) => sum + sale.total, 0);
    }, [sales]);

    const productSalesReport = useMemo((): ProductSalesReport[] => {
        const productMap = new Map<string, { name: string, quantity: number, revenue: number }>();

        sales.forEach(sale => {
            sale.items.forEach(item => {
                const existing = productMap.get(item.productId);
                if (existing) {
                    existing.quantity += item.quantity;
                    existing.revenue += item.quantity * item.unitPrice;
                } else {
                    productMap.set(item.productId, {
                        name: item.productName,
                        quantity: item.quantity,
                        revenue: item.quantity * item.unitPrice
                    });
                }
            });
        });

        return Array.from(productMap.entries()).map(([productId, data]) => ({
            productId,
            productName: data.name,
            quantitySold: data.quantity,
            totalRevenue: data.revenue,
        })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    }, [sales]);

    if (loading) {
        return <div className="text-center p-5">
            <div className="spinner-border" role="status"><span className="visually-hidden">Cargando...</span></div>
        </div>;
    }

    if (sales.length === 0 && !loading) {
        return <div className="alert alert-light text-center">Selecciona un rango de fechas y haz clic en "Generar
            Reporte" para ver los datos.</div>;
    }

    return (
        <>
            <div className="row">
                <div className="col-md-4 mb-3">
                    <div className="card text-center h-100">
                        <div className="card-body">
                            <h5 className="card-title">Ventas Totales</h5>
                            <p className="card-text fs-2 fw-bold">{new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                maximumFractionDigits: 0
                            }).format(totalRevenue)}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-8 mb-3">
                    <div className="card h-100">
                        <div className="card-header">Ventas por Producto</div>
                        <div className="card-body">
                            {/* Aquí irá la tabla o gráfica de ventas por producto */}
                            <p>Total de productos distintos vendidos: {productSalesReport.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <ReportSalesTable sales={sales} onViewDetails={setSelectedSale}/>
            </div>

            <SaleDetailModal
                sale={selectedSale}
                ingredients={ingredients}
                onClose={() => setSelectedSale(null)}
            />
        </>
    );
};

export default SalesReport;