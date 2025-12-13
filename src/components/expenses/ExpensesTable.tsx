import {FC, useMemo, useState} from 'react';
import {Expense} from "../../types";
import {createColumnHelper, useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState} from "@tanstack/react-table";
import DataTable from "../general/DataTable.tsx";
import ActionButtons from "../general/ActionButtons.tsx";

interface ExpensesTableProps {
    expenses: Expense[];
    onEdit: (expense: Expense) => void;
    onDelete: (expenseId: string) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

const columnHelper = createColumnHelper<Expense>();

const ExpensesTable: FC<ExpensesTableProps> = ({expenses, onEdit, onDelete}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const columns = useMemo(() => [
        columnHelper.accessor('createdAt', {
            header: 'Fecha',
            cell: info => info.getValue()?.toDate().toLocaleDateString('es-CO') || 'N/A',
        }),
        columnHelper.accessor('description', {
            header: 'Descripción',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('category', {
            header: 'Categoría',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('amount', {
            header: 'Monto',
            cell: info => formatCurrency(info.getValue()),
            meta: {align: 'end'}
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
        data: expenses,
        columns,
        state: { sorting, globalFilter },
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
            searchPlaceholder="Buscar por descripción, categoría..."
        />
    );
};

export default ExpensesTable;