
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DiagnosticAlert, MaintenanceRecord, Listing, AlertLevel } from '../types';

// The CartelWorx logo SVG - with colors updated for a dark background PDF header
const LOGO_SVG = `<svg viewBox="0 0 220 50" xmlns="http://www.w3.org/2000/svg">
    <style>.cw-text{font-family:Orbitron,sans-serif;font-size:28px;font-weight:900;fill:#FFFFFF;text-anchor:middle}.cw-koru{stroke:#00FFFF;stroke-width:10;stroke-linecap:round;fill:none}</style>
    <text x="110" y="32" class="cw-text">CARTELW<tspan dx="-4">O</tspan><tspan dx="4">RX</tspan></text>
    <g transform="translate(120, 18.5) scale(0.25)"><path d="M50,50 C60,50 65,40 65,35 C65,25 50,25 50,32" class="cw-koru"/></g>
</svg>`;

const convertSvgToPng = (svgDataUrl: string, width: number, height: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        // Render at a higher resolution for sharper PDF output
        const scale = 3;
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return reject(new Error("Could not get canvas context"));
        }

        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(err);
        img.src = svgDataUrl;
    });
};

const PAGE_MARGIN = 15;
const DOC_WIDTH = 210; // A4 width in mm

const addPageBackground = (doc: jsPDF) => {
    doc.setFillColor('#14141E'); // base-800
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
};

const addReportHeader = async (doc: jsPDF, title: string) => {
    // Full width dark header
    doc.setFillColor('#0A0A0F'); // base-900
    doc.rect(0, 0, DOC_WIDTH, 25, 'F');
    
    // Add a cyan glow/line at the bottom of the header
    doc.setDrawColor('#00FFFF'); // brand-cyan
    doc.setLineWidth(0.5);
    doc.line(0, 25, DOC_WIDTH, 25);
    doc.setDrawColor(0); // reset draw color

    const logoDataUrl = `data:image/svg+xml;base64,${btoa(LOGO_SVG)}`;
    try {
        const pngDataUrl = await convertSvgToPng(logoDataUrl, 55, 12.5);
        doc.addImage(pngDataUrl, 'PNG', PAGE_MARGIN, 6, 55, 12.5);
    } catch(error) {
        console.error("Failed to convert SVG logo for PDF:", error);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor('#FFFFFF');
        doc.text('CARTELWORX', PAGE_MARGIN, 15);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor('#FFFFFF');
    doc.text('Karapiro Cartel Speed Shop', DOC_WIDTH - PAGE_MARGIN, 10, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor('#AAAAAA');
    doc.text('123 Performance Lane, Karapiro, NZ', DOC_WIDTH - PAGE_MARGIN, 15, { align: 'right' });
    doc.text('contact@cartelworx.com', DOC_WIDTH - PAGE_MARGIN, 19, { align: 'right' });

    // Main Title Section
    doc.setTextColor('#FFFFFF');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(title, PAGE_MARGIN, 40);
};

const addReportFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const footerY = doc.internal.pageSize.getHeight() - 20;

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        // Full width dark footer
        doc.setFillColor('#0A0A0F'); // base-900
        doc.rect(0, footerY, DOC_WIDTH, 20, 'F');
        // Cyan line separator
        doc.setDrawColor('#00FFFF');
        doc.setLineWidth(0.5);
        doc.line(0, footerY, DOC_WIDTH, footerY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor('#AAAAAA');
        doc.text('Thank you for choosing Karapiro Cartel Speed Shop.', PAGE_MARGIN, footerY + 10);
        doc.text(`Page ${i} of ${pageCount}`, DOC_WIDTH - PAGE_MARGIN, footerY + 10, { align: 'right' });
    }
};

const baseTableStyles = {
    // FIX: Use 'as const' to ensure TypeScript infers the literal type 'plain' instead of 'string'.
    theme: 'plain' as const,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    styles: {
        fillColor: '#0A0A0F',
        textColor: '#E0E0E0',
        lineColor: '#1E1E2D',
        lineWidth: 0.1,
    },
    headStyles: { 
        fillColor: '#1E1E2D',
        textColor: '#00FFFF',
// FIX: Specify literal types for fontStyle and halign to match jspdf-autotable's expected types.
        fontStyle: 'bold' as const,
        halign: 'center' as const,
    },
    alternateRowStyles: { 
        fillColor: '#14141E',
    },
};


const generateDiagnosticReport = async (alerts: DiagnosticAlert[], aiAnalysis: string) => {
    const doc = new jsPDF();
    addPageBackground(doc);
    
    await addReportHeader(doc, 'Vehicle Diagnostic Report');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#AAAAAA');
    doc.text(`Report generated: ${new Date().toLocaleString()}`, PAGE_MARGIN, 50);
    doc.text('Vehicle: 2022 Subaru WRX (Simulated)', PAGE_MARGIN, 56);

    // Predictive Alerts Table
    autoTable(doc, {
        ...baseTableStyles,
        startY: 65,
        head: [['Level', 'Component', 'Message']],
        body: alerts.map(alert => [alert.level, alert.component, alert.message]),
        didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 0) {
                const level = data.cell.raw as AlertLevel;
                let color = '#007FFF'; // Info
                if (level === AlertLevel.Critical) color = '#FF0000'; // Critical
                if (level === AlertLevel.Warning) color = '#FFA500'; // Warning
                
                doc.setFillColor(color);
                doc.roundedRect(data.cell.x + 4, data.cell.y + 2, data.cell.width - 8, data.cell.height - 4, 3, 3, 'F');
                
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor('#FFFFFF');
                doc.text(level, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
                    align: 'center',
                    baseline: 'middle'
                });
            }
        }
    });

    // AI Analysis Section
    const lastY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor('#FFFFFF');
    doc.text('KC AI Analysis', PAGE_MARGIN, lastY + 15);

    const textX = PAGE_MARGIN;
    const textY = lastY + 20;
    const textWidth = DOC_WIDTH - (PAGE_MARGIN * 2);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#E0E0E0');
    const splitText = doc.splitTextToSize(aiAnalysis, textWidth - 10);
    const textHeight = doc.getTextDimensions(splitText).h + 10;

    doc.setFillColor('#14141E');
    doc.setDrawColor('#00FFFF');
    doc.setLineWidth(0.2);
    doc.roundedRect(textX, textY, textWidth, textHeight, 3, 3, 'FD');
    doc.text(splitText, textX + 5, textY + 8);

    addReportFooter(doc);
    doc.save(`CartelWorx_Diagnostic_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

const generateHealthReport = async (records: MaintenanceRecord[]) => {
    const doc = new jsPDF();
    addPageBackground(doc);
    
    await addReportHeader(doc, 'Vehicle Health & Service Report');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#AAAAAA');
    doc.text(`Report generated: ${new Date().toLocaleString()}`, PAGE_MARGIN, 50);

    const body = records.map(log => {
        const serviceText = log.isAiRecommendation ? `[AI] ${log.service}` : log.service;
        return [log.date, serviceText, log.notes, log.verified ? 'Verified' : 'Pending'];
    });

    autoTable(doc, {
        ...baseTableStyles,
        startY: 65,
        head: [['Date', 'Service / Recommendation', 'Notes', 'Status']],
        body: body,
        didParseCell: (data) => {
            if (data.section === 'body') {
                if (data.column.index === 3) {
                    data.cell.styles.fontStyle = 'bold';
                    if (data.cell.raw === 'Verified') {
                        data.cell.styles.textColor = '#00FF00';
                    } else {
                        data.cell.styles.textColor = '#FFA500';
                    }
                }
                if (data.column.index === 1 && (data.cell.raw as string).startsWith('[AI]')) {
                    data.cell.styles.textColor = '#00FFFF';
                }
            }
        }
    });

    addReportFooter(doc);
    doc.save(`CartelWorx_Health_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

const generateQuote = async (listing: Listing) => {
    const doc = new jsPDF();
    addPageBackground(doc);

    await addReportHeader(doc, 'QUOTE');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#AAAAAA');
    doc.text(`Quote #: Q-${Date.now().toString().slice(-6)}`, DOC_WIDTH - PAGE_MARGIN, 50, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, DOC_WIDTH - PAGE_MARGIN, 56, { align: 'right' });

    doc.setTextColor('#FFFFFF');
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', PAGE_MARGIN, 70);
    doc.setFont('helvetica', 'normal');
    doc.text('Valued Customer', PAGE_MARGIN, 76);
    doc.text('123 Customer Street, Anytown', PAGE_MARGIN, 82);

    autoTable(doc, {
        ...baseTableStyles,
        startY: 95,
        head: [['SKU', 'Description', 'Qty', 'Unit Price', 'Total']],
        body: [[
            listing.part.sku,
            `${listing.part.manufacturer} ${listing.part.name}`,
            1,
            `$${listing.price.toFixed(2)}`,
            `$${listing.price.toFixed(2)}`,
        ]],
        didDrawPage: (data) => {
            const finalY = data.cursor?.y ? data.cursor.y + 10 : 200;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor('#FFFFFF');
            doc.text('Total:', 150, finalY, { align: 'right' });
            doc.text(`$${listing.price.toFixed(2)}`, DOC_WIDTH - PAGE_MARGIN, finalY, { align: 'right' });
        }
    });

    const lastY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor('#888888');
    doc.text('Quote valid for 30 days. Prices are in USD and exclude taxes and shipping.', PAGE_MARGIN, lastY + 25);
    
    addReportFooter(doc);
    doc.save(`CartelWorx_Quote_${listing.part.sku}.pdf`);
};

export const pdfService = {
    generateDiagnosticReport,
    generateHealthReport,
    generateQuote,
};
