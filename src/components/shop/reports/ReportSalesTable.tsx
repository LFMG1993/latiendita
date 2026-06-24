import {FC, useMemo, useState} from 'react';
import {Sale} from "../../../types";
import {
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable
} from "@tanstack/react-table";
import DataTable from "../../general/DataTable.tsx";

interface ReportSalesTableProps {
    sales: Sale[];
    onViewDetails: (sale: Sale) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(value);

const columnHelper = createColumnHelper<Sale>();

const ReportSalesTable: FC<ReportSalesTableProps> = ({sales, onViewDetails}) => {

    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    if (sales.length === 0) {
        return <div className="alert alert-info">No hay ventas para mostrar en el período seleccionado.</div>;
    }

    const columns = useMemo(() => [
        columnHelper.accessor('createdAt', {
            header: 'Fecha y Hora',
            cell: info => new Date(info.getValue() as string).toLocaleString('es-CO', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) || 'N/A',
        }),
        columnHelper.accessor('employeeName', {
            header: 'Vendedor',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('payments', {
            header: 'Método de Pago',
            cell: info => info.getValue()?.map(p => p.methodName).join(', ') || 'No especificado',
        }),
        columnHelper.accessor('total', {
            header: 'Total Venta',
            cell: info => formatCurrency(info.getValue()),
            meta: {align: 'end'}
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Acción',
            cell: ({row}) => (
                <button className="btn btn-sm btn-outline-primary"
                        onClick={() => onViewDetails(row.original)}>
                    Ver Detalles
                </button>
            ),
            meta: {align: 'center'}
        }),
    ], [onViewDetails]);

    const table = useReactTable({
        data: sales,
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

    return (
        <DataTable
            table={table}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            searchPlaceholder="Buscar por vendedor, método de pago..."
        />
    );
};

export default ReportSalesTable;