# UA-Habitual

Proyecto full stack con frontend en React (Vite) y backend en Node.js + Express.

## Estructura

```
UA-Habitual/
├─ backend/        # API Express (auth, perfil, conexión MySQL)
├─ frontend/       # Cliente React con Vite
├─ .env            # Variables de entorno del backend
└─ package.json    # Scripts unificados del proyecto
```

## Requisitos

- Node.js 18+
- npm 9+
- Base de datos MySQL accesible

## Instalación

Desde la raíz del proyecto:

```bash
npm run install:all
```

## Variables de entorno (backend)

Configura en `.env` las variables necesarias, por ejemplo:

- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME` (o `DB_USER`)
- `DB_PASSWORD` (o `DB_PASS`)
- `DB_DATABASE` (o `DB_NAME`)
- `JWT_SECRET`
- `DB_SSL_CA_PATH` (opcional)

## Scripts principales

En la raíz del repo:

- `npm run dev` → inicia backend + frontend en paralelo
- `npm run dev:backend` → inicia solo API en `http://localhost:3000`
- `npm run dev:frontend` → inicia solo frontend (Vite)
- `npm run start` → alias de backend para entorno simple

## Estado de la estructura

La separación actual `frontend/` y `backend/` es correcta para este tamaño de proyecto. No es necesario mover carpetas para poder trabajar bien.