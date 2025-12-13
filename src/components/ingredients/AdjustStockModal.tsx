import * as React from 'react';
import { FC, useState } from 'react';
import { Ingredient } from '../../types';
import Modal from '../general/Modal.tsx';
import { adjustIngredientStock } from '../../services/ingredientServices.ts';
import { useAuthStore } from '../../store/authStore.ts';

interface AdjustStockModalProps {
    ingredient: Ingredient | null;
    onClose: () => void;
    onSuccess: () => void;
}

const adjustmentReasons = [
    "Conteo físico de inventario",
    "Producto dañado o vencido",
    "Pérdida o merma",
    "Muestra o degustación",
    "Error en compra anterior",
    "Otro",
];

const AdjustStockModal: FC<AdjustStockModalProps> = ({ ingredient, onClose, onSuccess }) => {
    const { activeIceCreamShop, user } = useAuthStore();
    const [adjustment, setAdjustment] = useState(0);
    const [reason, setReason] = useState(adjustmentReasons[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!ingredient) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeIceCreamShop?.id || !user?.uid || !activeIceCreamShop.owner || adjustment === 0) {
            alert("Por favor, introduce una cantidad de ajuste válida.");
            return;
        }
        setIsSubmitting(true);
        try {
            await adjustIngredientStock(
                activeIceCreamShop.id,
                ingredient.id,
                adjustment,
                reason,
                user.uid,
                activeIceCreamShop.owner
            );
            onSuccess();
        } catch (error) {
            console.error("Error al ajustar el stock:", error);
            alert("No se pudo realizar el ajuste.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal title={`Ajustar Stock de: ${ingredient.name}`} show={!!ingredient} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="adjustment" className="form-label">Cantidad a Ajustar ({ingredient.consumptionUnit})</label>
                    <input
                        type="number"
                        id="adjustment"
                        className="form-control"
                        value={adjustment}
                        onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                        placeholder="Ej: 100 para añadir, -50 para quitar"
                        required
                    />
                    <div className="form-text">Usa un número positivo para añadir stock y uno negativo para quitar.</div>
                </div>
                <div className="mb-3">
                    <label htmlFor="reason" className="form-label">Razón del Ajuste</label>
                    <select id="reason" className="form-select" value={reason} onChange={(e) => setReason(e.target.value)}>
                        {adjustmentReasons.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting || adjustment === 0}>
                        {isSubmitting ? 'Guardando...' : 'Guardar Ajuste'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AdjustStockModal;