/**
 * Client-side PDF export.
 *
 * The server already renders fee receipts, because those are financial records
 * that have to be reproducible from the database.  Everything else the portal
 * shows is a view of data the browser already holds, so it is cheaper to print
 * it here than to add an endpoint per screen.
 *
 * jsPDF is four times the size of the rest of the app, so it is imported
 * dynamically: the chunk is fetched the first time somebody exports something
 * and never on a normal page load.
 */

import type { jsPDF } from 'jspdf';

/** The brand indigo and slate the rest of the UI is built from. */
const BRAND: [number, number, number] = [79, 70, 229];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const RULE: [number, number, number] = [226, 232, 240];
const ZEBRA: [number, number, number] = [248, 250, 252];

const MARGIN = 40;
const BANNER_HEIGHT = 68;

export interface TablePdfOptions {
  /** Saved as `<filename>.pdf`. */
  filename: string;
  title: string;
  subtitle?: string;
  /** Label/value pairs laid out in two columns above the table. */
  meta?: Array<[string, string]>;
  head: string[];
  rows: Array<Array<string | number>>;
  /** Printed in small type under the table. */
  note?: string;
}

/**
 * Builds a one-table document and hands it to the browser as a download.
 * Runs entirely in the tab, so nothing here reaches the network beyond the
 * one-off fetch of the PDF chunk itself.
 */
export async function downloadTablePdf({
  filename, title, subtitle, meta, head, rows, note,
}: TablePdfOptions): Promise<void> {
  const [{ jsPDF: JsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new JsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  drawBanner(doc, pageWidth, title, subtitle);

  let y = BANNER_HEIGHT + 30;
  if (meta && meta.length > 0) y = drawMeta(doc, pageWidth, meta, y);

  autoTable(doc, {
    startY: y,
    head: [head],
    body: rows.map((row) => row.map((cell) => String(cell))),
    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: 48 },
    styles: {
      font: 'helvetica', fontSize: 9, cellPadding: 6,
      lineColor: RULE, lineWidth: 0.5, textColor: INK,
    },
    headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: ZEBRA },
  });

  if (note) {
    // `lastAutoTable` is where the plugin parks the geometry of the table it
    // has just drawn; it is the only way to know what row height it settled on.
    const endedAt = (doc as unknown as { lastAutoTable?: { finalY: number } })
      .lastAutoTable?.finalY ?? y;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(doc.splitTextToSize(note, pageWidth - MARGIN * 2), MARGIN, endedAt + 18);
  }

  drawFooters(doc, pageWidth, pageHeight);
  doc.save(`${filename}.pdf`);
}

function drawBanner(doc: jsPDF, pageWidth: number, title: string, subtitle?: string): void {
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageWidth, BANNER_HEIGHT, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, MARGIN, subtitle ? 32 : 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (subtitle) doc.text(subtitle, MARGIN, 50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Student ERP', pageWidth - MARGIN, 32, { align: 'right' });
}

/** Lays the label/value pairs out in two columns and returns the next free y. */
function drawMeta(
  doc: jsPDF, pageWidth: number, meta: Array<[string, string]>, top: number,
): number {
  const columnWidth = (pageWidth - MARGIN * 2) / 2;
  const lineHeight = 16;

  doc.setFontSize(9);
  meta.forEach(([label, value], index) => {
    const x = MARGIN + (index % 2) * columnWidth;
    const y = top + Math.floor(index / 2) * lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(label, x, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...INK);
    doc.text(value, x + 105, y);
  });

  return top + Math.ceil(meta.length / 2) * lineHeight + 14;
}

function drawFooters(doc: jsPDF, pageWidth: number, pageHeight: number): void {
  const generated = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const pages = doc.getNumberOfPages();

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Generated ${generated}`, MARGIN, pageHeight - 24);
    doc.text(`Page ${page} of ${pages}`, pageWidth - MARGIN, pageHeight - 24, {
      align: 'right',
    });
  }
}
