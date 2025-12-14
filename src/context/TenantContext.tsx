import {createContext, FC, PropsWithChildren, useContext, useEffect, useMemo} from 'react';
import {useAuthStore} from '../store/authStore';

interface TenantTheme {
    primaryColor: string;
    secondaryColor: string;
    logoURL?: string;
}

interface TenantTerminology {
    shopLabel: string;
    shopLabelPlural: string;
    productLabel: string;
}

interface TenantConfig {
    theme: TenantTheme;
    terminology: TenantTerminology;
}

const defaultTenantConfig: TenantConfig = {
    theme: {
        primaryColor: '#0d6efd', // Bootstrap primary default
        secondaryColor: '#6c757d',
    },
    terminology: {
        shopLabel: 'Congelados',
        shopLabelPlural: 'Congelados', // Default fallback
        productLabel: 'Producto',
    },
};

interface TenantContextType {
    tenant: TenantConfig;
}

const TenantContext = createContext<TenantContextType>({
    tenant: defaultTenantConfig,
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider: FC<PropsWithChildren> = ({children}) => {
    const {activeIceCreamShop} = useAuthStore();

    const tenant = useMemo(() => {
        if (!activeIceCreamShop) {
            return defaultTenantConfig;
        }

        return {
            theme: {
                primaryColor: activeIceCreamShop.theme?.primaryColor || defaultTenantConfig.theme.primaryColor,
                secondaryColor: activeIceCreamShop.theme?.secondaryColor || defaultTenantConfig.theme.secondaryColor,
                logoURL: activeIceCreamShop.theme?.logoURL,
            },
            terminology: {
                shopLabel: activeIceCreamShop.terminology?.shopLabel || 'Heladería',
                shopLabelPlural: activeIceCreamShop.terminology?.shopLabel ? activeIceCreamShop.terminology.shopLabel + 's' : 'Heladerías', // Simple pluralization fallback
                productLabel: activeIceCreamShop.terminology?.productLabel || 'Producto',
            },
        };
    }, [activeIceCreamShop]);

    // Actualizar document.title
    useEffect(() => {
        if (activeIceCreamShop?.name) {
            document.title = `${activeIceCreamShop.name} - Gestión`;
        } else {
            document.title = "Congelados - Gestión de Heladerías";
        }
    }, [activeIceCreamShop]);
    
    // Aquí podríamos inyectar variables de CSS si quisiéramos cambiar el color globalmente
    useEffect(() => {
        document.documentElement.style.setProperty('--bs-primary', tenant.theme.primaryColor);
        // Nota: Bootstrap usa SASS compilado, así que cambiar --bs-primary solo afecta a componentes que usen CSS vars nativas
        // o componentes custom que usen esta variable. Para un soporte completo se requiere más trabajo CSS.
    }, [tenant.theme.primaryColor]);

    return (
        <TenantContext.Provider value={{tenant}}>
            {children}
        </TenantContext.Provider>
    );
};
