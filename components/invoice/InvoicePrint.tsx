"use client";

import { InvoiceWithItems } from "@/supabase/services/invoice-service";

interface InvoicePrintProps {
  invoice: InvoiceWithItems;
}

export function InvoicePrint({ invoice }: InvoicePrintProps) {
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

  return (
    <div className="hidden print:block bg-white p-8 max-w-[210mm] mx-auto">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">TAX INVOICE</h1>
            <p className="text-sm text-gray-600 mt-1">Original for Recipient</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Invoice No: {invoice.invoice_number}</p>
            {invoice.tax_invoice_number && (
              <p className="text-sm">Tax Invoice: {invoice.tax_invoice_number}</p>
            )}
            <p className="text-sm">Date: {formatDate(invoice.invoice_date)}</p>
          </div>
        </div>
      </div>

      {/* Seller and Buyer Details */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Seller */}
        <div className="border border-gray-300 p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">SELLER DETAILS</h3>
          <p className="font-bold text-sm">{invoice.seller_name}</p>
          {invoice.seller_gstin && (
            <p className="text-xs">GSTIN: {invoice.seller_gstin}</p>
          )}
          {invoice.seller_address && <p className="text-xs mt-1">{invoice.seller_address}</p>}
          <p className="text-xs">
            {[invoice.seller_city, invoice.seller_state, invoice.seller_pincode]
              .filter(Boolean)
              .join(", ")}
          </p>
          {invoice.seller_phone && <p className="text-xs">Phone: {invoice.seller_phone}</p>}
          {invoice.seller_email && <p className="text-xs">Email: {invoice.seller_email}</p>}
        </div>

        {/* Buyer */}
        <div className="border border-gray-300 p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">BUYER DETAILS</h3>
          <p className="font-bold text-sm">{invoice.buyer_name}</p>
          {invoice.buyer_gstin && (
            <p className="text-xs">GSTIN: {invoice.buyer_gstin}</p>
          )}
          {invoice.buyer_address && <p className="text-xs mt-1">{invoice.buyer_address}</p>}
          <p className="text-xs">
            {[invoice.buyer_city, invoice.buyer_state, invoice.buyer_pincode]
              .filter(Boolean)
              .join(", ")}
          </p>
          {invoice.buyer_phone && <p className="text-xs">Phone: {invoice.buyer_phone}</p>}
          {invoice.buyer_email && <p className="text-xs">Email: {invoice.buyer_email}</p>}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold">S.No</th>
            <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold">Description</th>
            <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold">HSN/SAC</th>
            <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold">Qty</th>
            <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold">Rate</th>
            <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold">GST %</th>
            <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item, index) => (
            <tr key={item.id || index}>
              <td className="border border-gray-300 px-2 py-2 text-xs">{index + 1}</td>
              <td className="border border-gray-300 px-2 py-2 text-xs">{item.description}</td>
              <td className="border border-gray-300 px-2 py-2 text-xs">{item.hsn_sac_code || "-"}</td>
              <td className="border border-gray-300 px-2 py-2 text-right text-xs">
                {item.quantity} {item.unit}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-right text-xs">
                {formatCurrency(Number(item.rate))}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-right text-xs">
                {item.gst_rate}%
              </td>
              <td className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold">
                {formatCurrency(Number(item.amount))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="flex justify-between text-xs py-1">
            <span>Subtotal:</span>
            <span className="font-semibold">{formatCurrency(Number(invoice.subtotal))}</span>
          </div>
          {Number(invoice.discount) > 0 && (
            <div className="flex justify-between text-xs py-1 text-green-600">
              <span>Discount:</span>
              <span>-{formatCurrency(Number(invoice.discount))}</span>
            </div>
          )}
          <div className="flex justify-between text-xs py-1">
            <span>Taxable Amount:</span>
            <span className="font-semibold">{formatCurrency(Number(invoice.taxable_amount))}</span>
          </div>
          <div className="border-t border-gray-300 my-1"></div>
          {Number(invoice.cgst) > 0 && (
            <>
              <div className="flex justify-between text-xs py-1">
                <span>CGST:</span>
                <span>{formatCurrency(Number(invoice.cgst))}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span>SGST:</span>
                <span>{formatCurrency(Number(invoice.sgst))}</span>
              </div>
            </>
          )}
          {Number(invoice.igst) > 0 && (
            <div className="flex justify-between text-xs py-1">
              <span>IGST:</span>
              <span>{formatCurrency(Number(invoice.igst))}</span>
            </div>
          )}
          <div className="flex justify-between text-xs py-1 font-semibold">
            <span>Total GST:</span>
            <span>{formatCurrency(Number(invoice.total_gst))}</span>
          </div>
          <div className="border-t-2 border-gray-800 my-2"></div>
          <div className="flex justify-between text-sm py-1 font-bold">
            <span>Grand Total:</span>
            <span>{formatCurrency(Number(invoice.grand_total))}</span>
          </div>
          <div className="flex justify-between text-xs py-1">
            <span>Amount Paid:</span>
            <span>{formatCurrency(Number(invoice.amount_paid))}</span>
          </div>
          {Number(invoice.grand_total) - Number(invoice.amount_paid) > 0 && (
            <div className="flex justify-between text-xs py-1 text-red-600 font-semibold">
              <span>Balance Due:</span>
              <span>
                {formatCurrency(Number(invoice.grand_total) - Number(invoice.amount_paid))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-600 mb-1">NOTES:</h3>
          <p className="text-xs text-gray-700">{invoice.notes}</p>
        </div>
      )}

      {/* Terms */}
      {invoice.terms_conditions && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-600 mb-1">TERMS & CONDITIONS:</h3>
          <p className="text-xs text-gray-700">{invoice.terms_conditions}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-300 pt-4 mt-8">
        <div className="flex justify-between items-end">
          <div className="text-xs text-gray-600">
            <p>Payment Mode: {invoice.payment_mode?.replace("_", " ").toUpperCase()}</p>
            <p className="capitalize">Status: {invoice.status}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 mb-8">For {invoice.seller_name}</p>
            <p className="text-xs font-semibold border-t border-gray-400 pt-1">Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* Print Info */}
      <div className="text-center text-xs text-gray-500 mt-8">
        <p>This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  );
}
