import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus, Edit, Stethoscope, ClipboardList, Phone, Mail, Calendar as CalendarIcon,
    MapPin, IdCard, Search, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { usePatient } from '@/hooks/usePatients';
import { useClinicalHistory, useTreatments } from '@/hooks/useClinicalHistory';
import { TreatmentForm } from '@/components/clinical/TreatmentForm';
import { ClinicalInfoForm } from '@/components/clinical/ClinicalInfoForm';
import { TreatmentTable } from '@/components/clinical/TreatmentTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Opciones para filtros
const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'PLANNED', label: 'Planificado' },
    { value: 'IN_PROGRESS', label: 'En Progreso' },
    { value: 'ON_HOLD', label: 'En Espera' },
    { value: 'COMPLETED', label: 'Completado' },
    { value: 'CANCELLED', label: 'Cancelado' },
];

const typeOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'DIAGNOSIS', label: 'Diagnóstico' },
    { value: 'PREVENTIVE', label: 'Preventivo' },
    { value: 'RESTORATIVE', label: 'Restaurador' },
    { value: 'ENDODONTIC', label: 'Endodoncia' },
    { value: 'PERIODONTAL', label: 'Periodoncia' },
    { value: 'ORTHODONTIC', label: 'Ortodoncia' },
    { value: 'SURGICAL', label: 'Quirúrgico' },
    { value: 'PROSTHETIC', label: 'Prótesis' },
    { value: 'AESTHETIC', label: 'Estética' },
    { value: 'MAINTENANCE', label: 'Mantenimiento' },
];

export function ClinicalHistoryPage() {
    const { id } = useParams<{ id: string }>();
    const patientId = parseInt(id!);
    const navigate = useNavigate();

    // Estados
    const [showTreatmentForm, setShowTreatmentForm] = useState(false);
    const [showClinicalInfoForm, setShowClinicalInfoForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Obtener datos
    const { data: patient, isLoading: patientLoading } = usePatient(patientId);
    const { data: clinicalHistory, isLoading: historyLoading, refetch: refetchHistory } = useClinicalHistory(patientId);
    const { data: treatments, isLoading: treatmentsLoading, refetch: refetchTreatments } = useTreatments(patientId);

    // Filtrar tratamientos
    const filteredTreatments = (treatments || []).filter((treatment) => {
        // Búsqueda por nombre
        const matchesSearch = treatment.name.toLowerCase().includes(searchTerm.toLowerCase());
        // Filtro por estado
        const matchesStatus = statusFilter === 'all' || treatment.status === statusFilter;
        // Filtro por tipo
        const matchesType = typeFilter === 'all' || treatment.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    // Paginación
    const totalPages = Math.ceil(filteredTreatments.length / itemsPerPage);
    const paginatedTreatments = filteredTreatments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Redirigir si no hay paciente
    useEffect(() => {
        if (!patientLoading && !patient) {
            navigate('/patients');
        }
    }, [patient, patientLoading, navigate]);

    // Resetear página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, typeFilter]);

    // Obtener iniciales para el avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    if (patientLoading || historyLoading) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex gap-6">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!patient) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">

                {/* Título Historia Clínica */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary-100 rounded-xl">
                            <FileText className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Historia Clínica</h1>
                            <p className="text-sm text-gray-500">Registro completo de tratamientos y consultas del paciente</p>
                        </div>
                    </div>
                </div>

                {/* Header con foto de paciente */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar */}
                        <div className="flex flex-col items-center gap-3">
                            <Avatar className="h-24 w-24 border-4 border-primary-100">
                                <AvatarFallback className="bg-primary-500 text-white text-2xl">
                                    {getInitials(patient.fullName)}
                                </AvatarFallback>
                            </Avatar>
                            <Badge variant={patient.IsActive !== false ? 'default' : 'secondary'}>
                                {patient.IsActive !== false ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </div>

                        {/* Información del paciente */}
                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{patient.fullName}</h1>
                                    {patient.createdAt && (
                                        <p className="text-gray-500 mt-1">
                                            Paciente desde {format(new Date(patient.createdAt), 'MMMM yyyy', { locale: es })}
                                        </p>
                                    )}
                                </div>
                                <Button variant="outline" onClick={() => navigate('/patients')}>
                                    Volver a Pacientes
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                                <div className="flex items-center gap-3 text-sm">
                                    <IdCard className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">Historia #{patient.medicalRecordNum}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">
                                        {patient.birthDate ? format(new Date(patient.birthDate), 'dd/MM/yyyy') : 'No registrada'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">{patient.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">{patient.phoneNumber}</span>
                                </div>
                                {patient.address && (
                                    <div className="flex items-center gap-3 text-sm col-span-full">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">{patient.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información Clínica */}
                <Card className="border-l-4 border-l-primary-500">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-100 rounded-lg">
                                <Stethoscope className="h-5 w-5 text-primary-600" />
                            </div>
                            <div>
                                <CardTitle>Información Clínica</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">Antecedentes médicos, alergias y observaciones</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowClinicalInfoForm(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Actualizar
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Antecedentes Médicos</label>
                                <p className="mt-2 text-gray-700">{clinicalHistory?.medicalHistory || 'No registrados'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Alergias</label>
                                <p className="mt-2 text-gray-700">{clinicalHistory?.allergies || 'No registradas'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones Generales</label>
                                <p className="mt-2 text-gray-700">{clinicalHistory?.observations || 'No registradas'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sección de Tratamientos */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <ClipboardList className="h-5 w-5 text-primary-600" />
                            <div>
                                <CardTitle>Tratamientos</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">Gestión de tratamientos odontológicos</p>
                            </div>
                            <div className="ml-auto">
                                <Button onClick={() => setShowTreatmentForm(true)} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Nuevo Tratamiento
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filtros */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar tratamiento..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {typeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tabla de tratamientos */}
                        <TreatmentTable
                            data={paginatedTreatments}
                            isLoading={treatmentsLoading}
                            patientId={patientId}
                            onStart={(treatment) => {
                                console.log('Iniciar tratamiento:', treatment);
                            }}
                            onPause={(treatment) => {
                                console.log('Pausar tratamiento:', treatment);
                            }}
                            onComplete={(treatment) => {
                                console.log('Completar tratamiento:', treatment);
                            }}
                            onCancel={(treatment) => {
                                console.log('Cancelar tratamiento:', treatment);
                            }}
                            pagination={{
                                currentPage,
                                totalPages,
                                totalItems: filteredTreatments.length,
                                itemsPerPage,
                                onPageChange: setCurrentPage,
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Modales */}
                {showTreatmentForm && clinicalHistory && (
                    <TreatmentForm
                        open={showTreatmentForm}
                        onOpenChange={setShowTreatmentForm}
                        clinicalHistoryId={clinicalHistory.id}
                        onSuccess={() => {
                            setShowTreatmentForm(false);
                            refetchTreatments();
                        }}
                    />
                )}

                {showClinicalInfoForm && clinicalHistory && (
                    <ClinicalInfoForm
                        open={showClinicalInfoForm}
                        onOpenChange={setShowClinicalInfoForm}
                        clinicalHistory={clinicalHistory}
                        onSuccess={() => {
                            setShowClinicalInfoForm(false);
                            refetchHistory();
                        }}
                    />
                )}
            </div>
        </div>
    );
}