// PDF generation — placeholder until a library is chosen (jsPDF, React-PDF, Puppeteer)

import type { PatientChart } from '@/types';

export async function generatePatientChartPDF(_chart: PatientChart): Promise<Blob> {
  // TODO: implement PDF generation
  throw new Error('PDF generation not yet implemented');
}
