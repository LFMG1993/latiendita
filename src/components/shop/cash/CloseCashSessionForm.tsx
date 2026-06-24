import {FC, useState, FormEvent, useMemo} from "react";

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(value);

interface CloseCashSessionFormProps {
    onSubmit: (data: { closingBalance: number, notes: string | undefined }) => void;
    loading: boolean;
    sessionTotals: {
        cashSales: number,
        electronicSales: number,
        totalSales: number,
        totalPurchaseExpenses: number,
        totalOperationalExpenses: number
    };
    openingBalance: number;
}

const CloseCashSessionForm: FC<CloseCashSessionFormProps> = ({onSubmit, loading, sessionTotals, openingBalance}) => {
    const [closingBalance, setClosingBalance] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const finalBalance = parseFloat(closingBalance);
        if (isNaN(finalBalance) || finalBalance < 0) return;
        onSubmit({closingBalance: finalBalance, notes});
    };

    const expectedCashInBox = useMemo(() => {
        const base = Number(openingBalance);
        const sales = Number(sessionTotals.cashSales);
        const purchases = Number(sessionTotals.totalPurchaseExpenses);
        const expenses = Number(sessionTotals.totalOperationalExpenses);
        return base + sales - purchases - expenses;
    }, [openingBalance, sessionTotals.cashSales, sessionTotals.totalPurchaseExpenses, sessionTotals.totalOperationalExpenses]);

    const difference = useMemo(() => {
        const finalBalance = parseFloat(closingBalance);
        if (isNaN(finalBalance)) return null;
        return finalBalance - expectedCashInBox;
    }, [closingBalance, expectedCashInBox]);

    const hasInput = closingBalance !== '';
    const diffValue = difference ?? 0;

    const diffConfig = useMemo(() => {
        if (difference === null) return { color: '#6c757d', bg: 'rgba(108,117,125,0.08)', border: 'rgba(108,117,125,0.2)', label: 'Ingresa el conteo', icon: '⏳' };
        if (difference === 0) return { color: '#198754', bg: 'rgba(25,135,84,0.08)', border: 'rgba(25,135,84,0.25)', label: '✓ Caja cuadrada perfectamente', icon: '✅' };
        if (difference > 0) return { color: '#0d6efd', bg: 'rgba(13,110,253,0.08)', border: 'rgba(13,110,253,0.25)', label: `Sobrante en caja`, icon: '📈' };
        return { color: '#dc3545', bg: 'rgba(220,53,69,0.08)', border: 'rgba(220,53,69,0.25)', label: `Faltante en caja`, icon: '📉' };
    }, [difference]);

    const summaryRows = [
        { label: 'Base Inicial', value: openingBalance, sign: '', color: 'var(--bs-body-color)', icon: '🏦', bold: false },
        { label: 'Ventas en Efectivo', value: sessionTotals.cashSales, sign: '+', color: '#198754', icon: '💵', bold: false },
        { label: 'Ventas Electrónicas', value: sessionTotals.electronicSales, sign: '', color: 'var(--bs-body-color)', icon: '💳', bold: false },
        { label: 'Compras del Turno', value: sessionTotals.totalPurchaseExpenses, sign: '-', color: '#dc3545', icon: '🛒', bold: false },
        { label: 'Gastos del Turno', value: sessionTotals.totalOperationalExpenses, sign: '-', color: '#dc3545', icon: '📋', bold: false },
    ];

    return (
        <form onSubmit={handleSubmit}>
            <div className="row g-4">
                {/* ── Columna izquierda: Resumen ── */}
                <div className="col-md-6">
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <div style={{width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16}}>📊</div>
                        <h6 className="fw-bold mb-0 text-body">Resumen del Turno</h6>
                    </div>

                    <div className="d-flex flex-column gap-2">
                        {summaryRows.map((row) => (
                            <div
                                key={row.label}
                                className="d-flex justify-content-between align-items-center px-3 py-2 rounded-3"
                                style={{background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color-translucent)'}}
                            >
                                <span className="small d-flex align-items-center gap-2">
                                    <span style={{fontSize: 15}}>{row.icon}</span>
                                    <span className="text-body-secondary">{row.label}</span>
                                </span>
                                <span className="fw-semibold small" style={{color: row.color}}>
                                    {row.sign}{formatCurrency(row.value)}
                                </span>
                            </div>
                        ))}

                        {/* Total resaltado */}
                        <div
                            className="d-flex justify-content-between align-items-center px-3 py-3 rounded-3 mt-1"
                            style={{
                                background: 'linear-gradient(135deg, rgba(13,110,253,0.12), rgba(99,102,241,0.1))',
                                border: '1.5px solid rgba(13,110,253,0.3)',
                            }}
                        >
                            <span className="fw-bold d-flex align-items-center gap-2">
                                <span style={{fontSize: 16}}>🎯</span>
                                <span>Efectivo Esperado</span>
                            </span>
                            <span className="fw-bold fs-6" style={{color: '#0d6efd'}}>
                                {formatCurrency(expectedCashInBox)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Columna derecha: Reconciliación ── */}
                <div className="col-md-6 d-flex flex-column gap-3">
                    <div className="d-flex align-items-center gap-2 mb-0">
                        <div style={{width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16}}>🧾</div>
                        <h6 className="fw-bold mb-0 text-body">Reconciliación</h6>
                    </div>

                    {/* Input conteo */}
                    <div>
                        <label htmlFor="closingBalance" className="form-label small fw-semibold text-body-secondary mb-1">
                            Conteo Final de Efectivo
                        </label>
                        <div className="input-group input-group-lg shadow-sm">
                            <span className="input-group-text fw-bold" style={{background: 'var(--bs-tertiary-bg)', border: '1.5px solid var(--bs-border-color)', borderRight: 'none', color: '#198754', fontSize: 18}}>$</span>
                            <input
                                type="number"
                                id="closingBalance"
                                className="form-control"
                                style={{borderLeft: 'none', fontSize: '1.1rem', fontWeight: 600}}
                                value={closingBalance}
                                onChange={e => setClosingBalance(e.target.value)}
                                required
                                autoFocus
                                min="0"
                                step="any"
                                placeholder="0"
                            />
                        </div>
                        <small className="text-body-secondary" style={{fontSize: '0.78rem'}}>
                            Ingresa el dinero físico contado en la caja al cerrar.
                        </small>
                    </div>

                    {/* Textarea notas */}
                    <div>
                        <label htmlFor="notes" className="form-label small fw-semibold text-body-secondary mb-1">
                            Observaciones <span className="fw-normal opacity-50">(Opcional)</span>
                        </label>
                        <textarea
                            id="notes"
                            className="form-control"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Ej: Hubo un gasto extra no registrado..."
                            style={{resize: 'none', fontSize: '0.9rem'}}
                        />
                    </div>

                    {/* Panel diferencia */}
                    <div
                        className="rounded-3 px-3 py-3 d-flex flex-column gap-1"
                        style={{
                            background: diffConfig.bg,
                            border: `1.5px solid ${diffConfig.border}`,
                            transition: 'all 0.35s ease',
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold d-flex align-items-center gap-2" style={{color: diffConfig.color}}>
                                <span style={{fontSize: 18}}>{diffConfig.icon}</span>
                                Diferencia
                            </span>
                            <span className="fw-bold fs-5" style={{color: diffConfig.color}}>
                                {hasInput ? formatCurrency(diffValue) : '—'}
                            </span>
                        </div>
                        <small className="fw-semibold" style={{color: diffConfig.color, opacity: 0.85, fontSize: '0.8rem'}}>
                            {diffConfig.label}
                        </small>

                        {/* Barra visual */}
                        {hasInput && difference !== null && difference !== 0 && (
                            <div className="mt-2" style={{height: 4, borderRadius: 4, background: 'var(--bs-border-color)'}}>
                                <div style={{
                                    height: '100%',
                                    borderRadius: 4,
                                    width: `${Math.min(Math.abs(difference / expectedCashInBox) * 100, 100)}%`,
                                    background: difference > 0 ? '#0d6efd' : '#dc3545',
                                    transition: 'width 0.4s ease'
                                }}/>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="d-flex justify-content-between align-items-center mt-4 pt-3" style={{borderTop: '1px solid var(--bs-border-color-translucent)'}}>
                <div className="small text-body-secondary d-flex align-items-center gap-1">
                    <span>🔒</span>
                    <span>Esta acción cerrará el turno definitivamente.</span>
                </div>
                <button
                    type="submit"
                    className="btn fw-bold px-4 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2"
                    disabled={loading || closingBalance === ''}
                    style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        border: 'none',
                        color: '#fff',
                        minWidth: 200,
                        justifyContent: 'center',
                        opacity: closingBalance === '' ? 0.65 : 1,
                        transition: 'opacity 0.2s'
                    }}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm" role="status"/>
                            Cerrando...
                        </>
                    ) : (
                        <>
                            <span>🔐</span>
                            Confirmar y Cerrar Caja
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default CloseCashSessionForm;