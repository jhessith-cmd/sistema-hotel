import {
  Outlet,
  Link,
  createRootRoute,
  createRoute,
  createRouter,
  useRouter,
} from '@tanstack/react-router';
import { useEffect } from 'react';
import App from './App.jsx';

function RootLayout() {
  useEffect(() => {
    document.documentElement.lang = 'es';
    document.title = 'HotelControl — Gestión de hospedajes';
  }, []);
  return <Outlet />;
}

function NotFoundComponent() {
  return (
    <div className="route-state-shell">
      <div className="route-state-card">
        <div className="route-code">404</div>
        <h1>Página no encontrada</h1>
        <p>La sección solicitada no existe o fue movida.</p>
        <Link to="/" className="primary route-button">Volver al inicio</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }) {
  const router = useRouter();
  useEffect(() => {
    console.error('Error global de HotelControl:', error);
  }, [error]);
  return (
    <div className="route-state-shell">
      <div className="route-state-card">
        <h1>No se pudo cargar esta página</h1>
        <p>{error?.message || 'Ocurrió un error inesperado.'}</p>
        <div className="route-actions">
          <button className="primary" onClick={() => { router.invalidate(); reset(); }}>
            Intentar nuevamente
          </button>
          <a href="/" className="secondary route-button">Volver al inicio</a>
        </div>
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: App,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});
