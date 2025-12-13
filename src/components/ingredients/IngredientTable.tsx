import {FC, useMemo, useState} from "react";
import {Ingredient} from "../../types";
import ActionButtons from "../general/ActionButtons";
import {
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import DataTable from "../general/DataTable.tsx";

interface IngredientTableProps {
    ingredients: Ingredient[];
    onEdit: (ingredient: Ingredient) => void;
    onDelete: (ingredientId: string) => void;
    onAdjust: (ingredient: Ingredient) => void;
}

// Helper para crear las columnas de forma segura con TypeScript
const columnHelper = createColumnHelper<Ingredient>();

const IngredientTable: FC<IngredientTableProps> = ({ingredients, onEdit, onDelete, onAdjust}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    // Definimos las columnas usando el helper
    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: 'Nombre',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('category', {
            header: 'Categoría',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('purchaseUnit', {
            header: 'Unidad Compra',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('consumptionUnitsPerPurchaseUnit', {
            header: 'Ratio Conversión',
            cell: info => `1 ${info.row.original.purchaseUnit} = ${info.getValue()} ${info.row.original.consumptionUnit}`,
        }),
        columnHelper.accessor('stock', {
            header: 'Stock',
            cell: info => `${info.getValue() || 0} ${info.row.original.consumptionUnit}`,
            meta: {
                align: 'center',
            }
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Acciones',
            cell: ({row}) => (
                <ActionButtons
                    onEdit={() => onEdit(row.original)}
                    onDelete={() => onDelete(row.original.id)}
                    onAdjust={() => onAdjust(row.original)}
                />
            ),
            meta: {
                align: 'center',
            }
        }),
    ], [onEdit, onDelete, onAdjust]);

    const table = useReactTable({
        data: ingredients,
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
    if (ingredients.length === 0) {
        return <div className="alert alert-info">No hay ingredientes registrados. Comienza agregando uno.</div>;
    }

    return (
        <DataTable
            table={table}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            searchPlaceholder="Buscar ingredientes..."
        />
    );
};

export default IngredientTable;