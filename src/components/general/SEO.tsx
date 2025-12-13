import {Helmet} from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    keywords?: string;
    canonicalUrl?: string;
    ogImage?: string;
    noIndex?: boolean;
}

/**
 * Componente reutilizable para gestionar las etiquetas de SEO de cada página.
 * Proporciona valores por defecto y permite sobreescribirlos.
 */
export const SEO = ({title, description, keywords, canonicalUrl, ogImage, noIndex}: SEOProps) => {
    const siteName = "Molink Tecnología";
    const siteUrl = "https://molink.com.co";
    const fullTitle = `${title} | ${siteName}`;
    const defaultOgImage = `${siteUrl}/og-image.jpg`;
    const finalOgImage = ogImage || defaultOgImage;
    const finalCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;

    const baseKeywords = "desarrollo de software, desarrollo de aplicaciones, paginas web, aplicaciones moviles, automatizaciones, hosting, dominio, administracion de sitios, trabajo remoto, tecnologia, cúcuta";
    const finalKeywords = keywords ? `${baseKeywords}, ${keywords}` : baseKeywords;


    const businessSchema = {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": "Molink Tecnología",
        "description": "Expertos en desarrollo de software a medida, incluyendo aplicaciones web, móviles, automatizaciones y administración de sitios. Ofrecemos soluciones tecnológicas para potenciar tu negocio desde Cúcuta, Colombia, con modalidad de trabajo remoto.",
        "image": `${siteUrl}/logo-para-schema.png`,
        "@id": siteUrl,
        "url": siteUrl,
        "telephone": "+573155756600",
        "priceRange": "$$",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Calle 12 # 3 - 59, Trapiches",
            "addressLocality": "Villa del Rosario",
            "addressRegion": "Norte de Santander",
            "postalCode": "541030",
            "addressCountry": "CO"
        },
        "areaServed": [
            {
                "@type": "Continent",
                "name": "South America"
            },
            {
                "@type": "Continent",
                "name": "North America"
            },
            {
                "@type": "Continent",
                "name": "Europe"
            }
        ],
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 7.8650731,
            "longitude": -72.4774450
        },
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday"
                ],
                "opens": "08:00",
                "closes": "21:00"
            },
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Saturday",
                "opens": "09:00",
                "closes": "18:00"
            }
        ],
        "sameAs": [
            "https://web.facebook.com/Molink",
            "https://www.instagram.com/molink_tecnologia",
            "https://www.tiktok.com/@molink_tecnologia",
            "https://www.youtube.com/@molink_tecnologia",
            "https://maps.app.goo.gl/CjUAgiT8jMeZfjjW8"
        ],
        "serviceType": ["Desarrollo de Aplicaciones Web", "Desarrollo de Aplicaciones Móviles", "Automatización de Procesos", "Alojamiento Web (Hosting)", "Registro de Dominios", "Administración de Sitios Web", "Desarrollo de Software a Medida"]
    };

    return (
        <Helmet>
            {noIndex && <meta name="robots" content="noindex, nofollow"/>}
            <title>{fullTitle}</title>
            <meta name="description" content={description}/>
            <meta name="keywords" content={finalKeywords} />
            <link rel="canonical" href={finalCanonicalUrl}/>

            {/* Open Graph */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={fullTitle}/>
            <meta property="og:description" content={description}/>
            <meta property="og:image" content={finalOgImage}/>
            <meta property="og:url" content={finalCanonicalUrl}/>
            <meta property="og:site_name" content={siteName}/>

            {/* Twitter Cards */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle}/>
            <meta name="twitter:description" content={description}/>
            <meta name="twitter:image" content={finalOgImage}/>

            {/* Schema.org JSON-LD */}
            <script type="application/ld+json">
                {JSON.stringify(businessSchema)}
            </script>
        </Helmet>
    );
};