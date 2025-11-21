
// import { initializeApp } from 'firebase/app';
// import type { FirebaseApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';
// import type { Firestore } from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE ---
// PARA QUE LA APP FUNCIONE, DEBES REEMPLAZAR ESTOS VALORES CON LOS DE TU PROYECTO DE FIREBASE.
const firebaseConfig = {
  apiKey: "AIzaSyAw-FwMlHeXJc6l5K2lZg0-nPO4bKqNA1s",
  authDomain: "many-minds-habit.firebaseapp.com",
  projectId: "many-minds-habit",
  storageBucket: "many-minds-habit.firebasestorage.app",
  messagingSenderId: "852339857944",
  appId: "1:852339857944:web:37285eddad066d4879c16d"
};

// Inicialización
let app: any | undefined;
let db: any | undefined;

// NOTE: Firebase logic is disabled because the application has migrated to Neon DB (lib/neon.ts).
// The imports were causing build errors ("no exported member 'initializeApp'") likely due to a missing or mismatched firebase dependency.

/*
try {
  // Validación simple para evitar errores si no se ha configurado la API Key
  if (firebaseConfig.apiKey === "TU_API_KEY_AQUI" || !firebaseConfig.apiKey) {
    console.warn("⚠️ ATENCIÓN: Firebase no está configurado correctamente.");
  } else {
    // Inicializamos la app usando la importación nombrada estándar
    app = initializeApp(firebaseConfig);
    
    // Inicializamos Firestore
    db = getFirestore(app);
    
    console.log("🔥 Firebase conectado correctamente (v10.12.2)");
  }
} catch (error) {
  console.error("Error crítico inicializando Firebase:", error);
  console.warn("La aplicación cambiará a modo offline (LocalStorage).");
}
*/

// Exportamos db. Si falla la inicialización, será undefined y la app usará el fallback.
export { db };
