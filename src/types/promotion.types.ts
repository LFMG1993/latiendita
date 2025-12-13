import { Timestamp } from "firebase/firestore";

export interface PromotionItem {
    productId: string;
    productName: string; // Denormalizado para fácil visualización
    quantity: number;
}

export interface Promotion {
    id: string;
    name: string;
    description?: string;
    type: 'bundle'; // Tipo de promoción, por ahora solo 'bundle' (combo)
    price: number; // Precio final de la promoción
    items: PromotionItem[]; // Productos incluidos en la promoción
    activeDays: number[]; // Días de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
    isEnabled: boolean; // Para activar o desactivar la promoción
    cost?: number; // Costo total calculado de los productos (denormalizado)
    profit?: number; // Ganancia calculada (denormalizado)
    createdAt: Timestamp;
}

export type NewPromotionData = Omit<Promotion, 'id' | 'createdAt'>;
export type UpdatePromotionData = Partial<NewPromotionData>;