import { InvoiceWithItems } from "@/supabase/services/invoice-service";
import { printInvoicePDF, downloadInvoicePDF } from "./invoice-pdf";

// Print invoice - opens PDF in new tab with print dialog
export function printInvoice(invoice: InvoiceWithItems) {
  printInvoicePDF(invoice);
}

// Download invoice as PDF
export function downloadInvoice(invoice: InvoiceWithItems) {
  downloadInvoicePDF(invoice);
}

// Legacy HTML function (kept for backward compatibility)
export function downloadInvoiceHTML(invoice: InvoiceWithItems) {
  // Use PDF download instead
  downloadInvoicePDF(invoice);
}

// Legacy HTML generation function
export function generateInvoiceHTML(invoice: InvoiceWithItems): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 210mm; margin: 0 auto; }
    .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
    .header-content { display: flex; justify-content: space-between; }
    .header h1 { font-size: 24px; }
    .header-right { text-align: right; font-size: 12px; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .detail-box { border: 1px solid #ccc; padding: 10px; }
    .detail-box h3 { font-size: 10px; color: #666; margin-bottom: 5px; }
    .detail-box p { font-size: 11px; margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 11px; }
    th { background-color: #f0f0f0; font-weight: bold; }
    .text-right { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
    .totals-row.bold { font-weight: bold; font-size: 13px; }
    .border-top { border-top: 1px solid #ccc; margin: 5px 0; }
    .border-top-thick { border-top: 2px solid #000; margin: 10px 0; }
    .footer { border-top: 1px solid #ccc; padding-top: 15px; margin-top: 30px; display: flex; justify-content: space-between; }
    .signature { text-align: right; }
    .signature p { font-size: 11px; margin-bottom: 40px; }
    .signature .line { border-top: 1px solid #666; padding-top: 5px; font-size: 11px; font-weight: bold; }
    @media print {
      body { padding: 0; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-content">
      <div>
        <h1>TAX INVOICE</h1>
        <p style="font-size: 11px; color: #666;">Original for Recipient</p>
      </div>
      <div class="header-right">
        <p><strong>Invoice No:</strong> ${invoice.invoice_number}</p>
        ${invoice.tax_invoice_number ? `<p><strong>Tax Invoice:</strong> ${invoice.tax_invoice_number}</p>` : ''}
        <p><strong>Date:</strong> ${formatDate(invoice.invoice_date)}</p>
      </div>
    </div>
  </div>

  <div class="details">
    <div class="detail-box">
      <h3>SELLER DETAILS</h3>
      <p><strong>${invoice.seller_name}</strong></p>
      ${invoice.seller_gstin ? `<p>GSTIN: ${invoice.seller_gstin}</p>` : ''}
      ${invoice.seller_address ? `<p>${invoice.seller_address}</p>` : ''}
      <p>${[invoice.seller_city, invoice.seller_state, invoice.seller_pincode].filter(Boolean).join(", ")}</p>
      ${invoice.seller_phone ? `<p>Phone: ${invoice.seller_phone}</p>` : ''}
      ${invoice.seller_email ? `<p>Email: ${invoice.seller_email}</p>` : ''}
    </div>
    <div class="detail-box">
      <h3>BUYER DETAILS</h3>
      <p><strong>${invoice.buyer_name}</strong></p>
      ${invoice.buyer_gstin ? `<p>GSTIN: ${invoice.buyer_gstin}</p>` : ''}
      ${invoice.buyer_address ? `<p>${invoice.buyer_address}</p>` : ''}
      <p>${[invoice.buyer_city, invoice.buyer_state, invoice.buyer_pincode].filter(Boolean).join(", ")}</p>
      ${invoice.buyer_phone ? `<p>Phone: ${invoice.buyer_phone}</p>` : ''}
      ${invoice.buyer_email ? `<p>Email: ${invoice.buyer_email}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>S.No</th>
        <th>Description</th>
        <th>HSN/SAC</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Rate</th>
        <th class="text-right">GST %</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items?.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.description}</td>
          <td>${item.hsn_sac_code || '-'}</td>
          <td class="text-right">${item.quantity} ${item.unit}</td>
          <td class="text-right">${formatCurrency(Number(item.rate))}</td>
          <td class="text-right">${item.gst_rate}%</td>
          <td class="text-right"><strong>${formatCurrency(Number(item.amount))}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span><strong>${formatCurrency(Number(invoice.subtotal))}</strong></span>
    </div>
    ${Number(invoice.discount) > 0 ? `
    <div class="totals-row" style="color: green;">
      <span>Discount:</span>
      <span>-${formatCurrency(Number(invoice.discount))}</span>
    </div>
    ` : ''}
    <div class="totals-row">
      <span>Taxable Amount:</span>
      <span><strong>${formatCurrency(Number(invoice.taxable_amount))}</strong></span>
    </div>
    <div class="border-top"></div>
    ${Number(invoice.cgst) > 0 ? `
    <div class="totals-row">
      <span>CGST:</span>
      <span>${formatCurrency(Number(invoice.cgst))}</span>
    </div>
    <div class="totals-row">
      <span>SGST:</span>
      <span>${formatCurrency(Number(invoice.sgst))}</span>
    </div>
    ` : ''}
    ${Number(invoice.igst) > 0 ? `
    <div class="totals-row">
      <span>IGST:</span>
      <span>${formatCurrency(Number(invoice.igst))}</span>
    </div>
    ` : ''}
    <div class="totals-row">
      <span>Total GST:</span>
      <span><strong>${formatCurrency(Number(invoice.total_gst))}</strong></span>
    </div>
    <div class="border-top-thick"></div>
    <div class="totals-row bold">
      <span>Grand Total:</span>
      <span>${formatCurrency(Number(invoice.grand_total))}</span>
    </div>
    <div class="totals-row">
      <span>Amount Paid:</span>
      <span>${formatCurrency(Number(invoice.amount_paid))}</span>
    </div>
    ${Number(invoice.grand_total) - Number(invoice.amount_paid) > 0 ? `
    <div class="totals-row" style="color: red; font-weight: bold;">
      <span>Balance Due:</span>
      <span>${formatCurrency(Number(invoice.grand_total) - Number(invoice.amount_paid))}</span>
    </div>
    ` : ''}
  </div>

  ${invoice.notes ? `
  <div style="margin: 20px 0;">
    <h3 style="font-size: 11px; color: #666; margin-bottom: 5px;">NOTES:</h3>
    <p style="font-size: 11px;">${invoice.notes}</p>
  </div>
  ` : ''}

  ${invoice.terms_conditions ? `
  <div style="margin: 20px 0;">
    <h3 style="font-size: 11px; color: #666; margin-bottom: 5px;">TERMS & CONDITIONS:</h3>
    <p style="font-size: 11px;">${invoice.terms_conditions}</p>
  </div>
  ` : ''}

  <div class="footer">
    <div style="font-size: 11px; color: #666;">
      <p>Payment Mode: ${invoice.payment_mode?.replace("_", " ").toUpperCase()}</p>
      <p style="text-transform: capitalize;">Status: ${invoice.status}</p>
    </div>
    <div class="signature">
      <p style="color: #666;">For ${invoice.seller_name}</p>
      <p class="line">Authorized Signatory</p>
    </div>
  </div>

  <div style="text-align: center; font-size: 10px; color: #999; margin-top: 30px;">
    <p>This is a computer-generated invoice and does not require a signature.</p>
  </div>
</body>
</html>
  `;
}
