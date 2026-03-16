import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Ticket, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';

interface TicketStats {
  open: number;
  in_progress: number;
  closed: number;
  total: number;
}

export function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<TicketStats>({
    open: 0,
    in_progress: 0,
    closed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [profile]);

  const loadStats = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('tickets')
      .select('status')
      .eq('created_by', profile.id);

    if (!error && data) {
      const open = data.filter((t) => t.status === 'open').length;
      const in_progress = data.filter((t) => t.status === 'in_progress').length;
      const closed = data.filter((t) => t.status === 'closed').length;

      setStats({
        open,
        in_progress,
        closed,
        total: data.length,
      });
    }

    setLoading(false);
  };

  const statCards = [
    {
      title: 'Offene Tickets',
      value: stats.open,
      icon: AlertCircle,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      title: 'In Bearbeitung',
      value: stats.in_progress,
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Geschlossen',
      value: stats.closed,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Gesamt',
      value: stats.total,
      icon: Ticket,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100 dark:bg-indigo-900/20',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Willkommen zurück, {profile?.full_name}!
            </p>
          </div>
          <Button onClick={() => (window.location.href = '/tickets/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Ticket
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardBody>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Schnellaktionen
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => (window.location.href = '/tickets/new')}
                className="flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Neues Ticket erstellen
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Support-Anfrage stellen
                  </p>
                </div>
              </button>

              <button
                onClick={() => (window.location.href = '/tickets')}
                className="flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Meine Tickets anzeigen
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Alle Ihre Tickets verwalten
                  </p>
                </div>
              </button>
            </div>
          </CardBody>
        </Card>

        {profile && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Ihr Account
              </h2>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-2xl text-white font-bold">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {profile.full_name}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
                  <Badge variant="info" className="mt-2">
                    {profile.role}
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </Layout>
  );
}
