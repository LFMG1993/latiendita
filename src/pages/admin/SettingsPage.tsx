import {FC, useState, useEffect, useRef} from "react";
import Breadcrumbs from "../../components/general/Breadcrumbs.tsx";
import {useAuthStore} from "../../store/authStore.ts";
import FullScreenLoader from "../../components/general/FullScreenLoader.tsx";
import {PaymentMethod} from "../../types";
import {getAllPaymentMethods, deletePaymentMethod} from "../../services/paymentMethodServices.ts";
import Modal from "../../components/general/Modal.tsx";
import PaymentMethodsTable from "../../components/settings/PaymentMethodsTable.tsx";
import PaymentMethodForm from "../../components/settings/PaymentMethodForm.tsx";
import {Collapse} from "bootstrap";
import {ChevronDown} from "react-bootstrap-icons";

const SettingsPage: FC = () => {
    const {activeIceCreamShopId: shopId, loading: authLoading} = useAuthStore();
    const [pageLoading, setPageLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | undefined>(undefined);
    const [refetchTrigger, setRefetchTrigger] = useState(0);
    const paymentMethodsCollapseRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!shopId) return;
            setPageLoading(true);
            try {
                const data = await getAllPaymentMethods(shopId);
                setPaymentMethods(data);
            } catch (error) {
                console.error("Error al obtener los métodos de pago:", error);
            } finally {
                setPageLoading(false);
            }
        };
        fetchData();
    }, [shopId, refetchTrigger]);

    // Efecto para inicializar el componente Collapse de Bootstrap de forma segura
    useEffect(() => {
        const collapseEl = paymentMethodsCollapseRef.current;
        if (!collapseEl) return;

        // Creamos la instancia pero no la activamos (toggle: false)
        // para que respete el estado inicial definido por la clase 'show'.
        const collapseInstance = new Collapse(collapseEl, {toggle: false});

        // Limpiamos la instancia cuando el componente se desmonte para evitar fugas de memoria.
        return () => collapseInstance.dispose();
    }, []);

    if (authLoading || pageLoading) return <FullScreenLoader/>;

    const handleOpenAddModal = () => {
        setEditingMethod(undefined);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (method: PaymentMethod) => {
        setEditingMethod(method);
        setIsModalOpen(true);
    };

    const handleDelete = async (methodId: string) => {
        if (shopId && window.confirm("¿Estás seguro de que quieres eliminar este método de pago?")) {
            try {
                await deletePaymentMethod(shopId, methodId);
                setRefetchTrigger(c => c + 1);
            } catch (error) {
                console.error("Error al eliminar el método de pago:", error);
            }
        }
    };

    const handleFormSubmit = () => {
        setIsModalOpen(false);
        setRefetchTrigger(c => c + 1);
    };
    return (
        <>
            <main className="px-md-4">
                <Breadcrumbs/>
                <div
                    className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 className="h2">Configuraciones de la Tienda</h1>
                </div>
                <div className="accordion" id="settingsAccordion">
                    <div className="card">
                        <div className="card-header p-0" id="headingPaymentMethods">
                            <a href="#paymentMethodsCollapse" data-bs-toggle="collapse" role="button"
                               aria-expanded="false"
                               className="d-flex justify-content-between align-items-center p-3 text-decoration-none text-dark collapsed">
                                <h5 className="mb-0 fw-bold">Métodos de Pago</h5>
                                <div className="d-flex align-items-center">
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Previene que el clic en el botón active el collapse.
                                            handleOpenAddModal();
                                        }}
                                    >+ Añadir Método
                                    </button>
                                    <ChevronDown className="ms-3 collapse-arrow"/>
                                </div>
                            </a>
                        </div>
                        <div ref={paymentMethodsCollapseRef} id="paymentMethodsCollapse" className="collapse"
                             aria-labelledby="headingPaymentMethods"
                             data-bs-parent="#settingsAccordion">
                            <div className="card-body">
                                <p className="text-muted small">Define los métodos de pago que aparecerán en el punto de
                                    venta.</p>
                                <PaymentMethodsTable methods={paymentMethods} onEdit={handleOpenEditModal}
                                                     onDelete={handleDelete}/>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Modal title={editingMethod ? "Editar Método de Pago" : "Añadir Nuevo Método de Pago"} show={isModalOpen}
                   onClose={() => setIsModalOpen(false)}>
                <PaymentMethodForm onFormSubmit={handleFormSubmit} methodToEdit={editingMethod} shopId={shopId!}/>
            </Modal>
        </>
    );
};

export default SettingsPage;