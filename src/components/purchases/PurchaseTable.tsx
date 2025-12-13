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

interface PurchaseTableProps {
    purchases: Purchase[];
    onEdit: (purchase: Purchase) => void;
    onDelete: (purchaseId: string) => void;
}

// Función de ayuda para formatear moneda
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
    }).format(value);
};

const columnHelper = createColumnHelper<Purchase>();

const PurchaseTable: FC<PurchaseTableProps> = ({purchases, onEdit, onDelete}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    if (purchases.length === 0) {
        return <div className="alert alert-info">No hay compras registradas. Comienza registrando una.</div>;
    }

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
        columnHelper.accessor('total', {
            header: 'Total Compra',
            cell: info => formatCurrency(info.getValue()),
            meta: {align: 'end'}
        }),
        columnHelper.accessor('items', {
            header: 'Ítems',
            cell: info => info.getValue()?.length || 0,
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

    return (
        <DataTable
            table={table}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            searchPlaceholder="Buscar por proveedor, factura..."
        />
    );
};

export default PurchaseTable;