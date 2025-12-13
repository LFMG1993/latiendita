import {FC, useMemo, useState} from 'react';
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

interface PurchaseReportTableProps {
    purchases: Purchase[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(value);

const columnHelper = createColumnHelper<Purchase>();

const PurchaseReportTable: FC<PurchaseReportTableProps> = ({purchases}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const columns = useMemo(() => [
        columnHelper.accessor('createdAt', {
            header: 'Fecha',
            cell: info => info.getValue()?.toDate().toLocaleDateString('es-CO') || 'N/A',
        }),
        columnHelper.accessor('supplierName', {
            header: 'Proveedor',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('invoiceNumber', {
            header: 'N° Factura',
            cell: info => info.getValue() || 'N/A',
        }),
        columnHelper.accessor('items', {
            header: 'Ítems',
            cell: info => info.getValue()?.length || 0,
            meta: {align: 'center'}
        }),
        columnHelper.accessor('total', {
            header: 'Total Compra',
            cell: info => formatCurrency(info.getValue()),
            meta: {align: 'end'}
        }),
    ], []);

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

    return (
        <DataTable
            table={table}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            searchPlaceholder="Buscar por proveedor, factura..."
        />
    );
};

export default PurchaseReportTable;