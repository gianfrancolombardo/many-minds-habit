
import { Pool } from '@neondatabase/serverless';

// --- CONFIGURACIÓN DE NEON ---
// ⚠️ IMPORTANTE: Reemplaza este string con tu "Connection String" del dashboard de Neon.
// Debe verse como: postgres://usuario:password@ep-host.aws.neon.tech/neondb?sslmode=require
const DATABASE_URL = "postgresql://neondb_owner:npg_cgI9OvbQjt8F@ep-odd-sea-a4npadsm-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Verificación básica
if (DATABASE_URL.includes("tu_usuario")) {
  console.error("❌ ERROR: No has configurado la DATABASE_URL en lib/neon.ts");
}

// Inicializamos el Pool de conexiones. 
// El driver 'serverless' maneja la conexión vía WebSockets/HTTP automáticamente.
export const pool = new Pool({ connectionString: DATABASE_URL });

export const checkConnection = async () => {
  try {
    const client = await pool.connect();
    const { rows } = await client.query('SELECT NOW()');
    client.release();
    console.log("✅ Neon DB conectado:", rows[0].now);
    return true;
  } catch (err) {
    console.error("❌ Error conectando a Neon:", err);
    return false;
  }
};
