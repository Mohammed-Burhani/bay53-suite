import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceWithItems } from '@/supabase/services/invoice-service';

export function generateInvoicePDF(invoice: InvoiceWithItems) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Check if this is a tax invoice
  if (invoice.invoice_status === 'tax-invoice') {
    return generateTaxInvoicePDF(invoice, doc, pageWidth, pageHeight);
  }

  // Regular invoice generation
  return generateRegularInvoicePDF(invoice, doc, pageWidth, pageHeight);
}

function generateRegularInvoicePDF(
  invoice: InvoiceWithItems,
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number
) {

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    const formatted = amount.toFixed(2);
    // Add thousand separators manually
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `Rs. ${parts.join('.')}`;
  };

  // Helper function to format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get enabled columns from invoice column_config or use defaults
  const enabledColumns = (invoice.column_config && invoice.column_config.length > 0)
    ? invoice.column_config.filter(col => col.enabled)
    : [
        { id: "sno", label: "S.No" },
        { id: "description", label: "Description" },
        { id: "quantity", label: "Quantity" },
        { id: "weight", label: "Weight (kg)" },
        { id: "rate", label: "Rate" },
        { id: "amount", label: "Amount" },
      ];

  // Debug logging
  console.log('=== PDF Generation Debug ===');
  console.log('Invoice ID:', invoice.id);
  console.log('Invoice items:', invoice.items);
  console.log('Items count:', invoice.items?.length);
  console.log('Column config:', invoice.column_config);
  console.log('Enabled columns:', enabledColumns);
  console.log('===========================');

  // Header with gradient background
  doc.setFillColor(79, 70, 229); // Primary color
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('StockBuddy', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Inventory & Billing', 14, 27);

  // TAX INVOICE label
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth - 14, 20, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Original for Recipient', pageWidth - 14, 27, { align: 'right' });

  // Invoice details box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(pageWidth - 70, 50, 56, 25, 2, 2, 'F');
  
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No:', pageWidth - 68, 57);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoice_number, pageWidth - 68, 62);
  
  if (invoice.tax_invoice_number) {
    doc.setFont('helvetica', 'bold');
    doc.text('Tax Invoice:', pageWidth - 68, 67);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.tax_invoice_number, pageWidth - 68, 72);
  }

  // Date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 14, 57);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.invoice_date), 14, 62);

  // Seller and Buyer boxes
  const boxY = 85;
  const boxHeight = 40;
  const boxWidth = (pageWidth - 32) / 2;

  // Seller box
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, boxY, boxWidth, boxHeight, 2, 2);
  
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(14, boxY, boxWidth, 8, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM (SELLER)', 17, boxY + 5);

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(8);
  let yPos = boxY + 13;
  
  // Name
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Name:', 17, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(invoice.seller_name, 32, yPos);
  yPos += 4;
  
  // GSTIN
  if (invoice.seller_gstin) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('GSTIN:', 17, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(invoice.seller_gstin, 32, yPos);
    yPos += 4;
  }
  
  // Address
  if (invoice.seller_address) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Address:', 17, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    const addressLines = doc.splitTextToSize(invoice.seller_address, boxWidth - 20);
    doc.text(addressLines, 17, yPos + 4);
    yPos += 4 + (addressLines.length * 3);
  }
  
  // Location
  const sellerLocation = [invoice.seller_city, invoice.seller_state, invoice.seller_pincode]
    .filter(Boolean)
    .join(', ');
  if (sellerLocation) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(sellerLocation, 17, yPos);
    yPos += 4;
  }
  
  // Phone
  if (invoice.seller_phone) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Phone:', 17, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(invoice.seller_phone, 32, yPos);
  }

  // Buyer box
  const buyerX = 14 + boxWidth + 4;
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(buyerX, boxY, boxWidth, boxHeight, 2, 2);
  
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(buyerX, boxY, boxWidth, 8, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TO (BUYER)', buyerX + 3, boxY + 5);

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(8);
  yPos = boxY + 13;
  
  // Name
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Name:', buyerX + 3, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(invoice.buyer_name, buyerX + 18, yPos);
  yPos += 4;
  
  // GSTIN
  if (invoice.buyer_gstin) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('GSTIN:', buyerX + 3, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(invoice.buyer_gstin, buyerX + 18, yPos);
    yPos += 4;
  }
  
  // Address
  if (invoice.buyer_address) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Address:', buyerX + 3, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    const addressLines = doc.splitTextToSize(invoice.buyer_address, boxWidth - 20);
    doc.text(addressLines, buyerX + 3, yPos + 4);
    yPos += 4 + (addressLines.length * 3);
  }
  
  // Location
  const buyerLocation = [invoice.buyer_city, invoice.buyer_state, invoice.buyer_pincode]
    .filter(Boolean)
    .join(', ');
  if (buyerLocation) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(buyerLocation, buyerX + 3, yPos);
    yPos += 4;
  }
  
  // Phone
  if (invoice.buyer_phone) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Phone:', buyerX + 3, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(invoice.buyer_phone, buyerX + 18, yPos);
  }

  // Items table
  const tableStartY = boxY + boxHeight + 10;
  
  // Build table headers and data based on enabled columns
  const headers: string[] = [];
  const columnIds: string[] = [];
  
  enabledColumns.forEach(col => {
    headers.push(col.label);
    columnIds.push(col.id);
  });
  
  // Ensure we have items
  const items = invoice.items || [];
  console.log('Processing items for table:', items.length);
  
  const tableData = items.map((item, index) => {
    console.log(`Item ${index}:`, item);
    const row: string[] = [];
    columnIds.forEach(colId => {
      switch (colId) {
        case 'sno':
          row.push((index + 1).toString());
          break;
        case 'description':
          row.push(item.description || '');
          break;
        case 'hsn':
          row.push(item.hsn_sac_code || '-');
          break;
        case 'quantity':
          row.push(`${item.quantity} ${item.unit}`);
          break;
        case 'weight':
          row.push(item.weight ? `${item.weight} kg` : '-');
          break;
        case 'rate':
          row.push(formatCurrency(Number(item.rate)));
          break;
        case 'gst':
          row.push(`${item.gst_rate}%`);
          break;
        case 'amount':
          row.push(formatCurrency(Number(item.amount)));
          break;
        default:
          // Custom column
          if (item.custom_data && item.custom_data[colId]) {
            row.push(String(item.custom_data[colId]));
          } else {
            row.push('-');
          }
      }
    });
    return row;
  });
  
  console.log('Table data rows:', tableData.length);
  console.log('Table data:', tableData);

  console.log('Calling autoTable with:', {
    startY: tableStartY,
    headers,
    rowCount: tableData.length
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [31, 41, 55],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
  });

  // Get the final Y position after table
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Totals section
  const totalsX = pageWidth - 80;
  let totalsY = finalY;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);

  // Subtotal
  doc.text('Subtotal:', totalsX, totalsY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(formatCurrency(Number(invoice.subtotal)), pageWidth - 14, totalsY, { align: 'right' });
  totalsY += 5;

  // Discount
  if (Number(invoice.discount) > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text('Discount:', totalsX, totalsY);
    doc.setFont('helvetica', 'bold');
    doc.text(`- ${formatCurrency(Number(invoice.discount))}`, pageWidth - 14, totalsY, { align: 'right' });
    totalsY += 5;
  }

  // Taxable Amount
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Taxable Amount:', totalsX, totalsY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(formatCurrency(Number(invoice.taxable_amount)), pageWidth - 14, totalsY, { align: 'right' });
  totalsY += 7;

  // GST breakdown
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(totalsX, totalsY, pageWidth - 14, totalsY);
  totalsY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);

  if (Number(invoice.cgst) > 0) {
    doc.text('CGST:', totalsX, totalsY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(formatCurrency(Number(invoice.cgst)), pageWidth - 14, totalsY, { align: 'right' });
    totalsY += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('SGST:', totalsX, totalsY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(formatCurrency(Number(invoice.sgst)), pageWidth - 14, totalsY, { align: 'right' });
    totalsY += 4;
  }

  if (Number(invoice.igst) > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('IGST:', totalsX, totalsY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(formatCurrency(Number(invoice.igst)), pageWidth - 14, totalsY, { align: 'right' });
    totalsY += 4;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Total GST:', totalsX, totalsY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(formatCurrency(Number(invoice.total_gst)), pageWidth - 14, totalsY, { align: 'right' });
  totalsY += 7;

  // Grand Total
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.line(totalsX, totalsY, pageWidth - 14, totalsY);
  totalsY += 6;

  doc.setFillColor(79, 70, 229);
  doc.roundedRect(totalsX - 2, totalsY - 5, 68, 8, 1, 1, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', totalsX, totalsY);
  doc.text(formatCurrency(Number(invoice.grand_total)), pageWidth - 16, totalsY, { align: 'right' });

  // Notes
  if (invoice.notes) {
    const notesY = Math.max(totalsY + 10, finalY + 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text('NOTES:', 14, notesY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(8);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 28);
    doc.text(splitNotes, 14, notesY + 5);
  }

  // Footer
  const footerY = pageHeight - 25;
  
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(14, footerY, pageWidth - 14, footerY);

  // Signature
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text(`For ${invoice.seller_name}`, pageWidth - 14, footerY + 5, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text('Authorized Signatory', pageWidth - 14, footerY + 15, { align: 'right' });
  doc.line(pageWidth - 60, footerY + 13, pageWidth - 14, footerY + 13);

  // Footer note
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'This is a computer-generated invoice and does not require a signature.',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc;
}

// Tax Invoice PDF Generation (Different Format for Consolidated Invoices)
function generateTaxInvoicePDF(
  invoice: InvoiceWithItems,
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number
) {
  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    const formatted = amount.toFixed(2);
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `Rs. ${parts.join('.')}`;
  };

  // Helper function to format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Header with gradient background
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.seller_name || 'StockBuddy', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Courier & Logistics', 14, 27);

  // TAX INVOICE label
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth - 14, 20, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Consolidated Invoice', pageWidth - 14, 27, { align: 'right' });

  // Invoice details box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(pageWidth - 70, 50, 56, 20, 2, 2, 'F');
  
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No:', pageWidth - 68, 57);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoice_number, pageWidth - 68, 62);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', pageWidth - 68, 67);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.invoice_date), pageWidth - 68, 72);

  // Billed To section
  const billedToY = 80;
  const billedToBoxHeight = 45; // Increased height for more content
  
  // Draw box for billed to
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, billedToY - 5, 100, billedToBoxHeight, 2, 2);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text('BILLED TO:', 17, billedToY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(invoice.buyer_name, 17, billedToY + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  let yPos = billedToY + 10;
  
  if (invoice.buyer_gstin) {
    doc.text(`GSTIN: ${invoice.buyer_gstin}`, 17, yPos);
    yPos += 4;
  }
  if (invoice.buyer_address) {
    // Wrap address text
    const addressLines = doc.splitTextToSize(invoice.buyer_address, 90);
    doc.text(addressLines, 17, yPos);
    yPos += (addressLines.length * 4);
  }
  const buyerLocation = [invoice.buyer_city, invoice.buyer_state, invoice.buyer_pincode]
    .filter(Boolean)
    .join(', ');
  if (buyerLocation) {
    const locationLines = doc.splitTextToSize(buyerLocation, 90);
    doc.text(locationLines, 17, yPos);
    yPos += (locationLines.length * 4);
  }
  if (invoice.buyer_phone) {
    doc.text(`Phone: ${invoice.buyer_phone}`, 17, yPos);
  }

  // Items table with tax invoice format
  const tableStartY = billedToY + billedToBoxHeight + 10;
  
  // Prepare table data from items
  const tableData = (invoice.items || []).map((item, index) => {
    const customData = item.custom_data || {};
    return [
      (index + 1).toString(),
      customData.original_invoice_date || '-',
      customData.original_invoice_number || '-',
      item.description || '-',
      customData.from || invoice.seller_name,
      customData.to || invoice.buyer_name,
      item.weight ? `${item.weight} kg` : '-',
      formatCurrency(Number(item.amount)),
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [['S.No', 'Date', 'Bill No', 'Invoice No', 'From', 'To', 'Weight', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [31, 41, 55],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'left', cellWidth: 30 },
      4: { halign: 'left', cellWidth: 30 },
      5: { halign: 'left', cellWidth: 30 },
      6: { halign: 'right', cellWidth: 18 },
      7: { halign: 'right', cellWidth: 26, fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
  });

  // Get the final Y position after table
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Totals section
  const totalsX = pageWidth - 80;
  let totalsY = finalY;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);

  // Subtotal
  doc.text('Subtotal:', totalsX, totalsY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(formatCurrency(Number(invoice.subtotal)), pageWidth - 14, totalsY, { align: 'right' });
  totalsY += 7;

  // GST breakdown
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(totalsX, totalsY, pageWidth - 14, totalsY);
  totalsY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);

  if (Number(invoice.cgst) > 0) {
    doc.text('CGST:', totalsX, totalsY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(formatCurrency(Number(invoice.cgst)), pageWidth - 14, totalsY, { align: 'right' });
    totalsY += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('SGST:', totalsX, totalsY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(formatCurrency(Number(invoice.sgst)), pageWidth - 14, totalsY, { align: 'right' });
    totalsY += 4;
  }

  if (Number(invoice.igst) > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('IGST:', totalsX, totalsY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(formatCurrency(Number(invoice.igst)), pageWidth - 14, totalsY, { align: 'right' });
    totalsY += 4;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Total GST:', totalsX, totalsY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(formatCurrency(Number(invoice.total_gst)), pageWidth - 14, totalsY, { align: 'right' });
  totalsY += 7;

  // Grand Total
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.line(totalsX, totalsY, pageWidth - 14, totalsY);
  totalsY += 6;

  doc.setFillColor(79, 70, 229);
  doc.roundedRect(totalsX - 2, totalsY - 5, 68, 8, 1, 1, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', totalsX, totalsY);
  doc.text(formatCurrency(Number(invoice.grand_total)), pageWidth - 16, totalsY, { align: 'right' });

  // Notes
  if (invoice.notes) {
    const notesY = Math.max(totalsY + 15, finalY + 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text('NOTES:', 14, notesY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(8);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 28);
    doc.text(splitNotes, 14, notesY + 5);
  }

  // Footer
  const footerY = pageHeight - 25;
  
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(14, footerY, pageWidth - 14, footerY);

  // Signature
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text(`For ${invoice.seller_name}`, pageWidth - 14, footerY + 5, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text('Authorized Signatory', pageWidth - 14, footerY + 15, { align: 'right' });
  doc.line(pageWidth - 60, footerY + 13, pageWidth - 14, footerY + 13);

  // Footer note
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'This is a computer-generated invoice and does not require a signature.',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc;
}

export function downloadInvoicePDF(invoice: InvoiceWithItems) {
  const doc = generateInvoicePDF(invoice);
  doc.save(`invoice-${invoice.invoice_number}.pdf`);
}

export function printInvoicePDF(invoice: InvoiceWithItems) {
  const doc = generateInvoicePDF(invoice);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}
