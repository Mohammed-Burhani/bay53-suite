import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceWithItems } from '@/supabase/services/invoice-service';

export function generateInvoicePDF(invoice: InvoiceWithItems) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

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
  
  const tableData = invoice.items?.map((item, index) => [
    (index + 1).toString(),
    item.description,
    item.hsn_sac_code || '-',
    `${item.quantity} ${item.unit}`,
    formatCurrency(Number(item.rate)),
    `${item.gst_rate}%`,
    formatCurrency(Number(item.amount)),
  ]) || [];

  autoTable(doc, {
    startY: tableStartY,
    head: [['S.No', 'Description', 'HSN/SAC', 'Qty', 'Rate', 'GST %', 'Amount']],
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
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 60 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'right', cellWidth: 27, fontStyle: 'bold' },
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
  totalsY += 8;

  // Amount Paid
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Amount Paid:', totalsX, totalsY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(formatCurrency(Number(invoice.amount_paid)), pageWidth - 14, totalsY, { align: 'right' });
  totalsY += 5;

  // Balance Due
  const balanceDue = Number(invoice.grand_total) - Number(invoice.amount_paid);
  if (balanceDue > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(239, 68, 68);
    doc.text('Balance Due:', totalsX, totalsY);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(balanceDue), pageWidth - 14, totalsY, { align: 'right' });
  }

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
  const footerY = pageHeight - 30;
  
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(14, footerY, pageWidth - 14, footerY);

  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Mode: ${invoice.payment_mode?.replace('_', ' ').toUpperCase()}`, 14, footerY + 5);
  doc.text(`Status: ${invoice.status?.toUpperCase()}`, 14, footerY + 10);

  // Signature
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
