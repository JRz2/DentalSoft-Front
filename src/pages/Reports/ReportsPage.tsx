// src/pages/ReportsPage.tsx
import { useState } from 'react';
import { FileText, CalendarDays, Banknote, Receipt, AlertTriangle } from 'lucide-react';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { reportService } from '@/services/report.service';
import { PdfPreviewModal } from '@/components/reports/PdfPreviewModal';
import { format } from 'date-fns';

export function ReportsPage() {
  usePageHeader('Reportes e Informes', 'Genera y descarga documentos financieros y clínicos.');

  // Estados de fechas
  const [closureDate, setClosureDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [incomeMonth, setIncomeMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Estados del modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pdfData, setPdfData] = useState<{ blob: Blob; fileName: string; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleGenerate = async (type: 'closure' | 'income' | 'debts' | 'voided') => {
    setIsLoading(type);
    try {
      let blob: Blob;
      let title = '';
      let fileName = '';

      if (type === 'closure') {
        blob = await reportService.getDailyClosure(closureDate);
        title = 'Cierre de Caja Diario';
        fileName = `Cierre-${closureDate}.pdf`;
      } else if (type === 'income') {
        blob = await reportService.getMonthlyIncome(incomeMonth);
        title = 'Resumen de Ingresos';
        fileName = `Ingresos-${incomeMonth}.pdf`;
      } else if (type === 'debts') {
        blob = await reportService.getDebts();
        title = 'Cuentas por Cobrar';
        fileName = `Deudas-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      } else {
        blob = await reportService.getVoidedPayments();
        title = 'Pagos Anulados';
        fileName = `Anulados-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      }

      setPdfData({ blob, fileName, title });
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error('Error al generar el reporte. Intenta nuevamente.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tarjeta 1: Cierre Diario */}
        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600">
                <FileText className="h-6 w-6" />
              </div>
              <CardTitle>Cierre de Caja</CardTitle>
            </div>
            <CardDescription>Resumen de todos los pagos recibidos en una fecha específica.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Fecha a consultar</label>
              <Input 
                type="date" 
                value={closureDate} 
                onChange={(e) => setClosureDate(e.target.value)} 
              />
            </div>
            <Button 
              className="w-full gap-2 bg-teal-600 hover:bg-teal-700" 
              onClick={() => handleGenerate('closure')}
              disabled={isLoading === 'closure'}
            >
              <CalendarDays className="h-4 w-4" />
              {isLoading === 'closure' ? 'Generando...' : 'Generar Cierre'}
            </Button>
          </CardContent>
        </Card>

        {/* Tarjeta 2: Ingresos del Mes */}
        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                <Banknote className="h-6 w-6" />
              </div>
              <CardTitle>Ingresos Mensuales</CardTitle>
            </div>
            <CardDescription>Resumen total de efectivo y transferencias por mes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Mes a consultar</label>
              <Input 
                type="month" 
                value={incomeMonth} 
                onChange={(e) => setIncomeMonth(e.target.value)} 
              />
            </div>
            <Button 
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={() => handleGenerate('income')}
              disabled={isLoading === 'income'}
            >
              <CalendarDays className="h-4 w-4" />
              {isLoading === 'income' ? 'Generando...' : 'Generar Ingresos'}
            </Button>
          </CardContent>
        </Card>

        {/* Tarjeta 3: Cuentas por Cobrar */}
        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-red-50 rounded-xl text-red-600">
                <Receipt className="h-6 w-6" />
              </div>
              <CardTitle>Cuentas por Cobrar</CardTitle>
            </div>
            <CardDescription>Saldos pendientes de pacientes y deudas por tratamiento.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white mt-4" 
              onClick={() => handleGenerate('debts')}
              disabled={isLoading === 'debts'}
            >
              <Receipt className="h-4 w-4" />
              {isLoading === 'debts' ? 'Generando...' : 'Generar Reporte'}
            </Button>
          </CardContent>
        </Card>

        {/* Tarjeta 4: Pagos Anulados */}
        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <CardTitle>Pagos Anulados</CardTitle>
            </div>
            <CardDescription>Auditoría de devoluciones, errores de caja y cancelaciones.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white mt-4" 
              onClick={() => handleGenerate('voided')}
              disabled={isLoading === 'voided'}
            >
              <AlertTriangle className="h-4 w-4" />
              {isLoading === 'voided' ? 'Generando...' : 'Generar Reporte'}
            </Button>
          </CardContent>
        </Card>
        
      </div>

      <PdfPreviewModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        pdfBlob={pdfData?.blob || null}
        fileName={pdfData?.fileName || 'reporte.pdf'}
        title={pdfData?.title || ''}
      />
    </div>
  );
}