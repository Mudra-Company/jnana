import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { OrgChartExportOptions } from '../types/orgChartExport';
import type { CompanyProfile } from '../../types';

export async function exportOrgChartToPdf(
  container: HTMLElement,
  company: CompanyProfile,
  options: OrgChartExportOptions
): Promise<void> {
  try {
    // Capture the rendered chart with high quality settings
    const canvas = await html2canvas(container, {
      scale: 3, // High resolution for crisp text
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
      windowWidth: Math.max(container.scrollWidth, 2400),
      windowHeight: Math.max(container.scrollHeight, 1600),
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      imageTimeout: 15000,
      removeContainer: false,
      onclone: (clonedDoc) => {
        // Ensure all fonts are loaded in the cloned document
        const clonedContainer = clonedDoc.body.querySelector('div');
        if (clonedContainer) {
          clonedContainer.style.fontFamily = 'Arial, Helvetica, sans-serif';
        }
      }
    });

    // Create PDF in landscape A4
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 297; // A4 landscape width in mm
    const pageHeight = 210; // A4 landscape height in mm
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    const headerHeight = 25;

    // Add header with gradient-like effect
    pdf.setFillColor(99, 102, 241); // Indigo
    pdf.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Add slight gradient overlay
    pdf.setFillColor(79, 70, 229);
    pdf.rect(0, 0, pageWidth * 0.3, headerHeight, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Organigramma - ${company.name}`, margin, 15);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    pdf.text(`Generato il ${dateStr}`, pageWidth - margin - 50, 15);

    // Calculate image dimensions to fit page
    const imgAspectRatio = canvas.width / canvas.height;
    const availableHeight = pageHeight - headerHeight - margin - 15; // Space for legend
    let imgWidth = contentWidth;
    let imgHeight = imgWidth / imgAspectRatio;

    // If image is too tall, we may need multiple pages
    if (imgHeight > availableHeight) {
      // Check if we can fit it by scaling down
      const scaledHeight = availableHeight;
      const scaledWidth = scaledHeight * imgAspectRatio;
      
      if (scaledWidth <= contentWidth) {
        // It fits if we scale to height
        imgHeight = scaledHeight;
        imgWidth = scaledWidth;
      } else {
        // Need multiple pages - for now, scale to fit width and let it overflow
        // In future iterations, we could split the image
        imgHeight = availableHeight;
        imgWidth = imgHeight * imgAspectRatio;
        
        // If still too wide, scale to fit width
        if (imgWidth > contentWidth) {
          imgWidth = contentWidth;
          imgHeight = imgWidth / imgAspectRatio;
        }
      }
    }

    // Center the image horizontally
    const xOffset = (pageWidth - imgWidth) / 2;
    const yOffset = headerHeight + 5;

    // Add chart image
    pdf.addImage(
      canvas.toDataURL('image/png', 1.0),
      'PNG',
      xOffset,
      yOffset,
      imgWidth,
      imgHeight,
      undefined,
      'FAST'
    );

    // Add legend at bottom
    const legendY = pageHeight - 8;
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(8);
    
    const legendItems: string[] = [];
    if (options.showClimateScore) {
      legendItems.push('Clima: Verde >4 | Giallo 3-4 | Rosso <3');
    }
    if (options.showSkillGap) {
      legendItems.push('Gap: Verde <20% | Giallo 20-50% | Rosso >50%');
    }
    if (options.showHiringCount) {
      legendItems.push('Posizioni aperte indicate');
    }
    
    if (legendItems.length > 0) {
      pdf.text(legendItems.join('    |    '), margin, legendY);
    }

    // If the org chart is very tall, add additional pages
    const totalImageHeight = (canvas.height * contentWidth) / canvas.width;
    if (totalImageHeight > availableHeight * 1.5) {
      // Add a note about large chart
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Nota: organigramma scalato per adattarsi alla pagina', pageWidth - margin - 70, legendY);
    }

    // Generate filename
    const safeName = company.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Organigramma_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Download
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
