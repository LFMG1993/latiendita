import {initializeApp} from "firebase/app";
import {getAuth, setPersistence, browserSessionPersistence} from "firebase/auth";
import {initializeAppCheck, ReCaptchaV3Provider} from "firebase/app-check";
import {initializeFirestore, persistentLocalCache} from "firebase/firestore";
import {getFunctions} from "firebase/functions";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
    localCache: persistentLocalCache(/*{ tabManager: persistentTabManager() }*/)
});
const functions = getFunctions(app, "us-central1");

// Usamos una función autoejecutable para la lógica de inicialización que no devuelve un valor.
(() => {
    if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
        initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
            isTokenAutoRefreshEnabled: true
        });
        if (import.meta.env.DEV) {
            console.log("Firebase App Check inicializado en modo de desarrollo.");
        }
    }
    // Establecemos la persistencia de forma asíncrona y segura.
    setPersistence(auth, browserSessionPersistence)
        .catch((error) => {
            console.error("Error al establecer la persistencia de la sesión de Auth:", error);
        });
})();
export {app, auth, db, functions};

