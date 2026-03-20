import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Patient } from '@/types';

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

  // Create PDF in portrait, mm, a4
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 12;
  let currentY = 18;

  // 1. Header / Title
  pdf.setFontSize(22);
  pdf.setTextColor(0, 102, 204); // #0066cc
  pdf.setFont('helvetica', 'bold');
  pdf.text('NEWS2 OBSERVATIONS CHART', margin, currentY);
  currentY += 12;

  // 2. Patient Details Section (Boxed layout for better structure)
  pdf.setDrawColor(0, 102, 204);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, currentY, pageWidth - 2 * margin, 32); // Outer box for details
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  const leftCol = margin + 5;
  const rightCol = pageWidth / 2 + 5;
  let detailY = currentY + 8;

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
  drawDetail('HOSPITAL', 'GENERAL HOSPITAL', rightCol, detailY); // Placeholder clinic
  detailY += 6;
  drawDetail('ADMISSION DATE', new Date(patient.dateOfAdmission).toLocaleDateString('en-GB'), leftCol, detailY);

  currentY += 42; // Move below the box

  // 3. Chart Capture using html2canvas
  // Temporarily adjust chart for capture
  const originalWidth = chartElement.style.width;
  const originalMaxWidth = chartElement.style.maxWidth;
  const originalOverflow = chartElement.style.overflow;
  
  chartElement.style.width = '1400px'; // High fixed width to ensure horizontal detail is visible
  chartElement.style.maxWidth = 'none';
  chartElement.style.overflow = 'visible';

  try {
    const canvas = await html2canvas(chartElement, {
      scale: 2, // Retina-like quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1400, // Matching the adjusted width
    });

    const imgData = canvas.toDataURL('image/png');
    const chartWidth = pageWidth - 2 * margin;
    const chartHeight = (canvas.height * chartWidth) / canvas.width;

    // Check if chart is too tall for a single page after the header
    const availableHeight = pdf.internal.pageSize.getHeight() - currentY - 15;
    
    if (chartHeight > availableHeight) {
      // If it's too large, we scale it to fit the page vertically while keeping aspect ratio
      const scaledHeight = availableHeight;
      const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
      const xOffset = margin + (chartWidth - scaledWidth) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, currentY, scaledWidth, scaledHeight, undefined, 'FAST');
    } else {
      pdf.addImage(imgData, 'PNG', margin, currentY, chartWidth, chartHeight, undefined, 'FAST');
    }

    // 4. Footer info
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Digital NEWS2 Chart System - Not a certified medical device.', margin, pageHeight - 8);
    pdf.text(`Printed on: ${new Date().toLocaleString('en-GB')}`, pageWidth - margin - 45, pageHeight - 8);

    // 5. Final Save
    const filename = `NEWS2_${patient.lastName}_${patient.firstName}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
  } finally {
    // Restore styling
    chartElement.style.width = originalWidth;
    chartElement.style.maxWidth = originalMaxWidth;
    chartElement.style.overflow = originalOverflow;
  }
}
