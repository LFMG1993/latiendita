import {FC, useMemo, useState} from 'react';
import ActionButtons from '../../shared/ActionButtons';
import CloudinaryImage from "../../shared/CloudinaryImage";
import {getPublicIdFromUrl} from "../../../utils/getPublicIdFromUrl";
import {Shop} from "../../../types";
import {
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable
} from "@tanstack/react-table";
import DataTable from "../../shared/DataTable.tsx";

interface ShopsTableProps {
    shops: Shop[];
    onEdit: (shop: Shop) => void;
    onDelete: (shopId: string) => void;
}

const columnHelper = createColumnHelper<Shop>();

const ShopsTable: FC<ShopsTableProps> = ({shops, onEdit, onDelete}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    if (shops.length === 0) {
        return <div className="alert alert-info">
            Aún no has añadido ninguna heladería. ¡Comienza creando una!
        </div>;
    }

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'image',
            header: 'Imagen',
            cell: ({row}) => (
                <CloudinaryImage
                    publicId={getPublicIdFromUrl(row.original.photoURL)}
                    width={80} height={80} alt={`Foto de ${row.original.name}`}
                />
            ),
            meta: {align: 'center'}
        }),
        columnHelper.accessor('name', {
            header: 'Nombre',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('address', {
            header: 'Dirección',
            cell: info => info.getValue() || '-',
        }),
        columnHelper.accessor('whatsapp', {
            header: 'WhatsApp',
            cell: info => info.getValue() || '-',
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
        data: shops,
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
            searchPlaceholder="Buscar heladerías..."
        />
    );
};

export default ShopsTable;