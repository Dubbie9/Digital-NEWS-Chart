import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Patient, Observation } from '@/types';
import { CLINICAL_RESPONSES } from '@/lib/scoring';

// ─── Chart screenshot PDF (used from PatientDetail chart tab) ────────

export async function exportChartAsPDF(
  elementId: string,
  patient: Patient,
  wardName: string,
) {
  const chartElement = document.getElementById(elementId);
  if (!chartElement) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 12;
  let currentY = 18;

  pdf.setFontSize(22);
  pdf.setTextColor(0, 102, 204);
  pdf.setFont('helvetica', 'bold');
  pdf.text('NEWS2 OBSERVATIONS CHART', margin, currentY);
  currentY += 12;

  drawPatientHeader(pdf, patient, wardName, margin, currentY, pageWidth);
  currentY += 42;

  const originalWidth = chartElement.style.width;
  const originalMaxWidth = chartElement.style.maxWidth;
  const originalOverflow = chartElement.style.overflow;

  chartElement.style.width = '1400px';
  chartElement.style.maxWidth = 'none';
  chartElement.style.overflow = 'visible';

  try {
    const canvas = await html2canvas(chartElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1400,
    });

    const imgData = canvas.toDataURL('image/png');
    const chartWidth = pageWidth - 2 * margin;
    const chartHeight = (canvas.height * chartWidth) / canvas.width;
    const availableHeight = pdf.internal.pageSize.getHeight() - currentY - 15;

    if (chartHeight > availableHeight) {
      const scaledHeight = availableHeight;
      const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
      const xOffset = margin + (chartWidth - scaledWidth) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, currentY, scaledWidth, scaledHeight, undefined, 'FAST');
    } else {
      pdf.addImage(imgData, 'PNG', margin, currentY, chartWidth, chartHeight, undefined, 'FAST');
    }

    drawFooter(pdf, margin, pageWidth);
    const filename = `NEWS2_Chart_${patient.lastName}_${patient.firstName}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
  } finally {
    chartElement.style.width = originalWidth;
    chartElement.style.maxWidth = originalMaxWidth;
    chartElement.style.overflow = originalOverflow;
  }
}

// ─── Data-based observation PDF (used from export modal & patient detail) ──

export function exportPatientPDF(
  patient: Patient,
  observations: Observation[],
  wardName: string,
) {
  const pdf = buildPatientPDF(patient, observations, wardName);
  const filename = `NEWS2_${patient.lastName}_${patient.firstName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(filename);
}

export async function exportMultiplePatientPDFs(
  patients: Patient[],
  observations: Observation[],
  wardName: string,
  onProgress?: (done: number, total: number) => void,
) {
  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    const patientObs = observations
      .filter((o) => o.patientId === patient.id)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    const pdf = buildPatientPDF(patient, patientObs, wardName);
    const filename = `NEWS2_${patient.lastName}_${patient.firstName}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);

    onProgress?.(i + 1, patients.length);

    // Small delay between downloads so the browser doesn't block them
    if (i < patients.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
}

// ─── Internal helpers ────────────────────────────────────────────────

function buildPatientPDF(patient: Patient, observations: Observation[], wardName: string): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  let currentY = 18;

  // Title
  pdf.setFontSize(22);
  pdf.setTextColor(0, 102, 204);
  pdf.setFont('helvetica', 'bold');
  pdf.text('NEWS2 OBSERVATION RECORD', margin, currentY);
  currentY += 12;

  // Patient header box
  drawPatientHeader(pdf, patient, wardName, margin, currentY, pageWidth);
  currentY += 42;

  // Observations table
  const sorted = [...observations].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );

  if (sorted.length === 0) {
    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'italic');
    pdf.text('No observations recorded for this patient.', margin, currentY + 10);
    drawFooter(pdf, margin, pageWidth);
    return pdf;
  }

  // Table header
  const cols = [
    { label: 'Date', width: 20 },
    { label: 'Time', width: 14 },
    { label: 'By', width: 22 },
    { label: 'Resp', width: 12 },
    { label: 'SpO2', width: 14 },
    { label: 'BP', width: 20 },
    { label: 'Pulse', width: 14 },
    { label: 'ACVPU', width: 14 },
    { label: 'Temp', width: 14 },
    { label: 'Score', width: 14 },
    { label: 'Risk', width: 24 },
  ];

  const tableWidth = cols.reduce((sum, c) => sum + c.width, 0);
  const tableX = margin;
  const rowHeight = 7;

  const drawTableHeader = (y: number) => {
    // Header background
    pdf.setFillColor(11, 30, 54); // #0B1E36
    pdf.rect(tableX, y, tableWidth, rowHeight, 'F');

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    let x = tableX;
    for (const col of cols) {
      pdf.text(col.label, x + 1.5, y + 5);
      x += col.width;
    }
    return y + rowHeight;
  };

  currentY = drawTableHeader(currentY);

  // Score colour backgrounds (RGB)
  const scoreRGB: Record<string, [number, number, number]> = {
    low: [220, 252, 231],         // green-100
    'low-medium': [254, 249, 195], // yellow-100
    medium: [255, 237, 213],       // orange-100
    high: [254, 226, 226],         // red-100
  };

  for (const obs of sorted) {
    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - 15) {
      drawFooter(pdf, margin, pageWidth);
      pdf.addPage();
      currentY = 15;
      currentY = drawTableHeader(currentY);
    }

    const dt = new Date(obs.recordedAt);

    if (obs.declined) {
      // Declined row — light red background
      pdf.setFillColor(254, 226, 226);
      pdf.rect(tableX, currentY, tableWidth, rowHeight, 'F');

      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      let x = tableX;
      pdf.text(dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), x + 1.5, currentY + 5);
      x += cols[0].width;
      pdf.text(dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), x + 1.5, currentY + 5);
      x += cols[1].width;
      pdf.text(obs.recordedBy.substring(0, 12), x + 1.5, currentY + 5);
      x += cols[2].width;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(220, 38, 38);
      pdf.text('DECLINED', x + 1.5, currentY + 5);
    } else {
      // Normal row — alternate white/grey
      const rgb = scoreRGB[obs.riskLevel] || [255, 255, 255];
      pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
      pdf.rect(tableX, currentY, tableWidth, rowHeight, 'F');

      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(30, 30, 30);

      const response = CLINICAL_RESPONSES[obs.riskLevel];
      const values = [
        dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        obs.recordedBy.substring(0, 12),
        String(obs.respirationRate),
        `${obs.spO2}%`,
        obs.diastolicBP ? `${obs.systolicBP}/${obs.diastolicBP}` : String(obs.systolicBP),
        String(obs.pulse),
        obs.consciousness.substring(0, 1),
        `${obs.temperature}°`,
        String(obs.totalScore),
        response.label,
      ];

      let x = tableX;
      for (let i = 0; i < values.length; i++) {
        if (i === values.length - 2) {
          // Score column — bold
          pdf.setFont('helvetica', 'bold');
          pdf.text(values[i], x + 1.5, currentY + 5);
          pdf.setFont('helvetica', 'normal');
        } else {
          pdf.text(values[i], x + 1.5, currentY + 5);
        }
        x += cols[i].width;
      }
    }

    // Row border
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.line(tableX, currentY + rowHeight, tableX + tableWidth, currentY + rowHeight);

    currentY += rowHeight;
  }

  // Summary at the bottom
  currentY += 6;
  if (currentY + 20 > pageHeight - 15) {
    drawFooter(pdf, margin, pageWidth);
    pdf.addPage();
    currentY = 15;
  }

  pdf.setFontSize(9);
  pdf.setTextColor(60, 60, 60);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Total Observations: ${sorted.length}`, margin, currentY);
  const nonDeclined = sorted.filter((o) => !o.declined);
  if (nonDeclined.length > 0) {
    const lastObs = nonDeclined[nonDeclined.length - 1];
    const lastResponse = CLINICAL_RESPONSES[lastObs.riskLevel];
    currentY += 5;
    pdf.text(`Last Score: ${lastObs.totalScore} (${lastResponse.label} Risk)`, margin, currentY);
    currentY += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Last recorded: ${new Date(lastObs.recordedAt).toLocaleString('en-GB')} by ${lastObs.recordedBy}`,
      margin, currentY,
    );
  }

  drawFooter(pdf, margin, pageWidth);
  return pdf;
}

function drawPatientHeader(
  pdf: jsPDF, patient: Patient, wardName: string,
  margin: number, startY: number, pageWidth: number,
) {
  pdf.setDrawColor(0, 102, 204);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, startY, pageWidth - 2 * margin, 32);

  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);

  const leftCol = margin + 5;
  const rightCol = pageWidth / 2 + 5;
  let detailY = startY + 8;

  const drawDetail = (label: string, value: string, x: number, y: number) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${label}:`, x, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(value), x + 35, y);
  };

  drawDetail('LAST NAME', patient.lastName.toUpperCase(), leftCol, detailY);
  drawDetail('NHS NUMBER', patient.nhsNumber || 'N/A', rightCol, detailY);
  detailY += 6;
  drawDetail('FIRST NAME', patient.firstName, leftCol, detailY);
  drawDetail('WARD / UNIT', wardName, rightCol, detailY);
  detailY += 6;
  drawDetail('DATE OF BIRTH', new Date(patient.dateOfBirth).toLocaleDateString('en-GB'), leftCol, detailY);
  detailY += 6;
  drawDetail('ADMISSION', new Date(patient.dateOfAdmission).toLocaleDateString('en-GB'), leftCol, detailY);
}

function drawFooter(pdf: jsPDF, margin: number, pageWidth: number) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Digital NEWS2 Chart System - Not a certified medical device.', margin, pageHeight - 8);
  pdf.text(`Printed on: ${new Date().toLocaleString('en-GB')}`, pageWidth - margin - 45, pageHeight - 8);
}
