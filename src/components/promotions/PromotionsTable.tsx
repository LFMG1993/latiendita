import {FC, useMemo, useState} from "react";
import {Promotion} from "../../types";
import ActionButtons from "../general/ActionButtons";
import {usePermissions} from "../../hooks/usePermissions";
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

interface PromotionsTableProps {
    promotions: Promotion[];
    onEdit: (promo: Promotion) => void;
    onDelete: (promoId: string) => void;
}

const daysMap = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Helper para crear las columnas de forma segura con TypeScript
const columnHelper = createColumnHelper<Promotion>();

// Función de ayuda para formatear moneda
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
    }).format(value);
};

const PromotionsTable: FC<PromotionsTableProps> = ({promotions, onEdit, onDelete}) => {
    const {hasPermission} = usePermissions();
    const canEdit = hasPermission('promotions_update');
    const canDelete = hasPermission('promotions_delete');

    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: 'Nombre',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('price', {
            header: 'Precio',
            cell: info => formatCurrency(info.getValue()),
        }),
        columnHelper.accessor('activeDays', {
            header: 'Días Activos',
            cell: info => info.getValue().map(d => daysMap[d]).join(', '),
        }),
        columnHelper.accessor('isEnabled', {
            header: 'Estado',
            cell: info => (
                <span className={`badge ${info.getValue() ? 'bg-success' : 'bg-secondary'}`}>
                     {info.getValue() ? 'Activa' : 'Inactiva'}
                 </span>
            ),
            meta: {
                align: 'center',
            }
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Acciones',
            cell: ({row}) => (
                <ActionButtons
                    onEdit={canEdit ? () => onEdit(row.original) : undefined}
                    onDelete={canDelete ? () => onDelete(row.original.id) : undefined}
                />
            ),
            meta: {
                align: 'center',
            }
        }),
    ], [canEdit, canDelete, onEdit, onDelete]);

    const table = useReactTable({
        data: promotions,
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
            searchPlaceholder="Buscar promociones..."
        />
    );
};

export default PromotionsTable;