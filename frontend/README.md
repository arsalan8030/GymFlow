# GymFlow Frontend

React and Vite client for GymFlow.

## Setup

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_URL` in `.env` to the backend origin. The local default is `http://localhost:5000`.

## Commands

- `npm run dev` — local development server
- `npm run lint` — ESLint
- `npm run build` — production build
- `npm run preview` — preview the production build

The UI is split into `components`, `layouts`, `pages`, and `lib` modules. Authentication uses the backend's HttpOnly cookie; access tokens are not stored in browser local storage.
