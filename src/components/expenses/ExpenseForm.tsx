import * as React from 'react';
import {FC, useState, useEffect} from 'react';
import {Expense, NewExpenseData} from "../../types";

interface ExpenseFormProps {
    onSave: (data: NewExpenseData) => void;
    initialData?: Expense;
    isSubmitting: boolean;
}

const categories = ['operacional', 'servicios', 'salarios', 'marketing', 'otro'];

const ExpenseForm: FC<ExpenseFormProps> = ({onSave, initialData, isSubmitting}) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [displayAmount, setDisplayAmount] = useState('0');
    const [category, setCategory] = useState(categories[0]);

    useEffect(() => {
        if (initialData) {
            setDescription(initialData.description);
            setAmount(initialData.amount);
            setDisplayAmount(new Intl.NumberFormat('es-CO').format(initialData.amount));
            setCategory(initialData.category);
        } else {
            setDescription('');
            setAmount(0);
            setDisplayAmount('0');
            setCategory(categories[0]);
        }
    }, [initialData]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // 1. Limpiamos la entrada para quedarnos solo con los dígitos
        const rawValue = e.target.value.replace(/\D/g, '');

        // 2. Convertimos el valor limpio a un número y actualizamos el estado numérico
        const numericValue = parseInt(rawValue, 10) || 0;
        setAmount(numericValue);

        // 3. Formateamos el valor numérico para mostrarlo con puntos y actualizamos el estado de visualización
        setDisplayAmount(new Intl.NumberFormat('es-CO').format(numericValue));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aquí faltaría el owner y el employeeId, que se añadirán en la página principal
        onSave({description, amount, category} as NewExpenseData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="description" className="form-label">Descripción</label>
                <input type="text" id="description" className="form-control" value={description}
                       onChange={e => setDescription(e.target.value)} required/>
            </div>
            <div className="mb-3">
                <label htmlFor="amount" className="form-label">Monto</label>
                <input
                    type="text"
                    inputMode="numeric"
                    id="amount"
                    className="form-control"
                    value={displayAmount}
                    onChange={handleAmountChange}
                    required
                />
            </div>
            <div className="mb-3">
                <label htmlFor="category" className="form-label">Categoría</label>
                <select id="category" className="form-select" value={category}
                        onChange={e => setCategory(e.target.value as any)}>
                    {categories.map(cat => <option key={cat}
                                                   value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
                </select>
            </div>
            <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Guardar Gasto'}
                </button>
            </div>
        </form>
    );
};

export default ExpenseForm;