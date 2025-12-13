import {FC, useState, useEffect} from 'react';
import {useAuthStore} from "../../store/authStore.ts";
import {Expense, NewExpenseData} from "../../types";
import {addExpense, deleteExpense, getExpenses, updateExpense} from "../../services/expenseServices.ts";
import Breadcrumbs from "../../components/general/Breadcrumbs.tsx";
import ExpensesTable from "../../components/expenses/ExpensesTable.tsx";
import Modal from "../../components/general/Modal.tsx";
import ExpenseForm from "../../components/expenses/ExpenseForm.tsx";
import LoadingOverlay from "../../components/general/LoadingOverlay.tsx";

const ExpensesPage: FC = () => {
    const {activeIceCreamShop, user, loading: authLoading} = useAuthStore();
    const [pageLoading, setPageLoading] = useState(true);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
    const [refetchTrigger, setRefetchTrigger] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!authLoading && activeIceCreamShop?.id) {
            setPageLoading(true);
            getExpenses(activeIceCreamShop.id)
                .then(setExpenses)
                .catch(console.error)
                .finally(() => setPageLoading(false));
        }
    }, [activeIceCreamShop?.id, authLoading, refetchTrigger]);

    const handleOpenModal = (expense?: Expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingExpense(undefined);
    };

    const handleSave = async (data: NewExpenseData) => {
        if (!activeIceCreamShop?.id || !user?.uid || !activeIceCreamShop.owner) return;
        setIsSubmitting(true);

        const expenseData = {
            ...data,
            recordedByEmployeeId: user.uid,
            owner: activeIceCreamShop.owner,
        };

        try {
            if (editingExpense) {
                await updateExpense(activeIceCreamShop.id, editingExpense.id, expenseData);
            } else {
                await addExpense(activeIceCreamShop.id, expenseData);
            }
            handleSuccess();
        } catch (error) {
            console.error("Error al guardar el gasto:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (expenseId: string) => {
        if (!activeIceCreamShop?.id || !window.confirm("¿Estás seguro de que quieres eliminar este gasto?")) return;
        await deleteExpense(activeIceCreamShop.id, expenseId);
        handleSuccess();
    };

    const handleSuccess = () => {
        handleCloseModal();
        setRefetchTrigger(c => c + 1);
    };

    return (
        <>
            <main className="px-md-4">
                <Breadcrumbs/>
                <div
                    className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 className="h2">Gestión de Gastos</h1>
                    <div className="btn-toolbar mb-2 mb-md-0">
                        <button className="btn btn-sm btn-primary" onClick={() => handleOpenModal()}>
                            Registrar Nuevo Gasto
                        </button>
                    </div>
                </div>
                <LoadingOverlay loading={pageLoading}>
                    <ExpensesTable expenses={expenses} onEdit={handleOpenModal} onDelete={handleDelete}/>
                </LoadingOverlay>
            </main>

            <Modal title={editingExpense ? "Editar Gasto" : "Registrar Nuevo Gasto"} show={isModalOpen}
                   onClose={handleCloseModal}>
                <ExpenseForm
                    onSave={handleSave}
                    initialData={editingExpense}
                    isSubmitting={isSubmitting}
                />
            </Modal>
        </>
    );
};

export default ExpensesPage;