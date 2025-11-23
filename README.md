# Many Minds Habits

Un rastreador de hábitos minimalista y enfocado, inspirado en los principios del libro "Hábitos Atómicos". Esta aplicación está diseñada para ayudarte a construir consistencia a través de una interfaz limpia, perfiles personalizables y pequeñas celebraciones diarias.

## Características Principales

*   **Multi-perfil:** Crea espacios separados para diferentes contextos (ej. Personal, Trabajo, Salud) con sus propios temas de color.
*   **Gestión de Hábitos:** Añade, edita, elimina y reordena tus hábitos fácilmente. Incluye soporte para iconos (emojis).
*   **Seguimiento de Rachas:** Visualiza tu consistencia con contadores de días consecutivos (streaks).
*   **Progreso Diario:** Barra de progreso visual y frases motivacionales que cambian según tu avance.
*   **Celebración:** Efecto de confeti automático al completar todos los hábitos del día.
*   **Persistencia Híbrida:** Sincronización en la nube mediante **Neon (PostgreSQL)** con respaldo en LocalStorage para funcionamiento offline y carga rápida.
*   **Animaciones Fluidas:** Experiencia de usuario pulida con transiciones suaves y listas arrastrables (drag & drop).

## Tecnologías Utilizadas

*   **Core:** React 19, TypeScript
*   **Base de Datos:** Neon (Serverless PostgreSQL)
*   **Estilos:** Tailwind CSS
*   **Animaciones:** Framer Motion
*   **Iconos:** Lucide React

## Instalación y Configuración

1.  **Clonar y Dependencias:**
    ```bash
    git clone <repo>
    npm install
    ```

2.  **Configurar Base de Datos (Neon):**
    *   Crea un proyecto en [Neon.tech](https://neon.tech).
    *   Copia tu "Connection String" del dashboard.
    *   Pégalo en el archivo `lib/neon.ts` en la variable `DATABASE_URL`.
    *   Crea la tabla necesaria siguiendo las instrucciones en **`SCHEMA.md`**.

3.  **Ejecutar:**
    ```bash
    npm run dev
    ```
