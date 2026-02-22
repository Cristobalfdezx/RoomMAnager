'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Building2,
  Users,
  AlertTriangle,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Droplets,
  Zap,
  Sofa,
  Sparkles,
  Wrench,
  TrendingUp,
  BedDouble,
  DoorOpen,
  Calendar,
  Phone,
  Mail,
  ChevronRight,
  Database,
  ArrowRight,
  RefreshCw,
  Send,
  Download,
  X as XIcon,
  Share2,
  Euro,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { PaymentsView } from '@/components/payments-view';
import { ContractsView } from '@/components/contracts-view';
import { LoginForm } from '@/components/login-form';
import { TenantPortal } from '@/components/tenant-portal';

// Types
interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  description?: string;
  image?: string;
  totalRooms?: number;
  occupiedRooms?: number;
  availableRooms?: number;
  maintenanceRooms?: number;
}

interface Room {
  id: string;
  number: string;
  name?: string;
  floor: number;
  price: number;
  size?: number;
  amenities?: string;
  status: string;
  image?: string;
  property: Property;
  tenants: Tenant[];
  incidents?: Incident[];
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dni?: string;
  photo?: string;
  moveIn: string;
  moveOut?: string;
  status: string;
  room: Room;
}

interface IncidentUpdate {
  id: string;
  message: string;
  status?: string;
  createdAt: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  image?: string;
  room: Room;
  tenant?: Tenant;
  updates: IncidentUpdate[];
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  overview: {
    totalProperties: number;
    totalRooms: number;
    totalTenants: number;
    totalIncidents: number;
    openIncidents: number;
    inProgressIncidents: number;
  };
  rooms: {
    occupied: number;
    available: number;
    maintenance: number;
  };
  incidentsByCategory: Array<{ category: string; count: number }>;
  incidentsByPriority: Array<{ priority: string; count: number }>;
  recentIncidents: Incident[];
}

// Navigation items
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'payments', label: 'Pagos', icon: Euro },
  { id: 'contracts', label: 'Contratos', icon: FileText },
  { id: 'incidents', label: 'Incidencias', icon: AlertTriangle },
  { id: 'properties', label: 'Propiedades', icon: Building2 },
  { id: 'tenants', label: 'Inquilinos', icon: Users },
];

// Category config
const categoryConfig: Record<string, { icon: typeof Droplets; color: string; label: string }> = {
  plumbing: { icon: Droplets, color: 'bg-blue-500', label: 'Fontanería' },
  electrical: { icon: Zap, color: 'bg-yellow-500', label: 'Electricidad' },
  furniture: { icon: Sofa, color: 'bg-orange-500', label: 'Mobiliario' },
  cleaning: { icon: Sparkles, color: 'bg-green-500', label: 'Limpieza' },
  other: { icon: Wrench, color: 'bg-gray-500', label: 'Otros' },
};

// Priority config
const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  low: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Baja' },
  medium: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Media' },
  high: { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Alta' },
  urgent: { color: 'text-red-600', bg: 'bg-red-100', label: 'Urgente' },
};

// Status config
const statusConfig: Record<string, { icon: typeof AlertCircle; color: string; bg: string; label: string }> = {
  open: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Abierta' },
  in_progress: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'En progreso' },
  resolved: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', label: 'Resuelta' },
  closed: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Cerrada' },
};

// Room status config
const roomStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  available: { color: 'text-green-600', bg: 'bg-green-100', label: 'Disponible' },
  occupied: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Ocupada' },
  maintenance: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Mantenimiento' },
};

// Helper functions
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Sidebar Component
function SidebarContent({ 
  activeView, 
  setActiveView, 
  setSidebarOpen, 
  openIncidents,
  onSeedData 
}: { 
  activeView: string; 
  setActiveView: (v: string) => void; 
  setSidebarOpen: (v: boolean) => void;
  openIncidents: number;
  onSeedData: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">RoomManager</h1>
            <p className="text-xs text-muted-foreground">Gestión de alquileres</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveView(item.id);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
              activeView === item.id
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
            {item.id === 'incidents' && openIncidents > 0 && (
              <Badge className="ml-auto bg-white/20 text-white border-0">
                {openIncidents}
              </Badge>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={onSeedData}
        >
          <Database className="w-4 h-4" />
          Cargar datos demo
        </Button>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  delay 
}: { 
  title: string; 
  value: number; 
  icon: typeof Building2; 
  gradient: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-0 shadow-lg bg-gradient-to-br text-white ${gradient}">
        <CardContent className={`p-6 bg-gradient-to-br ${gradient} rounded-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">{title}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Dashboard View Component
function DashboardView({ 
  dashboardData, 
  onIncidentClick,
  onViewAllIncidents 
}: { 
  dashboardData: DashboardData | null;
  onIncidentClick: (incident: Incident) => void;
  onViewAllIncidents: () => void;
}) {
  if (!dashboardData) return null;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Propiedades"
          value={dashboardData.overview.totalProperties}
          icon={Building2}
          gradient="from-emerald-500 to-teal-600"
          delay={0.1}
        />
        <StatsCard
          title="Habitaciones"
          value={dashboardData.overview.totalRooms}
          icon={BedDouble}
          gradient="from-blue-500 to-indigo-600"
          delay={0.2}
        />
        <StatsCard
          title="Inquilinos"
          value={dashboardData.overview.totalTenants}
          icon={Users}
          gradient="from-purple-500 to-pink-600"
          delay={0.3}
        />
        <StatsCard
          title="Incidencias"
          value={dashboardData.overview.openIncidents}
          icon={AlertTriangle}
          gradient="from-amber-500 to-orange-600"
          delay={0.4}
        />
      </div>

      {/* Room Status & Incidents */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Room Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-emerald-500" />
                Estado de Habitaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm">Ocupadas</span>
                  </div>
                  <span className="font-semibold">{dashboardData.rooms.occupied}</span>
                </div>
                <Progress value={dashboardData.rooms.occupied ? (dashboardData.rooms.occupied / dashboardData.overview.totalRooms) * 100 : 0} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm">Disponibles</span>
                  </div>
                  <span className="font-semibold">{dashboardData.rooms.available}</span>
                </div>
                <Progress value={dashboardData.rooms.available ? (dashboardData.rooms.available / dashboardData.overview.totalRooms) * 100 : 0} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm">Mantenimiento</span>
                  </div>
                  <span className="font-semibold">{dashboardData.rooms.maintenance}</span>
                </div>
                <Progress value={dashboardData.rooms.maintenance ? (dashboardData.rooms.maintenance / dashboardData.overview.totalRooms) * 100 : 0} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Incidents by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                Incidencias por Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(categoryConfig).map(([key, config]) => {
                  const count = dashboardData.incidentsByCategory.find((i) => i.category === key)?.count || 0;
                  const Icon = config.icon;
                  return (
                    <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{config.label}</p>
                        <p className="font-bold">{count}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Incidents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Incidencias Recientes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onViewAllIncidents}>
              Ver todas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {dashboardData.recentIncidents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay incidencias recientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.recentIncidents.map((incident) => {
                  const config = categoryConfig[incident.category];
                  const statusConf = statusConfig[incident.status];
                  const Icon = config.icon;
                  return (
                    <div 
                      key={incident.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => onIncidentClick(incident)}
                    >
                      <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{incident.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {incident.room.property.name} - Hab. {incident.room.number}
                        </p>
                      </div>
                      <Badge className={`${statusConf.bg} ${statusConf.color} border-0`}>
                        {statusConf.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Incident Card Component
function IncidentCard({ 
  incident, 
  index, 
  onClick 
}: { 
  incident: Incident; 
  index: number; 
  onClick: () => void;
}) {
  const config = categoryConfig[incident.category];
  const priorityConf = priorityConfig[incident.priority];
  const statusConf = statusConfig[incident.status];
  const Icon = config.icon;

  const priorityColors: Record<string, string> = {
    urgent: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#6b7280'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className="shadow-lg border-0 hover:shadow-xl transition-all cursor-pointer overflow-hidden"
        onClick={onClick}
      >
        <div className="flex">
          <div 
            className="w-1"
            style={{ backgroundColor: priorityColors[incident.priority] }}
          />
          <CardContent className="flex-1 p-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{incident.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {incident.room.property.name} - Habitación {incident.room.number}
                    </p>
                  </div>
                  <Badge className={`${statusConf.bg} ${statusConf.color} border-0 flex-shrink-0`}>
                    {statusConf.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {incident.description}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(incident.createdAt)}
                  </span>
                  <span className={`font-medium ${priorityConf.color}`}>
                    Prioridad: {priorityConf.label}
                  </span>
                  {incident.tenant && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {incident.tenant.name}
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

// Incident Detail Dialog Component
function IncidentDetailDialog({
  incident,
  open,
  onOpenChange,
  onUpdateStatus,
  onAddUpdate
}: {
  incident: Incident | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdateStatus: (id: string, status: string, message: string) => void;
  onAddUpdate: (id: string, message: string) => void;
}) {
  if (!incident) return null;

  const config = categoryConfig[incident.category];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{incident.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${statusConfig[incident.status].bg} ${statusConfig[incident.status].color} border-0`}>
                  {statusConfig[incident.status].label}
                </Badge>
                <Badge className={`${priorityConfig[incident.priority].bg} ${priorityConfig[incident.priority].color} border-0`}>
                  Prioridad: {priorityConfig[incident.priority].label}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 -mx-6">
          <div className="px-6 space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">Ubicación</p>
              <p>{incident.room.property.name} - Habitación {incident.room.number}</p>
              <p className="text-sm text-muted-foreground">{incident.room.property.address}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Descripción</p>
              <p>{incident.description}</p>
            </div>

            {incident.tenant && (
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground mb-2">Reportado por</p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(incident.tenant.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{incident.tenant.name}</p>
                    <p className="text-sm text-muted-foreground">{incident.tenant.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {incident.status === 'open' && (
                <Button size="sm" onClick={() => onUpdateStatus(incident.id, 'in_progress', 'Iniciando trabajo en la incidencia')}>
                  <Clock className="w-4 h-4 mr-2" />
                  Marcar en progreso
                </Button>
              )}
              {incident.status === 'in_progress' && (
                <Button size="sm" variant="default" className="bg-green-500 hover:bg-green-600" onClick={() => onUpdateStatus(incident.id, 'resolved', 'Incidencia resuelta')}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Marcar resuelta
                </Button>
              )}
              {incident.status === 'resolved' && (
                <Button size="sm" variant="outline" onClick={() => onUpdateStatus(incident.id, 'closed', 'Incidencia cerrada')}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Cerrar incidencia
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => onUpdateStatus(incident.id, 'open', 'Reabriendo incidencia')}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reabrir
              </Button>
            </div>

            {/* Updates Timeline */}
            {incident.updates.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Actualizaciones</p>
                <div className="space-y-3">
                  {incident.updates.map((update) => (
                    <div key={update.id} className="relative pl-6 pb-3 border-l-2 border-muted last:pb-0">
                      <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary" />
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-muted-foreground">{formatDate(update.createdAt)}</span>
                        {update.status && (
                          <Badge variant="outline" className="text-xs">
                            {statusConfig[update.status]?.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{update.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t pt-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Añadir actualización..." 
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  if (target.value.trim()) {
                    onAddUpdate(incident.id, target.value);
                    target.value = '';
                  }
                }
              }}
            />
            <Button onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              if (input.value.trim()) {
                onAddUpdate(incident.id, input.value);
                input.value = '';
              }
            }}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Incidents View Component
function IncidentsView({
  incidents,
  rooms,
  incidentFilter,
  setIncidentFilter,
  searchQuery,
  setSearchQuery,
  newIncidentOpen,
  setNewIncidentOpen,
  newIncident,
  setNewIncident,
  onCreateIncident,
  onIncidentClick
}: {
  incidents: Incident[];
  rooms: Room[];
  incidentFilter: string;
  setIncidentFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  newIncidentOpen: boolean;
  setNewIncidentOpen: (v: boolean) => void;
  newIncident: { title: string; description: string; category: string; priority: string; roomId: string; tenantId: string };
  setNewIncident: (v: { title: string; description: string; category: string; priority: string; roomId: string; tenantId: string }) => void;
  onCreateIncident: () => void;
  onIncidentClick: (incident: Incident) => void;
}) {
  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const matchesStatus = incidentFilter === 'all' || incident.status === incidentFilter;
      const matchesSearch = incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.room.property.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [incidents, incidentFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Incidencias</h2>
          <p className="text-muted-foreground">Gestiona todas las incidencias de tus propiedades</p>
        </div>
        <Dialog open={newIncidentOpen} onOpenChange={setNewIncidentOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Incidencia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Incidencia</DialogTitle>
              <DialogDescription>
                Registra una nueva incidencia en una de tus propiedades
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  placeholder="Describe brevemente el problema"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  placeholder="Detalla el problema..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={newIncident.category} onValueChange={(v) => setNewIncident({ ...newIncident, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select value={newIncident.priority} onValueChange={(v) => setNewIncident({ ...newIncident, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Habitación</Label>
                <Select value={newIncident.roomId} onValueChange={(v) => setNewIncident({ ...newIncident, roomId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una habitación" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.property.name} - Hab. {room.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={onCreateIncident} disabled={!newIncident.title || !newIncident.roomId}>
                Crear Incidencia
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="shadow border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar incidencias..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => {
                const config = status === 'all' ? { bg: 'bg-muted', color: 'text-foreground', label: 'Todas' } : statusConfig[status];
                return (
                  <Button
                    key={status}
                    variant={incidentFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setIncidentFilter(status)}
                    className={incidentFilter === status ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                  >
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <div className="grid gap-4">
        <AnimatePresence>
          {filteredIncidents.map((incident, index) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              index={index}
              onClick={() => onIncidentClick(incident)}
            />
          ))}
        </AnimatePresence>
        
        {filteredIncidents.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold">No hay incidencias</h3>
            <p className="text-muted-foreground">No se encontraron incidencias con los filtros seleccionados</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Properties View Component
function PropertiesView({ properties, rooms }: { properties: Property[]; rooms: Room[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Propiedades</h2>
        <p className="text-muted-foreground">Gestiona tus propiedades y habitaciones</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property, index) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="shadow-lg border-0 overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-emerald-400 to-teal-500 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-white/30" />
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-lg font-bold text-white drop-shadow-lg">{property.name}</h3>
                  <p className="text-sm text-white/80">{property.address}</p>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 rounded-lg bg-blue-50">
                    <p className="text-2xl font-bold text-blue-600">{property.occupiedRooms || 0}</p>
                    <p className="text-xs text-muted-foreground">Ocupadas</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-green-50">
                    <p className="text-2xl font-bold text-green-600">{property.availableRooms || 0}</p>
                    <p className="text-xs text-muted-foreground">Disponibles</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-amber-50">
                    <p className="text-2xl font-bold text-amber-600">{property.maintenanceRooms || 0}</p>
                    <p className="text-xs text-muted-foreground">Mant.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{property.city}</span>
                  <span>{property.postalCode}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Rooms Section */}
      <div>
        <h3 className="text-xl font-bold mb-4">Habitaciones</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room, index) => {
            const statusConf = roomStatusConfig[room.status];
            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="shadow border-0 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold">Hab. {room.number}</p>
                        <p className="text-xs text-muted-foreground">{room.property.name}</p>
                      </div>
                      <Badge className={`${statusConf.bg} ${statusConf.color} border-0`}>
                        {statusConf.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{room.price}€/mes</span>
                      <span className="text-muted-foreground">{room.size}m²</span>
                    </div>
                    {room.tenants.length > 0 && (
                      <div className="mt-3 pt-3 border-t flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">{getInitials(room.tenants[0].name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{room.tenants[0].name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Tenants View Component
function TenantsView({ tenants }: { tenants: Tenant[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Inquilinos</h2>
        <p className="text-muted-foreground">Todos los inquilinos de tus propiedades</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map((tenant, index) => (
          <motion.div
            key={tenant.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-14 h-14">
                    <AvatarFallback className="text-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                      {getInitials(tenant.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{tenant.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {tenant.room.property.name} - Hab. {tenant.room.number}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{tenant.email}</span>
                  </div>
                  {tenant.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{tenant.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Desde {formatDate(tenant.moveIn)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <Badge className="bg-green-100 text-green-700 border-0">Activo</Badge>
                  <span className="text-sm font-semibold">{tenant.room.price}€/mes</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Welcome Screen Component
function WelcomeScreen({ onSeedData }: { onSeedData: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="max-w-md w-full mx-4 shadow-xl border-0">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">¡Bienvenido a RoomManager!</h2>
          <p className="text-muted-foreground mb-6">
            Comienza cargando datos de demostración para explorar todas las funcionalidades de la aplicación.
          </p>
          <Button 
            onClick={onSeedData}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            size="lg"
          >
            <Database className="w-4 h-4 mr-2" />
            Cargar Datos de Demostración
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Main App Component
export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data states
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [incidentFilter, setIncidentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [newIncidentOpen, setNewIncidentOpen] = useState(false);
  const [incidentDetailOpen, setIncidentDetailOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  // Form states
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    roomId: '',
    tenantId: ''
  });

  // PWA Install state
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Detect iOS and standalone mode
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    
    setIsIOS(iOS);
    setIsStandalone(standalone);
    
    // Show install banner for iOS users who haven't installed
    if (iOS && !standalone) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowInstallBanner(true), 2000);
      }
    }
  }, []);

  // Listen for install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Install PWA
  const installPWA = useCallback(async () => {
    if (!installPrompt) return;
    
    const promptEvent = installPrompt as unknown as { prompt: () => void; userChoice: Promise<{ outcome: string }> };
    promptEvent.prompt();
    
    const result = await promptEvent.userChoice;
    if (result.outcome === 'accepted') {
      toast.success('¡App instalada correctamente!');
      setShowInstallBanner(false);
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  // Dismiss install banner
  const dismissInstallBanner = useCallback(() => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [propsRes, roomsRes, tenantsRes, incidentsRes, dashRes] = await Promise.all([
        fetch('/api/properties'),
        fetch('/api/rooms'),
        fetch('/api/tenants'),
        fetch('/api/incidents'),
        fetch('/api/dashboard')
      ]);
      
      const [props, roomsData, tenantsData, incidentsData, dash] = await Promise.all([
        propsRes.json(),
        roomsRes.json(),
        tenantsRes.json(),
        incidentsRes.json(),
        dashRes.json()
      ]);
      
      setProperties(props);
      setRooms(roomsData);
      setTenants(tenantsData);
      setIncidents(incidentsData);
      setDashboardData(dash);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Seed demo data
  const seedData = useCallback(async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Datos de demostración creados');
        fetchData();
      }
    } catch {
      toast.error('Error al crear datos de demostración');
    }
  }, [fetchData]);

  // Create incident
  const createIncident = useCallback(async () => {
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncident)
      });
      const data = await res.json();
      if (data.id) {
        toast.success('Incidencia creada correctamente');
        setNewIncidentOpen(false);
        setNewIncident({
          title: '',
          description: '',
          category: 'other',
          priority: 'medium',
          roomId: '',
          tenantId: ''
        });
        fetchData();
      }
    } catch {
      toast.error('Error al crear incidencia');
    }
  }, [newIncident, fetchData]);

  // Update incident status
  const updateIncidentStatus = useCallback(async (id: string, status: string, message: string) => {
    try {
      await fetch(`/api/incidents/${id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, status })
      });
      toast.success('Estado actualizado');
      fetchData();
      // Update selected incident if it's the one being viewed
      if (selectedIncident?.id === id) {
        setSelectedIncident(prev => prev ? { ...prev, status } : null);
      }
    } catch {
      toast.error('Error al actualizar');
    }
  }, [fetchData, selectedIncident?.id]);

  // Add update to incident
  const addIncidentUpdate = useCallback(async (incidentId: string, message: string) => {
    try {
      await fetch(`/api/incidents/${incidentId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      toast.success('Actualización añadida');
      fetchData();
    } catch {
      toast.error('Error al añadir actualización');
    }
  }, [fetchData]);

  // Handle incident click
  const handleIncidentClick = useCallback((incident: Incident) => {
    setSelectedIncident(incident);
    setIncidentDetailOpen(true);
  }, []);

  // Empty state
  if (!loading && properties.length === 0) {
    return <WelcomeScreen onSeedData={seedData} />;
  }

  // Render current view
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView 
            dashboardData={dashboardData} 
            onIncidentClick={handleIncidentClick}
            onViewAllIncidents={() => setActiveView('incidents')}
          />
        );
      case 'payments':
        return <PaymentsView tenants={tenants} />;
      case 'contracts':
        return <ContractsView tenants={tenants} />;
      case 'incidents':
        return (
          <IncidentsView
            incidents={incidents}
            rooms={rooms}
            incidentFilter={incidentFilter}
            setIncidentFilter={setIncidentFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            newIncidentOpen={newIncidentOpen}
            setNewIncidentOpen={setNewIncidentOpen}
            newIncident={newIncident}
            setNewIncident={setNewIncident}
            onCreateIncident={createIncident}
            onIncidentClick={handleIncidentClick}
          />
        );
      case 'properties':
        return <PropertiesView properties={properties} rooms={rooms} />;
      case 'tenants':
        return <TenantsView tenants={tenants} />;
      default:
        return (
          <DashboardView 
            dashboardData={dashboardData} 
            onIncidentClick={handleIncidentClick}
            onViewAllIncidents={() => setActiveView('incidents')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent 
            activeView={activeView}
            setActiveView={setActiveView}
            setSidebarOpen={setSidebarOpen}
            openIncidents={dashboardData?.overview.openIncidents || 0}
            onSeedData={seedData}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r bg-white">
        <SidebarContent 
          activeView={activeView}
          setActiveView={setActiveView}
          setSidebarOpen={setSidebarOpen}
          openIncidents={dashboardData?.overview.openIncidents || 0}
          onSeedData={seedData}
        />
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
              <h1 className="text-xl font-bold lg:hidden">RoomManager</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={fetchData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">
                  AD
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6 pb-20">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : (
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          )}
        </div>
      </main>

      {/* Incident Detail Dialog */}
      <IncidentDetailDialog
        incident={selectedIncident}
        open={incidentDetailOpen}
        onOpenChange={setIncidentDetailOpen}
        onUpdateStatus={updateIncidentStatus}
        onAddUpdate={addIncidentUpdate}
      />

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeView === item.id
                  ? 'text-emerald-600'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && !isStandalone && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 lg:bottom-4 left-4 right-4 z-50"
          >
            <Card className="shadow-2xl border-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">Instalar RoomManager</p>
                    <p className="text-sm text-white/80">
                      {isIOS 
                        ? 'Toca el botón "Compartir" y luego "Añadir a pantalla de inicio"'
                        : 'Añade la app a tu pantalla de inicio para acceso rápido'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isIOS && installPrompt && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={installPWA}
                        className="bg-white text-emerald-600 hover:bg-white/90"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Instalar
                      </Button>
                    )}
                    {isIOS && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="bg-white text-emerald-600 hover:bg-white/90"
                        onClick={() => {
                          toast.info('Toca el icono "Compartir" en Safari y selecciona "Añadir a pantalla de inicio"');
                        }}
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Cómo
                      </Button>
                    )}
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="text-white hover:bg-white/20"
                      onClick={dismissInstallBanner}
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


