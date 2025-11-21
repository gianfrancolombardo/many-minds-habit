# Esquema de Base de Datos Relacional (Neon / PostgreSQL)

Para aprovechar al máximo la base de datos SQL, hemos normalizado la estructura de datos. Ejecuta el siguiente script en el **SQL Editor** de Neon para crear las tablas necesarias.

## Script de Creación (DDL)

Puedes copiar y pegar esto directamente en la consola SQL de Neon:

```sql
-- 1. Tabla de Perfiles
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    theme_color TEXT NOT NULL DEFAULT 'teal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Hábitos
-- Incluye una columna 'position' para mantener el orden del drag & drop
CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    icon TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Registros (Logs de completado)
-- Almacena cada vez que un hábito se completa en una fecha específica
CREATE TABLE IF NOT EXISTS habit_completions (
    habit_id TEXT REFERENCES habits(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (habit_id, completed_date)
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_habits_profile ON habits(profile_id);
CREATE INDEX IF NOT EXISTS idx_completions_habit ON habit_completions(habit_id);
```

## Estructura de Datos

### `profiles`
Representa los contextos del usuario (ej. Personal, Trabajo).
*   `id`: Identificador único (generado por el frontend o UUID).
*   `theme_color`: Mapea a los colores de Tailwind definidos en la app.

### `habits`
Los hábitos individuales asociados a un perfil.
*   `profile_id`: Clave foránea. Si borras un perfil, se borran sus hábitos (`ON DELETE CASCADE`).
*   `position`: Entero usado para ordenar la lista visualmente.

### `habit_completions`
Tabla pivote que registra la actividad.
*   Si existe una fila para `(habit_id, '2023-10-27')`, el hábito está marcado como hecho ese día.
*   Para desmarcar un hábito, simplemente se elimina la fila (DELETE).
*   El cálculo de "Rachas" (Streaks) se realiza en la aplicación basándose en estas fechas, asegurando que la base de datos sea la única fuente de la verdad.
