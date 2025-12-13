import {FC, useMemo, useState} from 'react';
import ActionButtons from "../general/ActionButtons";
import {EnrichedProduct} from "../../types";
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

interface ProductTableProps {
    products: EnrichedProduct[];
    onEdit: (product: EnrichedProduct) => void;
    onDelete: (productId: string) => void;
}

// Función de ayuda para formatear moneda y evitar repetición de código.
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
    }).format(value);
};

const columnHelper = createColumnHelper<EnrichedProduct>();

const ProductTable: FC<ProductTableProps> = ({products, onEdit, onDelete}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    if (products.length === 0) {
        return <div className="alert alert-info">No hay productos registrados. Comienza creando uno.</div>;
    }

    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: 'Nombre',
            cell: info => <span className="fw-bold">{info.getValue()}</span>,
        }),
        columnHelper.accessor('price', {
            header: 'Precio Venta',
            cell: info => formatCurrency(info.getValue()),
            meta: {align: 'end'}
        }),
        columnHelper.accessor('recipeCost', {
            header: 'Costo Receta',
            cell: info => (
                <>
                    {formatCurrency(info.getValue())}
                    {info.row.original.recipe.some(item => item.ingredientId.startsWith('CATEGORY::')) && (
                        <span className="ms-1 text-primary"
                              title="Costo estimado basado en el ingrediente más caro de la categoría.">*</span>
                    )}
                </>
            ),
            meta: {align: 'end'}
        }),
        columnHelper.accessor('estimatedProfit', {
            header: 'Ganancia',
            cell: info => (
                <span className={info.getValue() > 0 ? 'text-success' : 'text-danger'}>
                     {formatCurrency(info.getValue())}
                 </span>
            ),
            meta: {align: 'end'}
        }),
        columnHelper.accessor('availableUnits', {
            header: 'Disponibles',
            cell: info => (
                <span className={`badge ${info.getValue() <= 10 ? 'bg-danger' : 'bg-secondary'}`}>
                     {info.getValue()}
                 </span>
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
        data: products,
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
            searchPlaceholder="Buscar productos..."
        />
    );
};

export default ProductTable;