import {FC} from "react";
import {Promotion} from "../../types";

interface PromotionGridProps {
    promotions: Promotion[];
    onSelect: (promotion: Promotion) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(value);

const PromotionGrid: FC<PromotionGridProps> = ({promotions, onSelect}) => {
    if (promotions.length === 0) {
        return <div className="text-center text-muted p-5">No hay promociones activas para hoy.</div>;
    }

    return (
        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
            {promotions.map(promo => (
                <div key={promo.id} className="col">
                    <div className="card h-100 shadow-sm product-card" onClick={() => onSelect(promo)}>
                        <div className="card-body d-flex flex-column justify-content-center text-center">
                            <h6 className="card-title mb-1">{promo.name}</h6>
                            <p className="card-text fw-bold text-primary">{formatCurrency(promo.price)}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PromotionGrid;