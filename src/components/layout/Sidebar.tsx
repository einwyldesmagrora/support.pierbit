import { Home, Ticket, Users, Settings, FileText, Handshake, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  minRole?: 'user' | 'supporter' | 'projektinhaber' | 'admin';
  badge?: string;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { hasRole, profile } = useAuth();

  const navItems: NavItem[] = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Ticket, label: 'Meine Tickets', path: '/tickets' },
    { icon: FileText, label: 'Support', path: '/support', minRole: 'supporter' },
    { icon: Users, label: 'Team', path: '/team', minRole: 'supporter' },
    { icon: Handshake, label: 'Partnerschaften', path: '/partnerships', minRole: 'admin' },
    { icon: Settings, label: 'Admin', path: '/admin', minRole: 'admin' },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.minRole || hasRole(item.minRole)
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'projektinhaber':
        return 'info';
      case 'supporter':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <img src="/icon.png" alt="Pierbit Icon" className="h-8 w-8" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Pierbit
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {profile && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {profile.full_name}
                  </p>
                  <Badge variant={getRoleBadgeVariant(profile.role)} className="mt-1">
                    {profile.role}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {filteredNavItems.map((item) => (
                <li key={item.path}>
                  <a
                    href={item.path}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge variant="info">{item.badge}</Badge>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Pierbit Hosting © 2024
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
