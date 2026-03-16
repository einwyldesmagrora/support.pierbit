import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Clock, Search } from 'lucide-react';
import { TicketStatus, TicketPriority } from '../types/database';

interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  category: {
    name: string;
    color: string;
  };
}

export function TicketsList() {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadTickets();
  }, [profile]);

  const loadTickets = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        title,
        status,
        priority,
        created_at,
        category:ticket_categories(name, color)
      `)
      .eq('created_by', profile.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTickets(data as any);
    }

    setLoading(false);
  };

  const getStatusBadge = (status: TicketStatus) => {
    const variants = {
      open: 'warning',
      in_progress: 'info',
      closed: 'success',
    } as const;
    return variants[status] || 'default';
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    const variants = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      urgent: 'danger',
    } as const;
    return variants[priority] || 'default';
  };

  const getStatusLabel = (status: TicketStatus) => {
    const labels = {
      open: 'Offen',
      in_progress: 'In Bearbeitung',
      closed: 'Geschlossen',
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: TicketPriority) => {
    const labels = {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
      urgent: 'Dringend',
    };
    return labels[priority] || priority;
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Meine Tickets
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Verwalten Sie Ihre Support-Anfragen
            </p>
          </div>
          <Button onClick={() => (window.location.href = '/tickets/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Ticket
          </Button>
        </div>

        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tickets durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Alle Status</option>
                <option value="open">Offen</option>
                <option value="in_progress">In Bearbeitung</option>
                <option value="closed">Geschlossen</option>
              </select>
            </div>
          </CardBody>
        </Card>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardBody>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Keine Tickets gefunden
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Versuchen Sie, Ihre Suchfilter anzupassen.'
                    : 'Erstellen Sie Ihr erstes Ticket, um loszulegen.'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={() => (window.location.href = '/tickets/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Neues Ticket erstellen
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 border-2 border-transparent transition-colors"
                onClick={() => (window.location.href = `/tickets/${ticket.id}`)}
              >
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                          {ticket.ticket_number}
                        </span>
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: ticket.category.color }}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {ticket.category.name}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {ticket.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Erstellt am {new Date(ticket.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={getStatusBadge(ticket.status)}>
                        {getStatusLabel(ticket.status)}
                      </Badge>
                      <Badge variant={getPriorityBadge(ticket.priority)}>
                        {getPriorityLabel(ticket.priority)}
                      </Badge>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
