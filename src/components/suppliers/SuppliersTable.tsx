import {FC, useMemo, useState} from 'react';
import ActionButtons from "../general/ActionButtons";
import {Supplier} from "../../types";
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

interface SupplierTableProps {
    suppliers: Supplier[];
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplierId: string) => void;
}

const columnHelper = createColumnHelper<Supplier>();

const SuppliersTable: FC<SupplierTableProps> = ({suppliers, onEdit, onDelete}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    if (suppliers.length === 0) {
        return <div className="alert alert-info">No hay proveedores registrados. Comienza registrando uno.</div>;
    }

    const columns = useMemo(() => [
        columnHelper.accessor('createdAt', {
            header: 'Fecha Creación',
            cell: info => info.getValue()?.toDate().toLocaleDateString('es-CO') || 'N/A',
        }),
        columnHelper.accessor('name', {
            header: 'Nombre',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('contactPerson', {
            header: 'Contacto',
            cell: info => info.getValue() || 'N/A',
        }),
        columnHelper.accessor('phone', {
            header: 'Teléfono',
            cell: info => info.getValue() || 'N/A',
        }),
        columnHelper.accessor('email', {
            header: 'Correo',
            cell: info => info.getValue() || 'N/A',
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
        data: suppliers,
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
            searchPlaceholder="Buscar por nombre, contacto, correo..."
        />
    );
};

export default SuppliersTable;