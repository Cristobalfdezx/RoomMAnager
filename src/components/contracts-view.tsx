'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  ChevronRight,
  User,
  Building2,
  Clock,
  Euro,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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

interface Contract {
  id: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  depositPaid: boolean;
  depositReturned: boolean;
  status: string;
  terms?: string;
  notes?: string;
  tenant: Tenant;
  createdAt: string;
}

// Status config
const contractStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: 'text-green-600', bg: 'bg-green-100', label: 'Activo' },
  expired: { color: 'text-red-600', bg: 'bg-red-100', label: 'Vencido' },
  terminated: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Terminado' },
  cancelled: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Cancelado' },
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

const getDaysRemaining = (endDate: string) => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const getContractProgress = (startDate: string, endDate: string) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const progress = ((now - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, progress));
};

// Contract Card Component
function ContractCard({ contract, onClick }: { contract: Contract; onClick: () => void }) {
  const statusConf = contractStatusConfig[contract.status];
  const daysRemaining = getDaysRemaining(contract.endDate);
  const progress = getContractProgress(contract.startDate, contract.endDate);
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card 
        className={`shadow border-0 hover:shadow-lg transition-all cursor-pointer overflow-hidden ${
          isExpiringSoon ? 'ring-2 ring-amber-200' : ''
        }`}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{contract.contractNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(contract.monthlyRent)}/mes
                  </p>
                </div>
                <Badge className={`${statusConf.bg} ${statusConf.color} border-0`}>
                  {statusConf.label}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">{getInitials(contract.tenant.name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm truncate">{contract.tenant.name}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {contract.tenant.room.property.name}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{formatDate(contract.startDate)}</span>
                  <span>{formatDate(contract.endDate)}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {isExpiringSoon && (
                <div className="flex items-center gap-2 mt-3 text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Vence en {daysRemaining} días
                  </span>
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Euro className="w-3 h-3" />
                  Fianza: {formatCurrency(contract.deposit)}
                </span>
                {contract.depositPaid ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Fianza cobrada
                  </span>
                ) : (
                  <span className="text-amber-600">Fianza pendiente</span>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Main Component
export function ContractsView({ tenants }: { tenants: Tenant[] }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newContractOpen, setNewContractOpen] = useState(false);
  const [contractDetailOpen, setContractDetailOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const [newContract, setNewContract] = useState({
    startDate: '',
    endDate: '',
    monthlyRent: '',
    deposit: '',
    depositPaid: false,
    tenantId: '',
    notes: ''
  });

  useEffect(() => {
    const loadContracts = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/contracts');
        const data = await res.json();
        setContracts(data);
      } catch {
        toast.error('Error al cargar contratos');
      }
      setLoading(false);
    };
    loadContracts();
  }, []);

  const refreshContracts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contracts');
      const data = await res.json();
      setContracts(data);
    } catch {
      toast.error('Error al cargar contratos');
    }
    setLoading(false);
  }, []);

  const filteredContracts = contracts.filter(contract => {
    const matchesFilter = filter === 'all' || contract.status === filter;
    const matchesSearch = contract.tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.tenant.room.property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const createContract = async () => {
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newContract,
          monthlyRent: parseFloat(newContract.monthlyRent),
          deposit: parseFloat(newContract.deposit)
        })
      });
      const data = await res.json();
      if (data.id) {
        toast.success('Contrato creado correctamente');
        setNewContractOpen(false);
        setNewContract({ startDate: '', endDate: '', monthlyRent: '', deposit: '', depositPaid: false, tenantId: '', notes: '' });
        refreshContracts();
      }
    } catch {
      toast.error('Error al crear contrato');
    }
  };

  // Stats
  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    expiring: contracts.filter(c => c.status === 'active' && getDaysRemaining(c.endDate) <= 30 && getDaysRemaining(c.endDate) > 0).length,
    totalDeposit: contracts.filter(c => c.status === 'active' && c.depositPaid).reduce((sum, c) => sum + c.deposit, 0),
    monthlyIncome: contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + c.monthlyRent, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-purple-500" />
            Contratos
          </h2>
          <p className="text-muted-foreground">Gestiona los contratos de alquiler</p>
        </div>
        <Dialog open={newContractOpen} onOpenChange={setNewContractOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Contrato</DialogTitle>
              <DialogDescription>Registra un nuevo contrato de alquiler</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Inquilino</Label>
                <Select value={newContract.tenantId} onValueChange={(v) => setNewContract({ ...newContract, tenantId: v })}>
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
                  <Label>Fecha inicio</Label>
                  <Input
                    type="date"
                    value={newContract.startDate}
                    onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha fin</Label>
                  <Input
                    type="date"
                    value={newContract.endDate}
                    onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alquiler mensual (€)</Label>
                  <Input
                    type="number"
                    value={newContract.monthlyRent}
                    onChange={(e) => setNewContract({ ...newContract, monthlyRent: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fianza (€)</Label>
                  <Input
                    type="number"
                    value={newContract.deposit}
                    onChange={(e) => setNewContract({ ...newContract, deposit: e.target.value })}
                    placeholder="1000"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="depositPaid"
                  checked={newContract.depositPaid}
                  onChange={(e) => setNewContract({ ...newContract, depositPaid: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="depositPaid">Fianza ya cobrada</Label>
              </div>
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={newContract.notes}
                  onChange={(e) => setNewContract({ ...newContract, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={createContract} disabled={!newContract.tenantId || !newContract.startDate || !newContract.endDate || !newContract.monthlyRent}>
                Crear Contrato
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
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
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
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Por vencer</p>
                <p className="text-xl font-bold">{stats.expiring}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <CardContent className="p-4">
            <p className="text-sm text-purple-100">Ingresos/mes</p>
            <p className="text-xl font-bold">{formatCurrency(stats.monthlyIncome)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Fianzas Card */}
      <Card className="border-0 shadow bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Euro className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Fianzas Depositadas</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalDeposit)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{stats.active} contratos activos</p>
              <p className="text-xs text-muted-foreground">≈ {formatCurrency(stats.totalDeposit / (stats.active || 1))} por contrato</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="shadow border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por inquilino, propiedad o número..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'active', 'expired'].map((status) => {
                const config = status === 'all' ? { label: 'Todos' } : contractStatusConfig[status];
                return (
                  <Button
                    key={status}
                    variant={filter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(status)}
                    className={filter === status ? 'bg-purple-500 hover:bg-purple-600' : ''}
                  >
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      <div className="grid gap-4">
        <AnimatePresence>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold">No hay contratos</h3>
              <p className="text-muted-foreground">No se encontraron contratos con los filtros seleccionados</p>
            </div>
          ) : (
            filteredContracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onClick={() => {
                  setSelectedContract(contract);
                  setContractDetailOpen(true);
                }}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Contract Detail Dialog */}
      <Dialog open={contractDetailOpen} onOpenChange={setContractDetailOpen}>
        <DialogContent className="max-w-md">
          {selectedContract && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold">{selectedContract.contractNumber}</p>
                    <p className="text-sm text-muted-foreground">Contrato de alquiler</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(selectedContract.tenant.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedContract.tenant.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedContract.tenant.email}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedContract.tenant.room.property.name} - Hab. {selectedContract.tenant.room.number}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Inicio</p>
                    <p className="font-medium">{formatDate(selectedContract.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fin</p>
                    <p className="font-medium">{formatDate(selectedContract.endDate)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Alquiler mensual</p>
                    <p className="font-bold text-lg">{formatCurrency(selectedContract.monthlyRent)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fianza</p>
                    <p className="font-bold text-lg">{formatCurrency(selectedContract.deposit)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge className={`${selectedContract.depositPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'} border-0`}>
                    {selectedContract.depositPaid ? '✓ Fianza cobrada' : '⏳ Fianza pendiente'}
                  </Badge>
                  <Badge className={`${contractStatusConfig[selectedContract.status].bg} ${contractStatusConfig[selectedContract.status].color} border-0`}>
                    {contractStatusConfig[selectedContract.status].label}
                  </Badge>
                </div>

                {selectedContract.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notas</p>
                    <p className="text-sm">{selectedContract.notes}</p>
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
