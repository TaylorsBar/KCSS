
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DiagnosticAlert, MaintenanceRecord, Listing } from '../types';

// The CartelWorx logo SVG from Sidebar.tsx, optimized for PDF with simplified colors
const LOGO_SVG = `<svg viewBox="0 0 220 50" xmlns="http://www.w3.org/2000/svg">
    <style>.cw-text{font-family:Orbitron,sans-serif;font-size:28px;font-weight:900;fill:#1E1E2D;text-anchor:middle}.cw-koru{stroke:#007FFF;stroke-width:10;stroke-linecap:round;fill:none}</style>
    <text x="110" y="32" class="cw-text">CARTELW<tspan dx="-4">O</tspan><tspan dx="4">RX</tspan></text>
    <g transform="translate(120, 18.5) scale(0.25)"><path d="M50,50 C60,50 65,40 65,35 C65,25 50,25 50,32" class="cw-koru"/></g>
</svg>`;

const addHeader = (doc: jsPDF) => {
    // Convert SVG to data URL
    const logoDataUrl = `data:image/svg+xml;base64,${btoa(LOGO_SVG)}`;
    doc.addImage(logoDataUrl, 'SVG', 15, 12, 55, 12.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor('#1E1E2D');
    doc.text('Karapiro Cartel Speed Shop', 200, 15, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor('#4A4A4A');
    doc.text('123 Performance Lane, Karapiro, NZ', 200, 20, { align: 'right' });
    doc.text('contact@cartelworx.com', 200, 25, { align: 'right' });

    doc.setDrawColor('#007FFF');
    doc.line(15, 35, 200, 35);
};

const addFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor('#888888');
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, 287, { align: 'center' });
        doc.text('Thank you for choosing Karapiro Cartel Speed Shop.', 15, 287);
    }
};

const generateDiagnosticReport = (alerts: DiagnosticAlert[], aiAnalysis: string) => {
    const doc = new jsPDF();
    
    addHeader(doc);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor('#1E1E2D');
    doc.text('Vehicle Diagnostic Report', 15, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Report generated: ${new Date().toLocaleString()}`, 15, 56);
    doc.text('Vehicle: 2022 Subaru WRX (Simulated)', 15, 62);

    // Predictive Alerts Table
    autoTable(doc, {
        startY: 75,
        head: [['Level', 'Component', 'Message']],
        body: alerts.map(alert => [alert.level, alert.component, alert.message]),
        headStyles: { fillColor: '#007FFF' },
        theme: 'grid',
    });

    // AI Analysis Section
    const lastY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('KC AI Analysis', 15, lastY + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#4A4A4A');
    const splitText = doc.splitTextToSize(aiAnalysis, 180); // 180mm width
    doc.text(splitText, 15, lastY + 22);

    addFooter(doc);
    doc.save(`CartelWorx_Diagnostic_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

const generateHealthReport = (records: MaintenanceRecord[]) => {
    const doc = new jsPDF();
    
    addHeader(doc);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor('#1E1E2D');
    doc.text('Vehicle Health & Service Report', 15, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Report generated: ${new Date().toLocaleString()}`, 15, 56);

    autoTable(doc, {
        startY: 70,
        head: [['Date', 'Service / Recommendation', 'Notes', 'Status']],
        body: records.map(log => [
            log.date,
            `${log.isAiRecommendation ? '[AI] ' : ''}${log.service}`,
            log.notes,
            log.verified ? 'Verified' : 'Pending',
        ]),
        headStyles: { fillColor: '#007FFF' },
        theme: 'grid',
    });

    addFooter(doc);
    doc.save(`CartelWorx_Health_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

const generateQuote = (listing: Listing) => {
    const doc = new jsPDF();
    
    addHeader(doc);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor('#1E1E2D');
    doc.text('QUOTE', 15, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Quote #: Q-${Date.now().toString().slice(-6)}`, 200, 50, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 200, 56, { align: 'right' });

    // Customer Info (mock)
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 15, 70);
    doc.setFont('helvetica', 'normal');
    doc.text('Customer Name', 15, 76);
    doc.text('123 Customer Street', 15, 82);

    autoTable(doc, {
        startY: 95,
        head: [['SKU', 'Description', 'Qty', 'Unit Price', 'Total']],
        body: [[
            listing.part.sku,
            `${listing.part.manufacturer} ${listing.part.name}`,
            1,
            `$${listing.price.toFixed(2)}`,
            `$${listing.price.toFixed(2)}`,
        ]],
        headStyles: { fillColor: '#007FFF' },
        theme: 'grid',
        didDrawPage: (data) => {
            // Draw totals
            const finalY = data.cursor?.y ? data.cursor.y + 10 : 200;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Total:', 150, finalY, { align: 'right' });
            doc.text(`$${listing.price.toFixed(2)}`, 200, finalY, { align: 'right' });
        }
    });

    const lastY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor('#888888');
    doc.text('Quote valid for 30 days. Prices are in USD and exclude taxes and shipping.', 15, lastY + 25);
    
    addFooter(doc);
    doc.save(`CartelWorx_Quote_${listing.part.sku}.pdf`);
};

export const pdfService = {
    generateDiagnosticReport,
    generateHealthReport,
    generateQuote,
};