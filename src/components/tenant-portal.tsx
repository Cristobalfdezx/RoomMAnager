'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  AlertTriangle,
  Euro,
  FileText,
  Calendar,
  Phone,
  Mail,
  LogOut,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface TenantPortalProps {
  user: any;
  onLogout: () => void;
}

// Category config
const categoryConfig: Record<string, { icon: typeof AlertTriangle; color: string; label: string }> = {
  plumbing: { icon: AlertTriangle, color: 'bg-blue-500', label: 'Fontanería' },
  electrical: { icon: AlertTriangle, color: 'bg-yellow-500', label: 'Electricidad' },
  furniture: { icon: AlertTriangle, color: 'bg-orange-500', label: 'Mobiliario' },
  cleaning: { icon: AlertTriangle, color: 'bg-green-500', label: 'Limpieza' },
  other: { icon: AlertTriangle, color: 'bg-gray-500', label: 'Otros' },
};

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  open: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Abierta' },
  in_progress: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'En progreso' },
  resolved: { color: 'text-green-600', bg: 'bg-green-100', label: 'Resuelta' },
};

const paymentStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pendiente' },
  paid: { color: 'text-green-600', bg: 'bg-green-100', label: 'Pagado' },
  overdue: { color: 'text-red-600', bg: 'bg-red-100', label: 'Vencido' },
};

// Helpers
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};

export function TenantPortal({ user, onLogout }: TenantPortalProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [payments, setPayments] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New incident form
  const [newIncidentOpen, setNewIncidentOpen] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, incidentsRes, contractsRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/incidents'),
        fetch('/api/contracts')
      ]);

      const paymentsData = await paymentsRes.json();
      const incidentsData = await incidentsRes.json();
      const contractsData = await contractsRes.json();

      // Filtrar solo los datos de este inquilino
      const tenantId = user.tenant?.id;
      setPayments(paymentsData.filter((p: any) => p.tenantId === tenantId));
      setIncidents(incidentsData.filter((i: any) => i.tenantId === tenantId));
      setContract(contractsData.find((c: any) => c.tenantId === tenantId));
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  };

  const createIncident = async () => {
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newIncident,
          roomId: user.tenant?.roomId,
          tenantId: user.tenant?.id
        })
      });
      const data = await res.json();
      if (data.id) {
        toast.success('Incidencia enviada correctamente');
        setNewIncidentOpen(false);
        setNewIncident({ title: '', description: '', category: 'other', priority: 'medium' });
        fetchData();
      }
    } catch {
      toast.error('Error al crear incidencia');
    }
  };

  const tenant = user.tenant;
  const room = tenant?.room;
  const property = room?.property;

  // Stats
  const pendingPayments = payments.filter((p: any) => p.status === 'pending' || p.status === 'overdue');
  const pendingAmount = pendingPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const openIncidents = incidents.filter((i: any) => i.status !== 'resolved' && i.status !== 'closed');

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No tienes un perfil de inquilino asignado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">{property?.name} - Hab. {room?.number}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto p-4 pb-24">
        {activeTab === 'home' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Room Info */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-2">{property?.name}</h2>
                <p className="text-emerald-100 text-sm mb-4">{property?.address}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-emerald-100">Tu habitación</p>
                    <p className="text-2xl font-bold">{room?.number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-100">Alquiler mensual</p>
                    <p className="text-2xl font-bold">{formatCurrency(room?.price)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-0 shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Euro className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Por pagar</p>
                      <p className="font-bold">{formatCurrency(pendingAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Incidencias</p>
                      <p className="font-bold">{openIncidents.length} abiertas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Next Payment */}
            {pendingPayments.length > 0 && (
              <Card className="border-0 shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Próximo pago</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingPayments.slice(0, 1).map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-muted-foreground">Vence {formatDate(payment.dueDate)}</p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 border-0">Pendiente</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Incidents */}
            {incidents.length > 0 && (
              <Card className="border-0 shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tus incidencias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {incidents.slice(0, 3).map((incident: any) => (
                    <div key={incident.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{incident.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(incident.createdAt)}</p>
                      </div>
                      <Badge className={`${statusConfig[incident.status]?.bg} ${statusConfig[incident.status]?.color} border-0 text-xs`}>
                        {statusConfig[incident.status]?.label}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === 'payments' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold">Mis Pagos</h2>
            {payments.map((payment: any) => (
              <Card key={payment.id} className="border-0 shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.concept} - Vence {formatDate(payment.dueDate)}
                      </p>
                      {payment.paidDate && (
                        <p className="text-xs text-green-600 mt-1">
                          Pagado el {formatDate(payment.paidDate)}
                        </p>
                      )}
                    </div>
                    <Badge className={`${paymentStatusConfig[payment.status]?.bg} ${paymentStatusConfig[payment.status]?.color} border-0`}>
                      {paymentStatusConfig[payment.status]?.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {activeTab === 'incidents' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Incidencias</h2>
              <Dialog open={newIncidentOpen} onOpenChange={setNewIncidentOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-1" />
                    Nueva
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reportar incidencia</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        value={newIncident.title}
                        onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                        placeholder="Describe el problema"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={newIncident.description}
                        onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                        placeholder="Más detalles..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Categoría</Label>
                        <Select value={newIncident.category} onValueChange={(v) => setNewIncident({ ...newIncident, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(categoryConfig).map(([k, c]) => (
                              <SelectItem key={k} value={k}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Prioridad</Label>
                        <Select value={newIncident.priority} onValueChange={(v) => setNewIncident({ ...newIncident, priority: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baja</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={createIncident} disabled={!newIncident.title}>Enviar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {incidents.map((incident: any) => (
              <Card key={incident.id} className="border-0 shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{incident.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{formatDate(incident.createdAt)}</p>
                    </div>
                    <Badge className={`${statusConfig[incident.status]?.bg} ${statusConfig[incident.status]?.color} border-0`}>
                      {statusConfig[incident.status]?.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {incidents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tienes incidencias</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'contract' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold">Mi Contrato</h2>
            {contract ? (
              <Card className="border-0 shadow">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{contract.contractNumber}</p>
                    <Badge className="bg-green-100 text-green-700 border-0">Activo</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Inicio</p>
                      <p className="font-medium">{formatDate(contract.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fin</p>
                      <p className="font-medium">{formatDate(contract.endDate)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Progreso del contrato</p>
                    <Progress value={
                      Math.min(100, Math.max(0,
                        ((Date.now() - new Date(contract.startDate).getTime()) /
                        (new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime())) * 100
                      ))
                    } className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Alquiler mensual</p>
                      <p className="text-xl font-bold">{formatCurrency(contract.monthlyRent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fianza</p>
                      <p className="text-xl font-bold">{formatCurrency(contract.deposit)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Badge className="bg-green-100 text-green-700 border-0">✓ Fianza depositada</Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tienes contrato activo</p>
              </div>
            )}

            {/* Contact Info */}
            <Card className="border-0 shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Contacto del propietario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>+34 600 000 000</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>admin@roommanager.com</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {[
            { id: 'home', label: 'Inicio', icon: Home },
            { id: 'payments', label: 'Pagos', icon: Euro },
            { id: 'incidents', label: 'Incidencias', icon: AlertTriangle },
            { id: 'contract', label: 'Contrato', icon: FileText },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'text-emerald-600'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
