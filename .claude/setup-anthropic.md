# Conseguir la API key de Anthropic (paso a paso)

1. Entra en **https://console.anthropic.com** y crea cuenta (o inicia sesión con
   Google). Es la consola de desarrolladores, distinta de claude.ai.
2. Si te pide crear una organización, pon el nombre que quieras (p. ej.
   "Miguel"). Deja el *workspace* por defecto ("Default").
3. **Cargar saldo**: menú de la izquierda → **Billing** (o Settings → Billing)
   → **Buy credits**. Es prepago: 5 USD bastan para empezar; una sesión de
   dos horas con Opus 5 ronda 2-4 USD, con Fable 5.1 el doble. Activa
   *auto-reload* solo si quieres; no es necesario.
4. **Crear la clave**: menú izquierdo → **API Keys** → **Create Key**.
   - Nombre: `role-master`.
   - Workspace: `Default`.
   - Pulsa **Create** y **copia la clave ahora**: empieza por `sk-ant-api03-…`
     y no se vuelve a mostrar.
5. Pégamela aquí o guárdala tú en `.env` en la raíz del proyecto:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
   `.env` está en `.gitignore`; nunca se sube al repo.
6. Cuando crees el proyecto en Vercel: **Settings → Environment Variables** →
   añade `ANTHROPIC_API_KEY` marcando solo el entorno **Preview**. Haré lo
   mismo con `APP_PASSWORD` y `APP_SECRET` cuando existan.
7. Opcional pero recomendable: **Settings → Limits** → pon un límite de gasto
   mensual (p. ej. 30 USD) para dormir tranquilo.

Nota: Fable 5.1 exige la retención de datos estándar de 30 días (es la
configuración por defecto de cualquier cuenta nueva; no hay que tocar nada).
