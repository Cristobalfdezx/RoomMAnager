'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Euro,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Plus,
  Search,
  ChevronRight,
  User,
  Building2,
  Filter,
  MoreVertical,
  Send,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Types
interface Room {
  id: string;
  number: string;
  name?: string;
  price: number;
  property: { name: string; address: string };
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  room: Room;
}

interface Payment {
  id: string;
  amount: number;
  concept: string;
  status: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  tenant: Tenant;
  createdAt: string;
}

// Status config
const paymentStatusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pendiente' },
  paid: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', label: 'Pagado' },
  overdue: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Vencido' },
  cancelled: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Cancelado' },
};

// Concept config
const conceptConfig: Record<string, { icon: typeof DollarSign; color: string; label: string }> = {
  alquiler: { icon: Building2, color: 'bg-blue-500', label: 'Alquiler' },
  fianza: { icon: FileText, color: 'bg-purple-500', label: 'Fianza' },
  luz: { icon: DollarSign, color: 'bg-yellow-500', label: 'Electricidad' },
  agua: { icon: DollarSign, color: 'bg-cyan-500', label: 'Agua' },
  gas: { icon: DollarSign, color: 'bg-orange-500', label: 'Gas' },
  otros: { icon: DollarSign, color: 'bg-gray-500', label: 'Otros' },
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

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Payment Card Component
function PaymentCard({ payment, onClick }: { payment: Payment; onClick: () => void }) {
  const statusConf = paymentStatusConfig[payment.status];
  const conceptConf = conceptConfig[payment.concept] || conceptConfig.otros;
  const StatusIcon = statusConf.icon;
  const ConceptIcon = conceptConf.icon;

  const isOverdue = payment.status === 'pending' && new Date(payment.dueDate) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card 
        className={`shadow border-0 hover:shadow-lg transition-all cursor-pointer overflow-hidden ${
          isOverdue ? 'ring-2 ring-red-200' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex">
          <div 
            className="w-1"
            style={{ backgroundColor: isOverdue ? '#ef4444' : payment.status === 'paid' ? '#22c55e' : '#f59e0b' }}
          />
          <CardContent className="flex-1 p-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${conceptConf.color} flex items-center justify-center flex-shrink-0`}>
                <ConceptIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-lg">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-muted-foreground">{conceptConf.label}</p>
                  </div>
                  <Badge className={`${statusConf.bg} ${statusConf.color} border-0 flex items-center gap-1`}>
                    <StatusIcon className="w-3 h-3" />
                    {isOverdue ? 'Vencido' : statusConf.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">{getInitials(payment.tenant.name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate">{payment.tenant.name}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    Hab. {payment.tenant.room.number}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Vence: {formatDate(payment.dueDate)}
                  </span>
                  {payment.paidDate && (
                    <span className="text-green-600">
                      Pagado: {formatDate(payment.paidDate)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}

// Main Component
export function PaymentsView({ tenants }: { tenants: Tenant[] }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newPaymentOpen, setNewPaymentOpen] = useState(false);
  const [paymentDetailOpen, setPaymentDetailOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const [newPayment, setNewPayment] = useState({
    amount: '',
    concept: 'alquiler',
    dueDate: '',
    tenantId: '',
    notes: ''
  });

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/payments');
        const data = await res.json();
        setPayments(data);
      } catch {
        toast.error('Error al cargar pagos');
      }
      setLoading(false);
    };
    loadPayments();
  }, []);

  const refreshPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      setPayments(data);
    } catch {
      toast.error('Error al cargar pagos');
    }
    setLoading(false);
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesFilter = filter === 'all' || 
      (filter === 'overdue' && (payment.status === 'overdue' || (payment.status === 'pending' && new Date(payment.dueDate) < new Date()))) ||
      payment.status === filter;
    const matchesSearch = payment.tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.tenant.room.property.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const createPayment = async () => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPayment,
          amount: parseFloat(newPayment.amount)
        })
      });
      const data = await res.json();
      if (data.id) {
        toast.success('Pago creado correctamente');
        setNewPaymentOpen(false);
        setNewPayment({ amount: '', concept: 'alquiler', dueDate: '', tenantId: '', notes: '' });
        refreshPayments();
      }
    } catch {
      toast.error('Error al crear pago');
    }
  };

  const updatePaymentStatus = async (id: string, status: string) => {
    try {
      const paidDate = status === 'paid' ? new Date().toISOString() : null;
      await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paidDate })
      });
      toast.success('Estado actualizado');
      fetchPayments();
    } catch {
      toast.error('Error al actualizar');
    }
  };

  // Stats
  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending' || (p.status === 'pending' && new Date(p.dueDate) < new Date())).length,
    paid: payments.filter(p => p.status === 'paid').length,
    overdue: payments.filter(p => p.status === 'overdue' || (p.status === 'pending' && new Date(p.dueDate) < new Date())).length,
    pendingAmount: payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
    paidAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Euro className="w-7 h-7 text-emerald-500" />
            Control de Pagos
          </h2>
          <p className="text-muted-foreground">Gestiona los cobros de tus inquilinos</p>
        </div>
        <Dialog open={newPaymentOpen} onOpenChange={setNewPaymentOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Pago
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Pago</DialogTitle>
              <DialogDescription>Añade un pago pendiente para un inquilino</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Inquilino</Label>
                <Select value={newPayment.tenantId} onValueChange={(v) => setNewPayment({ ...newPayment, tenantId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un inquilino" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name} - {tenant.room.property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad (€)</Label>
                  <Input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    placeholder="450"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Concepto</Label>
                  <Select value={newPayment.concept} onValueChange={(v) => setNewPayment({ ...newPayment, concept: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(conceptConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fecha de vencimiento</Label>
                <Input
                  type="date"
                  value={newPayment.dueDate}
                  onChange={(e) => setNewPayment({ ...newPayment, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={createPayment} disabled={!newPayment.amount || !newPayment.tenantId || !newPayment.dueDate}>
                Crear Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagados</p>
                <p className="text-xl font-bold">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-100">Por cobrar</p>
            <p className="text-xl font-bold">{formatCurrency(stats.pendingAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por inquilino o propiedad..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'paid', 'overdue'].map((status) => {
                const config = status === 'all' ? { bg: 'bg-muted', label: 'Todos' } : paymentStatusConfig[status];
                return (
                  <Button
                    key={status}
                    variant={filter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(status)}
                    className={filter === status ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                  >
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <div className="grid gap-4">
        <AnimatePresence>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <Euro className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold">No hay pagos</h3>
              <p className="text-muted-foreground">No se encontraron pagos con los filtros seleccionados</p>
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                onClick={() => {
                  setSelectedPayment(payment);
                  setPaymentDetailOpen(true);
                }}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Payment Detail Dialog */}
      <Dialog open={paymentDetailOpen} onOpenChange={setPaymentDetailOpen}>
        <DialogContent className="max-w-md">
          {selectedPayment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${conceptConfig[selectedPayment.concept]?.color || 'bg-gray-500'} flex items-center justify-center`}>
                    <Euro className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(selectedPayment.amount)}</p>
                    <p className="text-sm text-muted-foreground">{conceptConfig[selectedPayment.concept]?.label}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(selectedPayment.tenant.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedPayment.tenant.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedPayment.tenant.email}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedPayment.tenant.room.property.name} - Hab. {selectedPayment.tenant.room.number}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Badge className={`${paymentStatusConfig[selectedPayment.status].bg} ${paymentStatusConfig[selectedPayment.status].color} border-0 mt-1`}>
                      {paymentStatusConfig[selectedPayment.status].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vencimiento</p>
                    <p className="font-medium">{formatDate(selectedPayment.dueDate)}</p>
                  </div>
                </div>

                {selectedPayment.paidDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de pago</p>
                    <p className="font-medium text-green-600">{formatDate(selectedPayment.paidDate)}</p>
                  </div>
                )}

                {selectedPayment.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notas</p>
                    <p className="text-sm">{selectedPayment.notes}</p>
                  </div>
                )}

                {/* Actions */}
                {selectedPayment.status !== 'paid' && (
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      onClick={() => {
                        updatePaymentStatus(selectedPayment.id, 'paid');
                        setPaymentDetailOpen(false);
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Marcar como pagado
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
