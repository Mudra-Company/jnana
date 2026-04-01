import jsPDF from 'jspdf';

interface RiasecPdfData {
  userName: string;
  jobTitle?: string;
  companyName?: string;
  profileCode: string;
  scores: Record<string, number>;
  adjData: { subject: string; A: number }[];
  reportSections: { type: string; content: string }[];
}

const RIASEC_COLORS: Record<string, string> = {
  R: '#E74C3C',
  I: '#8E44AD',
  A: '#E67E22',
  S: '#2ECC71',
  E: '#3498DB',
  C: '#F1C40F',
};

const DIM_LABELS: Record<string, string> = {
  R: 'Realistico',
  I: 'Investigativo',
  A: 'Artistico',
  S: 'Sociale',
  E: 'Intraprendente',
  C: 'Convenzionale',
};

async function svgToPng(svgElement: SVGSVGElement, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const serializer = new XMLSerializer();
    let svgStr = serializer.serializeToString(svgElement);

    // Remove foreignObject elements (icons) — they don't render on canvas
    svgStr = svgStr.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '');

    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG'));
    };
    img.src = url;
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export async function exportRiasecPdf(
  data: RiasecPdfData,
  radarContainer: HTMLElement | null,
  barContainer: HTMLElement | null
): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = 0;

  // ─── HEADER ───
  pdf.setFillColor(99, 102, 241);
  pdf.rect(0, 0, pageW, 40, 'F');
  pdf.setFillColor(79, 70, 229);
  pdf.rect(0, 0, pageW * 0.35, 40, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Report RIASEC', margin, 16);

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.userName, margin, 25);

  const meta: string[] = [];
  if (data.jobTitle) meta.push(data.jobTitle);
  if (data.companyName) meta.push(data.companyName);
  if (meta.length > 0) {
    pdf.setFontSize(9);
    pdf.text(meta.join(' — '), margin, 32);
  }

  // Profile code badge (right side)
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Profilo: ${data.profileCode}`, pageW - margin, 16, { align: 'right' });

  const dateStr = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(dateStr, pageW - margin, 24, { align: 'right' });

  y = 48;

  // ─── CHARTS (side by side) ───
  const chartW = contentW / 2 - 3;
  const chartH = 75;

  // Capture radar SVG
  if (radarContainer) {
    const svg = radarContainer.querySelector('svg');
    if (svg) {
      try {
        const png = await svgToPng(svg as SVGSVGElement, svg.clientWidth || 400, svg.clientHeight || 400);
        pdf.addImage(png, 'PNG', margin, y, chartW, chartH);
      } catch (e) {
        console.warn('Radar chart capture failed', e);
      }
    }
  }

  if (barContainer) {
    const svg = barContainer.querySelector('svg');
    if (svg) {
      try {
        const png = await svgToPng(svg as SVGSVGElement, svg.clientWidth || 400, svg.clientHeight || 350);
        pdf.addImage(png, 'PNG', margin + chartW + 6, y, chartW, chartH);
      } catch (e) {
        console.warn('Bar chart capture failed', e);
      }
    }
  }

  // Chart titles
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('MAPPA ATTITUDINALE', margin + chartW / 2, y - 2, { align: 'center' });
  pdf.text('INTENSITÀ TRATTI', margin + chartW + 6 + chartW / 2, y - 2, { align: 'center' });

  y += chartH + 8;

  // ─── SCORES TABLE ───
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(75, 85, 99);
  pdf.text('PUNTEGGI RIASEC', margin, y);
  y += 5;

  const dims = ['R', 'I', 'A', 'S', 'E', 'C'];
  const colW = contentW / 6;
  dims.forEach((dim, i) => {
    const x = margin + i * colW;
    const [r, g, b] = hexToRgb(RIASEC_COLORS[dim]);

    // Color dot
    pdf.setFillColor(r, g, b);
    pdf.circle(x + colW / 2 - 8, y + 3, 2.5, 'F');

    // Label
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99);
    pdf.text(DIM_LABELS[dim], x + colW / 2 - 4, y + 4.5);

    // Score
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(r, g, b);
    pdf.text(`${data.scores[dim]}`, x + colW / 2, y + 12, { align: 'center' });
  });

  y += 20;

  // ─── REPORT SECTIONS ───
  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 15) {
      pdf.addPage();
      y = margin;
    }
  };

  for (const section of data.reportSections.filter(s => s.type !== 'karma')) {
    const blocks = section.content.split(/(?=### )/g);

    for (const block of blocks) {
      const headerMatch = block.match(/^### (.*?)\n/);
      const header = headerMatch ? headerMatch[1].replace(/\*\*/g, '') : null;
      const body = header ? block.replace(/^### .*?\n/, '') : block;

      if (header) {
        ensureSpace(20);
        // Section header with accent line
        pdf.setFillColor(99, 102, 241);
        pdf.rect(margin, y, 3, 6, 'F');
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(31, 41, 55);
        pdf.text(header, margin + 6, y + 5);
        y += 12;
      }

      // Process body: strip special blocks, render text
      let cleanBody = body
        .replace(/\[BLOCK:TRAITS\]/g, '\n[TRAITS_START]\n')
        .replace(/\[BLOCK:QUOTES\]/g, '\n[QUOTES_START]\n');

      const segments = cleanBody.split(/(\[TRAITS_START\]|\[QUOTES_START\])/g);

      let mode: 'text' | 'traits' | 'quotes' = 'text';
      for (const seg of segments) {
        if (seg === '[TRAITS_START]') { mode = 'traits'; continue; }
        if (seg === '[QUOTES_START]') { mode = 'quotes'; continue; }

        if (!seg.trim()) { mode = 'text'; continue; }

        if (mode === 'traits') {
          const traits = seg.split(',').map(t => t.trim()).filter(t => t);
          if (traits.length > 0) {
            ensureSpace(12);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(156, 163, 175);
            pdf.text('TRATTI DISTINTIVI', margin + 6, y);
            y += 4;
            let tx = margin + 6;
            for (const trait of traits) {
              const tw = pdf.getTextWidth(trait) + 6;
              if (tx + tw > pageW - margin) { tx = margin + 6; y += 7; ensureSpace(8); }
              pdf.setFillColor(243, 244, 246);
              pdf.roundedRect(tx, y - 3, tw, 6, 1.5, 1.5, 'F');
              pdf.setFontSize(7);
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(55, 65, 81);
              pdf.text(trait, tx + 3, y + 1);
              tx += tw + 3;
            }
            y += 8;
          }
          mode = 'text';
          continue;
        }

        if (mode === 'quotes') {
          const quotes = seg.split('"').filter(q => q.trim().length > 2);
          for (const quote of quotes) {
            ensureSpace(12);
            pdf.setFillColor(243, 244, 246);
            pdf.rect(margin + 6, y - 2, contentW - 12, 8, 'F');
            pdf.setFillColor(99, 102, 241);
            pdf.rect(margin + 6, y - 2, 1.5, 8, 'F');
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(107, 114, 128);
            const lines = pdf.splitTextToSize(`"${quote.trim()}"`, contentW - 20);
            pdf.text(lines, margin + 10, y + 2);
            y += lines.length * 4 + 4;
          }
          mode = 'text';
          continue;
        }

        // Regular text / job lists
        const lines = seg.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;

          if (line.trim().startsWith('* ')) {
            ensureSpace(10);
            const jobText = line.replace(/^\s*\*\s*/, '').replace(/\*\*/g, '');
            pdf.setFillColor(249, 250, 251);
            const jobLines = pdf.splitTextToSize(jobText, contentW - 18);
            const blockH = jobLines.length * 4 + 4;
            pdf.roundedRect(margin + 4, y - 2, contentW - 8, blockH, 2, 2, 'F');
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(55, 65, 81);
            // Briefcase dot
            pdf.setFillColor(99, 102, 241);
            pdf.circle(margin + 8, y + 1.5, 1.5, 'F');
            pdf.text(jobLines, margin + 13, y + 2);
            y += blockH + 2;
          } else {
            ensureSpace(8);
            const cleanLine = line.replace(/\*\*/g, '');
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(75, 85, 99);
            const wrapped = pdf.splitTextToSize(cleanLine, contentW - 10);
            pdf.text(wrapped, margin + 4, y);
            y += wrapped.length * 4 + 2;
          }
        }
      }
      y += 4;
    }
  }

  // ─── FOOTER on last page ───
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(180, 180, 180);
  pdf.text(`Report generato da Jñana Platform — ${dateStr}`, pageW / 2, pageH - 8, { align: 'center' });

  // Save
  const safeName = data.userName.replace(/[^a-zA-Z0-9]/g, '_');
  pdf.save(`Report_RIASEC_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
}
