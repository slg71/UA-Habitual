# Frontend UA-Habitual

Cliente web en React + Vite.

## Scripts

- `npm run dev` inicia Vite en desarrollo.
- `npm run build` genera build de producción.
- `npm run preview` sirve la build localmente.

## Estructura

```
src/
├─ app/            # Composición principal de pantallas (App)
├─ pages/          # Pantallas de la app (Welcome, Login, Register, Inicio)
├─ components/     # Componentes reutilizables (ej. collage)
├─ styles/         # Estilos globales y compartidos
├─ assets/         # Imágenes y recursos estáticos
└─ main.jsx        # Punto de entrada
```

## Convención de organización

- Pantallas completas en `src/pages`.
- UI reutilizable en `src/components`.
- Estilos compartidos en `src/styles/habitual.css`.
- Reset/base global en `src/styles/index.css`.
