import {Table} from '@tanstack/react-table';
import {flexRender} from '@tanstack/react-table';
import {ArrowDown, ArrowUp} from "react-bootstrap-icons";

interface DataTableProps<TData> {
    table: Table<TData>;
    globalFilter: string;
    setGlobalFilter: (filter: string) => void;
    searchPlaceholder: string;
}

// Usamos genéricos <TData> para que el componente sea reutilizable con cualquier tipo de dato.
const DataTable = <TData extends object>({
                                             table,
                                             globalFilter,
                                             setGlobalFilter,
                                             searchPlaceholder,
                                         }: DataTableProps<TData>) => {
    return (
        <>
            <div className="mb-3">
                <input
                    type="text"
                    value={globalFilter ?? ''}
                    onChange={e => setGlobalFilter(e.target.value)}
                    className="form-control form-control-sm"
                    placeholder={searchPlaceholder}
                />
            </div>
            <div className="table-responsive">
                <table className="table table-hover">
                    <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th
                                    key={header.id}
                                    scope="col"
                                    className={`text-${header.column.columnDef.meta?.align || 'start'}`}
                                    onClick={header.column.getToggleSortingHandler()}
                                    style={{cursor: header.column.getCanSort() ? 'pointer' : 'default'}}
                                >
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                    {{
                                        asc: <ArrowUp className="ms-1"/>,
                                        desc: <ArrowDown className="ms-1"/>,
                                    }[header.column.getIsSorted() as string] ?? null}
                                </th>
                            ))}
                        </tr>
                    ))}
                    </thead>
                    <tbody>
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id} className={`text-${cell.column.columnDef.meta?.align || 'start'}`}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="d-flex gap-2 align-items-center">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}>
                        {'<<'}
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}>
                        {'<'}
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}>
                        {'>'}
                    </button>
                    <button className="btn btn-sm btn-outline-secondary"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}>
                        {'>>'}
                    </button>
                    <span className="text-muted small">
                         Página{' '}
                        <strong>
                             {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                         </strong>
                     </span>
                </div>
                <select
                    className="form-select form-select-sm"
                    style={{width: 'auto'}}
                    value={table.getState().pagination.pageSize}
                    onChange={e => table.setPageSize(Number(e.target.value))}
                >
                    {[10, 25, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                            Mostrar {pageSize}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
};

export default DataTable;