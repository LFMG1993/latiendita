import {FC, useMemo, useState} from 'react';
import ActionButtons from "../general/ActionButtons";
import {Purchase} from "../../types";
import {
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable
} from "@tanstack/react-table";
import DataTable from "../general/DataTable.tsx";
import Modal from "../general/Modal.tsx";
import {Eye, Calendar, Receipt, Person, Tag} from "react-bootstrap-icons";

interface PurchaseTableProps {
    purchases: Purchase[];
    onEdit: (purchase: Purchase) => void;
    onDelete: (purchaseId: string) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(value);
};

const columnHelper = createColumnHelper<Purchase>();

const PurchaseTable: FC<PurchaseTableProps> = ({purchases, onEdit, onDelete}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

    const columns = useMemo(() => [
        columnHelper.accessor('createdAt', {
            header: 'Fecha',
            cell: info => info.getValue()?.toDate().toLocaleDateString('es-CO') || 'N/A',
        }),
        columnHelper.accessor('supplierName', {
            header: 'Proveedor',
            cell: info => (
                <span className="badge bg-secondary-subtle text-secondary-emphasis rounded-pill px-3 py-1">
                    {info.getValue() || 'Varios'}
                </span>
            ),
        }),
        columnHelper.accessor('invoiceNumber', {
            header: 'N° Factura',
            cell: info => <span className="fw-semibold text-body">{info.getValue() || 'N/A'}</span>,
        }),
        columnHelper.accessor('total', {
            header: 'Total Compra',
            cell: info => <span className="fw-bold text-success">{formatCurrency(info.getValue())}</span>,
            meta: {align: 'end'}
        }),
        columnHelper.accessor('items', {
            header: 'Ítems',
            cell: ({row}) => (
                <button
                    type="button"
                    className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                    onClick={() => setViewingPurchase(row.original)}
                >
                    <Eye size={12} />
                    <span>{row.original.items?.length || 0} prod.</span>
                </button>
            ),
            meta: {align: 'center'}
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Acciones',
            cell: ({row}) => (
                <ActionButtons onEdit={() => onEdit(row.original)} onDelete={() => onDelete(row.original.id)}/>
            ),
            meta: {align: 'center'}
        }),
    ], [onDelete, onEdit]);

    const table = useReactTable({
        data: purchases,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    if (purchases.length === 0) {
        return <div className="alert alert-info">No hay compras registradas. Comienza registrando una.</div>;
    }

    return (
        <>
            <DataTable
                table={table}
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
                searchPlaceholder="Buscar por proveedor, factura..."
            />

            {/* Modal de Detalle de Compra */}
            <Modal
                title="Detalle de la Compra"
                show={!!viewingPurchase}
                onClose={() => setViewingPurchase(null)}
                size="lg"
            >
                {viewingPurchase && (
                    <div>
                        {/* Cabecera / Info General */}
                        <div className="row g-3 mb-4">
                            <div className="col-sm-6 col-md-3">
                                <div className="p-3 rounded-3 bg-body-tertiary border text-center h-100">
                                    <div className="text-muted small mb-1"><Calendar size={14} className="me-1"/> Fecha</div>
                                    <div className="fw-bold">{viewingPurchase.createdAt?.toDate().toLocaleDateString('es-CO')}</div>
                                </div>
                            </div>
                            <div className="col-sm-6 col-md-3">
                                <div className="p-3 rounded-3 bg-body-tertiary border text-center h-100">
                                    <div className="text-muted small mb-1"><Receipt size={14} className="me-1"/> Factura</div>
                                    <div className="fw-bold">{viewingPurchase.invoiceNumber || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="col-sm-6 col-md-3">
                                <div className="p-3 rounded-3 bg-body-tertiary border text-center h-100">
                                    <div className="text-muted small mb-1"><Person size={14} className="me-1"/> Proveedor</div>
                                    <div className="fw-bold text-truncate" title={viewingPurchase.supplierName}>
                                        {viewingPurchase.supplierName || 'Varios'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-6 col-md-3">
                                <div className="p-3 rounded-3 bg-success-subtle border border-success-subtle text-center h-100">
                                    <div className="text-success-emphasis small mb-1"><Tag size={14} className="me-1"/> Total</div>
                                    <div className="fw-bold text-success fs-5">{formatCurrency(viewingPurchase.total)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Listado de Productos Adquiridos */}
                        <h6 className="fw-bold mb-3">Productos Adquiridos ({viewingPurchase.items?.length || 0})</h6>
                        <div className="table-responsive rounded-3 border">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Producto / Insumo</th>
                                        <th>Tipo</th>
                                        <th>Proveedor</th>
                                        <th className="text-center">Cantidad</th>
                                        <th className="text-end">Costo Unit.</th>
                                        <th className="text-end">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewingPurchase.items?.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div className="fw-semibold text-body">{item.name}</div>
                                                <small className="text-muted">{item.purchaseUnit}</small>
                                            </td>
                                            <td>
                                                <span className={`badge ${item.itemType === 'product' ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info'} rounded-pill`}>
                                                    {item.itemType === 'product' ? 'Producto' : 'Ingrediente'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-muted small">
                                                    {item.supplierName || viewingPurchase.supplierName || 'Varios'}
                                                </span>
                                            </td>
                                            <td className="text-center fw-semibold text-body">{item.quantity}</td>
                                            <td className="text-end text-muted">{formatCurrency(item.unitCost)}</td>
                                            <td className="text-end fw-bold text-body">
                                                {formatCurrency(item.quantity * item.unitCost)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-end mt-4">
                            <button
                                type="button"
                                className="btn btn-secondary rounded-pill px-4"
                                onClick={() => setViewingPurchase(null)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default PurchaseTable;