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
        shopLabel: 'Mi Tienda',
        shopLabelPlural: 'Tiendas', // Default fallback
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
    const {activeShop} = useAuthStore();

    const tenant = useMemo(() => {
        if (!activeShop) {
            return defaultTenantConfig;
        }

        return {
            theme: {
                primaryColor: activeShop.theme?.primaryColor || defaultTenantConfig.theme.primaryColor,
                secondaryColor: activeShop.theme?.secondaryColor || defaultTenantConfig.theme.secondaryColor,
                logoURL: activeShop.theme?.logoURL,
            },
            terminology: {
                shopLabel: activeShop.terminology?.shopLabel || 'Heladería',
                shopLabelPlural: activeShop.terminology?.shopLabel ? activeShop.terminology.shopLabel + 's' : 'Heladerías', // Simple pluralization fallback
                productLabel: activeShop.terminology?.productLabel || 'Producto',
            },
        };
    }, [activeShop]);

    // Actualizar document.title
    useEffect(() => {
        if (activeShop?.name) {
            document.title = `${activeShop.name} - Gestión`;
        } else {
            document.title = "Mi Tienda - Gestión";
        }
    }, [activeShop]);
    
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
