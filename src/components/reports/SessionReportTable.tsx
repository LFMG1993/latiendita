import {FC, useMemo, useState} from 'react';
import {CashSession} from "../../types";
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

interface SessionReportTableProps {
    sessions: CashSession[];
    onViewDetails: (session: CashSession) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(value);

const columnHelper = createColumnHelper<CashSession>();

const SessionReportTable: FC<SessionReportTableProps> = ({sessions, onViewDetails}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const columns = useMemo(() => [
        columnHelper.accessor('startTime', {
            header: 'Apertura',
            cell: info => info.getValue()?.toDate().toLocaleString('es-CO', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) || 'N/A',
        }),
        columnHelper.accessor('endTime', {
            header: 'Cierre',
            cell: info => info.getValue()?.toDate().toLocaleString('es-CO', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) || 'N/A',
        }),
        columnHelper.accessor('employeeName', {
            header: 'Empleado',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('totalSales', {
            header: 'Ventas',
            cell: info => formatCurrency(info.getValue() || 0),
            meta: {align: 'end'}
        }),
        columnHelper.accessor('totalExpenses', {
            header: 'Gastos',
            cell: info => formatCurrency(info.getValue() || 0),
            meta: {align: 'end'}
        }),
        columnHelper.accessor('difference', {
            header: 'Diferencia',
            cell: info => (
                <span className={
                    (info.getValue() || 0) > 0 ? 'text-success' : (info.getValue() || 0) < 0 ? 'text-danger' : ''
                }>
                    {formatCurrency(info.getValue() || 0)}
                </span>
            ),
            meta: {align: 'end'}
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Análisis',
            cell: ({row}) => (
                <button className="btn btn-sm btn-outline-primary"
                        onClick={() => onViewDetails(row.original)}>
                    Ver Análisis
                </button>
            ),
            meta: {align: 'center'}
        }),
    ], [onViewDetails]);

    const table = useReactTable({
        data: sessions,
        columns,
        state: {sorting, globalFilter},
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
            searchPlaceholder="Buscar por empleado..."
        />
    );
};

export default SessionReportTable;