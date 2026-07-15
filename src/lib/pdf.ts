// ─── PDF Export ─────────────────────────────────────────────────────
// Draws the filled NEWS2 chart as vector graphics directly with jsPDF —
// no html2canvas screenshotting (which broke with Tailwind v4 colour
// functions, mutated the live DOM mid-capture, and produced a single
// squashed raster page). Output is crisp at any print size.
//
// Two formats:
//   'chart'  — the filled NEWS2 chart as plotted, one page set per month
//   'record' — tabular record of the observation values
// Multi-patient exports are combined into a single PDF (one download —
// mobile Safari blocks rapid multi-file downloads).

import { jsPDF } from 'jspdf';
import type { Patient, Observation } from '@/types';
import { CLINICAL_RESPONSES } from '@/lib/scoring';
import {
  NEWS2_SECTIONS,
  SCORE_COLOURS,
  TITLE_BG,
  findMatchingBandIndex,
  sectionHasData,
  totalScoreColour,
} from '@/lib/chartConfig';

export type PdfExportFormat = 'chart' | 'record' | 'both';

// ─── Public API ──────────────────────────────────────────────────────

export interface PatientExportEntry {
  patient: Patient;
  observations: Observation[];
}

/**
 * Build the PDF document without saving — separated from
 * `exportPatientsPDF` so the drawing logic can be exercised in tests.
 * Yields to the event loop between patients so large ward exports don't
 * freeze the UI.
 */
export async function buildPatientsPDF(
  entries: PatientExportEntry[],
  wardName: string,
  format: PdfExportFormat,
  onProgress?: (done: number, total: number) => void,
): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
  const pager = createPager(pdf);

  for (let i = 0; i < entries.length; i++) {
    const { patient, observations } = entries[i];
    const sorted = [...observations].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    );

    if (format === 'chart' || format === 'both') {
      drawChartPages(pdf, pager, patient, sorted, wardName);
    }
    if (format === 'record' || format === 'both') {
      drawRecordPages(pdf, pager, patient, sorted, wardName);
    }

    onProgress?.(i + 1, entries.length);
    // Keep the main thread responsive during large exports
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  stampPageNumbers(pdf);
  return pdf;
}

/** Export one or more patients into a single PDF file. */
export async function exportPatientsPDF(
  entries: PatientExportEntry[],
  wardName: string,
  format: PdfExportFormat,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  if (entries.length === 0) return;
  const pdf = await buildPatientsPDF(entries, wardName, format, onProgress);
  pdf.save(exportFilename(entries, format));
}

/** Convenience wrapper for a single patient. */
export async function exportPatientPDF(
  patient: Patient,
  observations: Observation[],
  wardName: string,
  format: PdfExportFormat,
): Promise<void> {
  await exportPatientsPDF([{ patient, observations }], wardName, format);
}

// ─── Filename helpers ────────────────────────────────────────────────

function safeFilePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '_');
}

function exportFilename(entries: PatientExportEntry[], format: PdfExportFormat): string {
  const date = new Date().toISOString().slice(0, 10);
  const kind = format === 'chart' ? 'Chart' : format === 'record' ? 'Record' : 'Chart_Record';
  if (entries.length === 1) {
    const { patient } = entries[0];
    return `NEWS2_${kind}_${safeFilePart(patient.lastName)}_${safeFilePart(patient.firstName)}_${date}.pdf`;
  }
  return `NEWS2_${kind}_${entries.length}_patients_${date}.pdf`;
}

// ─── Page management ─────────────────────────────────────────────────

interface PdfPager {
  addPage: (orientation: 'p' | 'l') => void;
}

/**
 * jsPDF documents start with one (portrait) page. The pager reuses that
 * initial blank page for the first drawn page — replacing it when the
 * first content is landscape — and adds pages normally afterwards.
 */
function createPager(pdf: jsPDF): PdfPager {
  let firstPageUsed = false;
  return {
    addPage(orientation: 'p' | 'l') {
      if (!firstPageUsed) {
        firstPageUsed = true;
        if (orientation === 'l') {
          pdf.addPage('a4', 'l');
          pdf.deletePage(1);
          pdf.setPage(pdf.getNumberOfPages());
        }
        return;
      }
      pdf.addPage('a4', orientation);
    },
  };
}

function stampPageNumbers(pdf: jsPDF) {
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Page ${i} of ${total}`, w - 8, h - 4, { align: 'right' });
  }
}

// ─── Colour helpers ──────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const n = parseInt(value.length === 3 ? value.replace(/./g, '$&$&') : value, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function setFillHex(pdf: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  pdf.setFillColor(r, g, b);
}

function setTextHex(pdf: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  pdf.setTextColor(r, g, b);
}

const GRID_LINE: [number, number, number] = [90, 90, 90];
const PLOT_BLUE = '#0066cc';
const DECLINED_RED = '#DC2626';

// ─── Filled chart pages ──────────────────────────────────────────────

const CHART_MARGIN = 8;
const COLS_PER_PAGE = 24;
const SECTION_LABEL_W = 21;
const BAND_LABEL_W = 15;
const DATE_ROW_H = 5;
const TIME_ROW_H = 4.5;
const GAP_H = 1.6;
const TOTAL_ROW_H = 5.5;
const META_ROW_H = 4.2; // frequency / escalation / initials rows
const HEADER_H = 15;
const FOOTER_H = 6;

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
}

function monthLabelFromKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

function drawChartPages(
  pdf: jsPDF,
  pager: PdfPager,
  patient: Patient,
  sorted: Observation[],
  wardName: string,
) {
  if (sorted.length === 0) {
    pager.addPage('l');
    drawChartHeader(pdf, patient, wardName, 'No observations recorded');
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('No observations have been recorded for this patient.', CHART_MARGIN, 40);
    drawChartFooter(pdf);
    return;
  }

  // Group chronologically by month — one chart (page set) per month,
  // mirroring the on-screen monthly chart.
  const months = new Map<string, Observation[]>();
  for (const obs of sorted) {
    const key = monthKey(obs.recordedAt);
    const list = months.get(key);
    if (list) list.push(obs);
    else months.set(key, [obs]);
  }
  const sortedKeys = Array.from(months.keys()).sort();

  for (const key of sortedKeys) {
    const monthObs = months.get(key)!;
    const label = monthLabelFromKey(key);
    for (let start = 0; start < monthObs.length; start += COLS_PER_PAGE) {
      const chunk = monthObs.slice(start, start + COLS_PER_PAGE);
      const continued = start > 0 ? ' (continued)' : '';
      pager.addPage('l');
      drawChartHeader(pdf, patient, wardName, `${label}${continued}`);
      drawChartGrid(pdf, monthObs, chunk);
      drawChartFooter(pdf);
    }
  }
}

function drawChartHeader(pdf: jsPDF, patient: Patient, wardName: string, monthLabel: string) {
  const w = pdf.internal.pageSize.getWidth();
  const m = CHART_MARGIN;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  setTextHex(pdf, TITLE_BG);
  pdf.text('NEWS2 OBSERVATION CHART', m, m + 4);

  pdf.setFontSize(11);
  pdf.setTextColor(30, 30, 30);
  pdf.text(monthLabel, w - m, m + 4, { align: 'right' });

  // Patient identification line
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(30, 30, 30);
  const dob = new Date(patient.dateOfBirth).toLocaleDateString('en-GB');
  const admitted = new Date(patient.dateOfAdmission).toLocaleDateString('en-GB');
  const parts = [
    `NAME: ${patient.lastName.toUpperCase()}, ${patient.firstName}`,
    `DOB: ${dob}`,
    `NHS No: ${patient.nhsNumber || '—'}`,
    `WARD: ${wardName}`,
    `ADMITTED: ${admitted}`,
  ];
  pdf.text(parts.join('     '), m, m + 9.5);

  // Score key (0–3) at the right of the identification line
  const keyBox = 3.6;
  let keyX = w - m - 4 * (keyBox + 1);
  pdf.setFontSize(6.5);
  pdf.text('NEWS key', keyX - 2, m + 9.5, { align: 'right' });
  for (let s = 0; s <= 3; s++) {
    setFillHex(pdf, SCORE_COLOURS[s].bg);
    pdf.setDrawColor(GRID_LINE[0], GRID_LINE[1], GRID_LINE[2]);
    pdf.setLineWidth(0.15);
    pdf.rect(keyX, m + 6.7, keyBox, keyBox, 'FD');
    pdf.setTextColor(30, 30, 30);
    pdf.text(String(s), keyX + keyBox / 2, m + 9.4, { align: 'center' });
    keyX += keyBox + 1;
  }

  pdf.setDrawColor(GRID_LINE[0], GRID_LINE[1], GRID_LINE[2]);
  pdf.setLineWidth(0.3);
  pdf.line(m, m + 11.5, w - m, m + 11.5);
}

function drawChartFooter(pdf: jsPDF) {
  const h = pdf.internal.pageSize.getHeight();
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(6.5);
  pdf.setTextColor(120, 120, 120);
  pdf.text(
    `Exported ${new Date().toLocaleString('en-GB')}  •  Digital NEWS2 Chart — not a certified medical device. Clinical decisions must follow local trust policies.`,
    CHART_MARGIN,
    h - 4,
  );
}

function drawChartGrid(pdf: jsPDF, monthObs: Observation[], columns: Observation[]) {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const m = CHART_MARGIN;

  const visibleSections = NEWS2_SECTIONS.filter((s) => sectionHasData(s, monthObs));
  const totalBands = visibleSections.reduce((sum, s) => sum + s.bands.length, 0);

  const gridX = m + SECTION_LABEL_W + BAND_LABEL_W;
  const gridW = pageW - m - gridX;
  const colW = gridW / COLS_PER_PAGE;

  const fixedHeight =
    m + HEADER_H +
    DATE_ROW_H + TIME_ROW_H + GAP_H +
    (visibleSections.length - 1) * GAP_H +
    GAP_H + TOTAL_ROW_H + 3 * META_ROW_H +
    FOOTER_H + m;
  const bandH = Math.min(3.6, Math.max(2.1, (pageH - fixedHeight) / totalBands));

  const labelX = m;             // section label column
  const bandX = m + SECTION_LABEL_W; // band label column
  let y = m + HEADER_H;

  pdf.setLineWidth(0.15);
  pdf.setDrawColor(GRID_LINE[0], GRID_LINE[1], GRID_LINE[2]);

  // ── Date / time header rows ────────────────────────────────────
  setFillHex(pdf, TITLE_BG);
  pdf.rect(labelX, y, SECTION_LABEL_W + BAND_LABEL_W, DATE_ROW_H + TIME_ROW_H, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('DATE / TIME', labelX + 2, y + (DATE_ROW_H + TIME_ROW_H) / 2, { baseline: 'middle' });

  for (let c = 0; c < columns.length; c++) {
    const obs = columns[c];
    const x = gridX + c * colW;
    const d = new Date(obs.recordedAt);

    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, colW, DATE_ROW_H, 'FD');
    pdf.rect(x, y + DATE_ROW_H, colW, TIME_ROW_H, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.setTextColor(30, 30, 30);
    pdf.text(
      d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
      x + colW / 2, y + DATE_ROW_H / 2,
      { align: 'center', baseline: 'middle' },
    );
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      x + colW / 2, y + DATE_ROW_H + TIME_ROW_H / 2,
      { align: 'center', baseline: 'middle' },
    );
  }
  // Empty header cells to close the grid
  for (let c = columns.length; c < COLS_PER_PAGE; c++) {
    const x = gridX + c * colW;
    pdf.rect(x, y, colW, DATE_ROW_H, 'D');
    pdf.rect(x, y + DATE_ROW_H, colW, TIME_ROW_H, 'D');
  }

  y += DATE_ROW_H + TIME_ROW_H + GAP_H;

  // ── Parameter sections ─────────────────────────────────────────
  interface Dot { x: number; y: number }

  for (let s = 0; s < visibleSections.length; s++) {
    const section = visibleSections[s];
    const sectionH = section.bands.length * bandH;
    const sectionTop = y;

    // Section label cell
    const isSat2 = section.id === 'sat2';
    setFillHex(pdf, isSat2 ? '#B1BBDE' : TITLE_BG);
    pdf.rect(labelX, sectionTop, SECTION_LABEL_W, sectionH, 'FD');
    const labelColour = isSat2 ? '#000000' : '#ffffff';
    setTextHex(pdf, labelColour);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    const labelLines = pdf.splitTextToSize(
      `${section.sectionLabel ? section.sectionLabel + '  ' : ''}${section.paramLabel}`,
      SECTION_LABEL_W - 3,
    ) as string[];
    const infoLines = section.info
      ? (pdf.splitTextToSize(section.info, SECTION_LABEL_W - 3) as string[])
      : [];
    const textBlockH = (labelLines.length + infoLines.length) * 2.4;
    let textY = sectionTop + Math.max(2.4, (sectionH - textBlockH) / 2 + 2);
    for (const line of labelLines) {
      pdf.text(line, labelX + 1.5, textY);
      textY += 2.4;
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(4.8);
    for (const line of infoLines) {
      pdf.text(line, labelX + 1.5, textY);
      textY += 2.4;
    }

    // Band rows
    const dots: Dot[] = [];
    for (let b = 0; b < section.bands.length; b++) {
      const band = section.bands[b];
      const rowY = sectionTop + b * bandH;

      // Band label
      pdf.setFillColor(255, 255, 255);
      pdf.rect(bandX, rowY, BAND_LABEL_W, bandH, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(Math.min(5.2, bandH * 1.9));
      pdf.setTextColor(30, 30, 30);
      pdf.text(band.label, bandX + BAND_LABEL_W - 1, rowY + bandH / 2, {
        align: 'right',
        baseline: 'middle',
      });

      // Value cells
      for (let c = 0; c < COLS_PER_PAGE; c++) {
        const x = gridX + c * colW;
        setFillHex(pdf, SCORE_COLOURS[band.score].bg);
        pdf.rect(x, rowY, colW, bandH, 'FD');
      }
    }

    // Plot declined markers and dots for this section
    for (let c = 0; c < columns.length; c++) {
      const obs = columns[c];
      const x = gridX + c * colW;

      if (obs.declined) {
        setFillHex(pdf, DECLINED_RED);
        pdf.rect(x + colW / 2 - 0.4, sectionTop, 0.8, sectionH, 'F');
        if (section.id === 'bp') {
          setTextHex(pdf, DECLINED_RED);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(6);
          pdf.text('DECLINED', x + colW / 2 + 2.2, sectionTop + sectionH / 2, {
            angle: 90,
            align: 'center',
          });
        }
        continue;
      }

      // SpO2 sections only apply to observations on the matching scale
      if (section.id === 'sat1' && obs.spO2Scale !== 1) continue;
      if (section.id === 'sat2' && obs.spO2Scale !== 2) continue;

      const bandIdx = findMatchingBandIndex(section, obs);
      if (bandIdx >= 0) {
        dots.push({
          x: x + colW / 2,
          y: sectionTop + bandIdx * bandH + bandH / 2,
        });
      }
    }

    // Connect consecutive plotted values, then draw the dots on top
    setDrawHex(pdf, PLOT_BLUE);
    pdf.setLineWidth(0.45);
    for (let i = 0; i < dots.length - 1; i++) {
      pdf.line(dots[i].x, dots[i].y, dots[i + 1].x, dots[i + 1].y);
    }
    setFillHex(pdf, PLOT_BLUE);
    for (const dot of dots) {
      pdf.circle(dot.x, dot.y, Math.min(1.15, bandH * 0.38), 'F');
    }
    pdf.setDrawColor(GRID_LINE[0], GRID_LINE[1], GRID_LINE[2]);
    pdf.setLineWidth(0.15);

    y += sectionH + GAP_H;
  }

  // ── NEWS TOTAL row ─────────────────────────────────────────────
  setFillHex(pdf, TITLE_BG);
  pdf.rect(labelX, y, SECTION_LABEL_W + BAND_LABEL_W, TOTAL_ROW_H, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('NEWS TOTAL', labelX + 2, y + TOTAL_ROW_H / 2, { baseline: 'middle' });

  for (let c = 0; c < COLS_PER_PAGE; c++) {
    const x = gridX + c * colW;
    const obs = columns[c];
    if (!obs) {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, colW, TOTAL_ROW_H, 'FD');
      continue;
    }
    if (obs.declined) {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, colW, TOTAL_ROW_H, 'FD');
      setFillHex(pdf, DECLINED_RED);
      pdf.rect(x + colW / 2 - 0.4, y, 0.8, TOTAL_ROW_H, 'F');
      continue;
    }
    const hasRed = Object.values(obs.scores).some((v) => v === 3);
    setFillHex(pdf, totalScoreColour(obs.totalScore, hasRed));
    pdf.rect(x, y, colW, TOTAL_ROW_H, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(30, 30, 30);
    pdf.text(String(obs.totalScore), x + colW / 2, y + TOTAL_ROW_H / 2, {
      align: 'center',
      baseline: 'middle',
    });
  }
  y += TOTAL_ROW_H;

  // ── Frequency / escalation / initials rows ─────────────────────
  const metaRows: { label: string; value: (obs: Observation) => string }[] = [
    {
      label: 'Monitoring frequency',
      value: (obs) =>
        obs.totalScore >= 7 ? 'Cont.' : obs.totalScore >= 5 ? '1h' : obs.totalScore >= 1 ? '4–6h' : '12h',
    },
    { label: 'Escalation Y/N', value: (obs) => (obs.totalScore >= 5 ? 'Y' : 'N') },
    { label: 'Initials', value: (obs) => getInitials(obs.recordedBy) },
  ];

  for (const row of metaRows) {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(labelX, y, SECTION_LABEL_W + BAND_LABEL_W, META_ROW_H, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.4);
    pdf.setTextColor(30, 30, 30);
    pdf.text(row.label, labelX + SECTION_LABEL_W + BAND_LABEL_W - 1.5, y + META_ROW_H / 2, {
      align: 'right',
      baseline: 'middle',
    });

    for (let c = 0; c < COLS_PER_PAGE; c++) {
      const x = gridX + c * colW;
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, colW, META_ROW_H, 'FD');
      const obs = columns[c];
      if (!obs) continue;
      if (obs.declined) {
        setFillHex(pdf, DECLINED_RED);
        pdf.rect(x + colW / 2 - 0.4, y, 0.8, META_ROW_H, 'F');
        continue;
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.4);
      pdf.text(row.value(obs), x + colW / 2, y + META_ROW_H / 2, {
        align: 'center',
        baseline: 'middle',
      });
    }
    y += META_ROW_H;
  }
}

function setDrawHex(pdf: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  pdf.setDrawColor(r, g, b);
}

// ─── Record (values table) pages ─────────────────────────────────────

function drawRecordPages(
  pdf: jsPDF,
  pager: PdfPager,
  patient: Patient,
  sorted: Observation[],
  wardName: string,
) {
  pager.addPage('p');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  let currentY = 18;

  // Title
  pdf.setFontSize(22);
  setTextHex(pdf, TITLE_BG);
  pdf.setFont('helvetica', 'bold');
  pdf.text('NEWS2 OBSERVATION RECORD', margin, currentY);
  currentY += 12;

  drawPatientHeader(pdf, patient, wardName, margin, currentY, pageWidth);
  currentY += 42;

  if (sorted.length === 0) {
    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'italic');
    pdf.text('No observations recorded for this patient.', margin, currentY + 10);
    drawRecordFooter(pdf, margin, pageWidth);
    return;
  }

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

  const scoreRGB: Record<string, [number, number, number]> = {
    low: [220, 252, 231],
    'low-medium': [254, 249, 195],
    medium: [255, 237, 213],
    high: [254, 226, 226],
  };

  for (const obs of sorted) {
    if (currentY + rowHeight > pageHeight - 15) {
      drawRecordFooter(pdf, margin, pageWidth);
      pdf.addPage('a4', 'p');
      currentY = 15;
      currentY = drawTableHeader(currentY);
    }

    const dt = new Date(obs.recordedAt);

    if (obs.declined) {
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
          pdf.setFont('helvetica', 'bold');
          pdf.text(values[i], x + 1.5, currentY + 5);
          pdf.setFont('helvetica', 'normal');
        } else {
          pdf.text(values[i], x + 1.5, currentY + 5);
        }
        x += cols[i].width;
      }
    }

    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.line(tableX, currentY + rowHeight, tableX + tableWidth, currentY + rowHeight);

    currentY += rowHeight;
  }

  // Summary
  currentY += 6;
  if (currentY + 20 > pageHeight - 15) {
    drawRecordFooter(pdf, margin, pageWidth);
    pdf.addPage('a4', 'p');
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

  drawRecordFooter(pdf, margin, pageWidth);
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

function drawRecordFooter(pdf: jsPDF, margin: number, pageWidth: number) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Digital NEWS2 Chart System - Not a certified medical device.', margin, pageHeight - 8);
  pdf.text(`Printed on: ${new Date().toLocaleString('en-GB')}`, pageWidth - margin - 60, pageHeight - 8);
}
