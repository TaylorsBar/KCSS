


import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DiagnosticAlert, MaintenanceRecord, Listing } from '../types/index';

// --- THEME & STYLING ---

const theme = {
    BG: '#0A0A0F',
    TEXT_PRIMARY: '#E2E8F0',
    TEXT_SECONDARY: '#A0AEC0',
    ACCENT: '#00FFFF',
    TABLE_HEAD_BG: '#14141E',
    TABLE_ROW_ALT_BG: '#101015',
    TABLE_LINE: '#1E1E2D',
};

// New high-fidelity, dark-theme-friendly logo
const LOGO_SVG_DARK = `<svg viewBox="0 0 220 50" xmlns="http://www.w3.org/2000/svg">
    <style>.cw-text{font-family:Orbitron,sans-serif;font-size:28px;font-weight:900;fill:#E0E0E0;text-anchor:middle}.cw-koru{stroke:#00FFFF;stroke-width:10;stroke-linecap:round;fill:none}</style>
    <text x="110" y="32" class="cw-text">CARTELW<tspan dx="-4">O</tspan><tspan dx="4">RX</tspan></text>
    <g transform="translate(120, 18.5) scale(0.25)"><path d="M50,50 C60,50 65,40 65,35 C65,25 50,25 50,32" class="cw-koru"/></g>
</svg>`;


// --- UTILITY FUNCTIONS ---

const convertSvgToPng = (svgDataUrl: string, width: number, height: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const scale = 3; // Render at 3x for high-DPI output
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Could not get canvas context"));

        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(err);
        img.src = svgDataUrl;
    });
};

const addPageLayout = async (doc: jsPDF, title: string) => {
    // Background
    doc.setFillColor(theme.BG);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

    // Header
    const logoDataUrl = `data:image/svg+xml;base64,${btoa(LOGO_SVG_DARK)}`;
    try {
        const pngDataUrl = await convertSvgToPng(logoDataUrl, 55, 12.5);
        doc.addImage(pngDataUrl, 'PNG', 15, 12, 55, 12.5);
    } catch(error) {
        console.error("Failed to convert SVG logo to PNG for PDF:", error);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(theme.TEXT_PRIMARY);
        doc.text('CartelWorx', 15, 20);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(theme.ACCENT);
    doc.text(title, 200, 15, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(theme.TEXT_SECONDARY);
    doc.text('Karapiro Cartel Speed Shop', 200, 20, { align: 'right' });

    doc.setDrawColor(theme.ACCENT);
    doc.setLineWidth(0.2);
    doc.line(15, 35, 200, 35);
};

const addFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(theme.TEXT_SECONDARY);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, 287, { align: 'center' });
        doc.text(`Report generated: ${new Date().toLocaleString()}`, 15, 287);
    }
};

const getTableStyles = () => ({
    headStyles: {
        fillColor: theme.TABLE_HEAD_BG,
        textColor: theme.ACCENT,
        // FIX: The type of 'fontStyle' was inferred as 'string', which is not assignable to type 'FontStyle'. Using 'as const' asserts the literal type 'bold'.
        fontStyle: 'bold' as const,
        lineColor: theme.TABLE_LINE,
        lineWidth: 0.1,
    },
    bodyStyles: {
        textColor: theme.TEXT_PRIMARY,
        lineColor: theme.TABLE_LINE,
        lineWidth: 0.1,
    },
    alternateRowStyles: {
        fillColor: theme.TABLE_ROW_ALT_BG,
    },
    theme: 'grid' as const,
    didDrawPage: (data: any) => {
        // This hook is called after a page is drawn.
        // TODO: For multi-page tables, the header/logo should be re-drawn here.
        // The background for new pages is not currently handled and will be white.
    }
});

// --- PDF GENERATION FUNCTIONS ---

const generateDiagnosticReport = async (alerts: DiagnosticAlert[], aiAnalysis: string) => {
    const doc = new jsPDF();
    await addPageLayout(doc, 'Diagnostic Report');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(theme.TEXT_PRIMARY);
    doc.text('Vehicle Diagnostic Report', 15, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(theme.TEXT_SECONDARY);
    doc.text('Vehicle: 2022 Subaru WRX (Simulated)', 15, 56);

    autoTable(doc, {
        startY: 70,
        head: [['Level', 'Component', 'Message']],
        body: alerts.map(alert => [alert.level, alert.component, alert.message]),
        ...getTableStyles(),
    });

    const lastY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(theme.ACCENT);
    doc.text('KC AI Analysis', 15, lastY + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(theme.TEXT_PRIMARY);
    const splitText = doc.splitTextToSize(aiAnalysis, 180);
    doc.text(splitText, 15, lastY + 22);

    addFooter(doc);
    doc.save(`CartelWorx_Diagnostic_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

const generateHealthReport = async (records: MaintenanceRecord[]) => {
    const doc = new jsPDF();
    await addPageLayout(doc, 'Health & Service Report');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(theme.TEXT_PRIMARY);
    doc.text('Vehicle Health & Service Report', 15, 50);

    autoTable(doc, {
        startY: 65,
        head: [['Date', 'Service / Recommendation', 'Notes', 'Status']],
        body: records.map(log => [
            log.date,
            `${log.isAiRecommendation ? '[AI] ' : ''}${log.service}`,
            log.notes,
            log.verified ? 'Verified' : 'Pending',
        ]),
        ...getTableStyles(),
    });

    addFooter(doc);
    doc.save(`CartelWorx_Health_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

const generateQuote = async (listing: Listing) => {
    const doc = new jsPDF();
    await addPageLayout(doc, 'Quote');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(theme.ACCENT);
    doc.text('QUOTE', 15, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(theme.TEXT_SECONDARY);
    doc.text(`Quote #: Q-${Date.now().toString().slice(-6)}`, 200, 50, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 200, 56, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(theme.TEXT_PRIMARY);
    doc.text('Bill To:', 15, 70);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(theme.TEXT_SECONDARY);
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
        ...getTableStyles(),
        didDrawPage: (data) => {
            // Re-apply header on new pages if table spans
            if (data.pageNumber > 1) {
                // This is async, which can be tricky. For now, we'll just redraw the text parts.
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(theme.ACCENT);
                doc.text('Quote', 200, 15, { align: 'right' });
            }
        },
        didParseCell: (data) => {
            // Right-align currency columns
            if (data.column.index >= 3) {
                data.cell.styles.halign = 'right';
            }
        }
    });

    const lastY = (doc as any).lastAutoTable.finalY;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(theme.TEXT_PRIMARY);
    doc.text('Total:', 150, lastY + 15, { align: 'right' });
    doc.setTextColor(theme.ACCENT);
    doc.text(`$${listing.price.toFixed(2)}`, 200, lastY + 15, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(theme.TEXT_SECONDARY);
    doc.text('Quote valid for 30 days. Prices are in USD and exclude taxes and shipping.', 15, 270);
    
    addFooter(doc);
    doc.save(`CartelWorx_Quote_${listing.part.sku}.pdf`);
};

export const pdfService = {
    generateDiagnosticReport,
    generateHealthReport,
    generateQuote,
};