import { Injectable } from '@angular/core';
import { Vehicle, vehicleDisplayName } from '../models/vehicle.model';
import { MaintenanceLog } from '../models/maintenance-log.model';
import { ModificationLog } from '../models/modification-log.model';

@Injectable({ providedIn: 'root' })
export class PdfService {

  async generateReport(
    vehicle: Vehicle,
    maintenanceLogs: MaintenanceLog[],
    modifications: ModificationLog[],
  ): Promise<void> {
    // Dynamically import jsPDF to keep initial bundle small
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 14;
    let y = margin;

    // ── Header ──
    doc.setFillColor(7, 7, 14);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('VehicleManager', margin, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Informe de vehículo', margin, 21);
    y = 38;

    // ── Vehicle Info ──
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(vehicleDisplayName(vehicle), margin, y); y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Matrícula: ${vehicle.licensePlate}  |  Año: ${vehicle.year}  |  Km: ${vehicle.currentMileage}`, margin, y);
    y += 10;

    // ── Specs ──
    if (Object.keys(vehicle.specs).length > 0) {
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30,30,30);
      doc.text('Ficha técnica', margin, y); y += 6;
      autoTable(doc, {
        startY: y, margin: { left: margin, right: margin },
        head: [['Campo', 'Valor']],
        body: Object.entries(vehicle.specs),
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [0, 122, 255] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── Maintenance ──
    const totalMaint = maintenanceLogs.reduce((s, l) => s + l.cost, 0);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30,30,30);
    doc.text(`Historial de mantenimiento — Total: ${this.eur(totalMaint)}`, margin, y); y += 6;
    autoTable(doc, {
      startY: y, margin: { left: margin, right: margin },
      head: [['Tipo', 'Fecha', 'Km', 'Coste', 'Notas']],
      body: maintenanceLogs.map(l => [
        l.type, this.date(l.date), `${l.mileage} km`, this.eur(l.cost), l.notes,
      ]),
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 122, 255] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Modifications ──
    const totalMod = modifications.reduce((s, m) => s + m.cost, 0);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30,30,30);
    doc.text(`Modificaciones — Total: ${this.eur(totalMod)}`, margin, y); y += 6;
    autoTable(doc, {
      startY: y, margin: { left: margin, right: margin },
      head: [['Pieza', 'Marca', 'Categoría', 'Coste', 'Notas']],
      body: modifications.map(m => [m.partName, m.brand, m.category, this.eur(m.cost), m.notes]),
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [94, 92, 230] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Grand total ──
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(0,122,255);
    doc.text(`Coste total: ${this.eur(totalMaint + totalMod)}`, margin, y);

    doc.save(`${vehicle.licensePlate}-informe.pdf`);
  }

  private eur(val: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  }

  private date(d: Date): string {
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(d);
  }
}
