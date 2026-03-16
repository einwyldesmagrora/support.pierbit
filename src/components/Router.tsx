import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Route {
  path: string;
  element: ReactNode;
  requireAuth?: boolean;
}

interface RouterProps {
  routes: Route[];
}

export function Router({ routes }: RouterProps) {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const matchRoute = () => {
    for (const route of routes) {
      if (route.path === currentPath ||
          (route.path.includes(':') && matchDynamicRoute(route.path, currentPath))) {
        if (route.requireAuth && !user) {
          return routes.find((r) => r.path === '/')?.element || null;
        }
        return route.element;
      }
    }

    return routes.find((r) => r.path === '*')?.element || <div>404 Not Found</div>;
  };

  const matchDynamicRoute = (pattern: string, path: string): boolean => {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return false;

    return patternParts.every((part, i) => {
      return part.startsWith(':') || part === pathParts[i];
    });
  };

  return <>{matchRoute()}</>;
}

export function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
