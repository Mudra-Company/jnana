import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { OrgChartExportOptions } from '../types/orgChartExport';
import type { CompanyProfile, User } from '../../types';

export async function exportOrgChartToPdf(
  container: HTMLElement,
  company: CompanyProfile,
  options: OrgChartExportOptions
): Promise<void> {
  try {
    // Capture the rendered chart
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
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

    // Add header
    pdf.setFillColor(99, 102, 241); // Indigo
    pdf.rect(0, 0, pageWidth, headerHeight, 'F');
    
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

    // If image is too tall, scale down
    if (imgHeight > availableHeight) {
      imgHeight = availableHeight;
      imgWidth = imgHeight * imgAspectRatio;
    }

    // Center the image horizontally
    const xOffset = (pageWidth - imgWidth) / 2;
    const yOffset = headerHeight + 5;

    // Add chart image
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      xOffset,
      yOffset,
      imgWidth,
      imgHeight
    );

    // Add legend at bottom
    const legendY = pageHeight - 10;
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(8);
    
    let legendItems: string[] = [];
    if (options.showClimateScore) {
      legendItems.push('🔴 Clima <3  |  🟡 Clima 3-4  |  🟢 Clima >4');
    }
    if (options.showHiringCount) {
      legendItems.push('🔍 Posizioni Hiring');
    }
    
    if (legendItems.length > 0) {
      pdf.text(legendItems.join('    '), margin, legendY);
    }

    // If the org chart is very large, we might need multiple pages
    if (canvas.height > canvas.width * 1.5) {
      // Chart is very tall, might need pagination
      console.log('Large org chart detected, single page export with scaling');
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
