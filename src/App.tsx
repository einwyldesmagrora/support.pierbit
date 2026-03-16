import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Router } from './components/Router';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { TicketsList } from './pages/TicketsList';
import { NewTicket } from './pages/NewTicket';

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    const path = window.location.pathname;
    if (path === '/register') {
      return <Register />;
    }
    return <Login />;
  }

  const routes = [
    { path: '/', element: <Dashboard />, requireAuth: true },
    { path: '/tickets', element: <TicketsList />, requireAuth: true },
    { path: '/tickets/new', element: <NewTicket />, requireAuth: true },
  ];

  return <Router routes={routes} />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
