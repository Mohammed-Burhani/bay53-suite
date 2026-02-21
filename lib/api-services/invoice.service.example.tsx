// =====================================================
// EXAMPLE USAGE OF INVOICE SERVICE WITH TANSTACK QUERY
// =====================================================

import { 
  useInvoices,
  useInvoicesByType,
  useInvoicesByStatus,
  useInvoice, 
  useCreateInvoice, 
  useUpdateInvoice,
  useUpdateInvoiceWithItems,
  useDeleteInvoice,
  useNextInvoiceNumber,
  useInvoiceSummaries,
  useInvoiceTotals,
  useSalesTotals,
  usePurchaseTotals,
  useOutstandingBalance,
  useSalesReceivables,
  usePurchasePayables,
  useUpdateInvoiceStatus,
  useUpdatePayment,
  usePrefetchInvoice,
  usePrefetchInvoicesByType,
} from './invoice.service';

// =====================================================
// 1. FETCH INVOICES LIST - Multiple Ways
// =====================================================

// All invoices
function AllInvoicesList() {
  const { data: invoices, isLoading } = useInvoices();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {invoices?.map(invoice => (
        <div key={invoice.id}>{invoice.invoice_number}</div>
      ))}
    </div>
  );
}

// Invoices by type
function SalesInvoicesList() {
  const { data: salesInvoices } = useInvoicesByType('sale');
  
  return (
    <div>
      {salesInvoices?.map(invoice => (
        <div key={invoice.id}>{invoice.invoice_number}</div>
      ))}
    </div>
  );
}

// Invoices by status
function UnpaidInvoicesList() {
  const { data: unpaidInvoices } = useInvoicesByStatus('unpaid');
  
  return (
    <div>
      {unpaidInvoices?.map(invoice => (
        <div key={invoice.id}>
          {invoice.invoice_number} - ₹{invoice.grand_total}
        </div>
      ))}
    </div>
  );
}

// Filtered invoices with search
function FilteredInvoicesList() {
  const { data: invoices } = useInvoices({
    type: 'sale',
    status: 'paid',
    limit: 20,
    search: 'INV-2025'
  });

  return (
    <div>
      {invoices?.map(invoice => (
        <div key={invoice.id}>
          {invoice.invoice_number} - {invoice.buyer_name}
        </div>
      ))}
    </div>
  );
}

// =====================================================
// 2. FETCH SINGLE INVOICE
// =====================================================

function InvoiceDetail({ id }: { id: string }) {
  const { data: invoice, isLoading } = useInvoice(id);

  if (isLoading) return <div>Loading...</div>;
  if (!invoice) return <div>Invoice not found</div>;

  return (
    <div>
      <h2>{invoice.invoice_number}</h2>
      <p>Buyer: {invoice.buyer_name}</p>
      <p>Total: ₹{invoice.grand_total}</p>
      
      <h3>Items:</h3>
      {invoice.items.map(item => (
        <div key={item.id}>
          {item.description} - Qty: {item.quantity} - ₹{item.amount}
        </div>
      ))}
    </div>
  );
}

// =====================================================
// 3. CREATE NEW INVOICE
// =====================================================

function CreateInvoiceForm() {
  const createInvoice = useCreateInvoice();
  const { data: nextNumber } = useNextInvoiceNumber('INV', 2025);

  const handleSubmit = async () => {
    try {
      const result = await createInvoice.mutateAsync({
        invoice: {
          invoice_number: nextNumber || 'INV-2025-0001',
          type: 'sale',
          status: 'draft',
          invoice_date: new Date().toISOString().split('T')[0],
          
          seller_name: 'My Business',
          seller_gstin: '27AAAAA0000A1Z5',
          seller_city: 'Mumbai',
          seller_state: 'Maharashtra',
          
          buyer_name: 'Customer Name',
          buyer_gstin: '27BBBBB1111B1Z5',
          buyer_city: 'Mumbai',
          buyer_state: 'Maharashtra',
          
          subtotal: 1000,
          discount: 0,
          taxable_amount: 1000,
          cgst: 90,
          sgst: 90,
          igst: 0,
          total_gst: 180,
          grand_total: 1180,
          amount_paid: 0,
          
          column_config: [
            { id: 'sno', label: 'S.No', enabled: true },
            { id: 'description', label: 'Description', enabled: true },
            { id: 'quantity', label: 'Quantity', enabled: true },
            { id: 'rate', label: 'Rate', enabled: true },
            { id: 'amount', label: 'Amount', enabled: true }
          ]
        },
        items: [
          {
            item_order: 1,
            description: 'Product 1',
            hsn_sac_code: '8517',
            quantity: 10,
            unit: 'Pcs',
            rate: 100,
            gst_rate: 18,
            amount: 1000,
            custom_data: {}
          }
        ]
      });
      
      console.log('Invoice created:', result);
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  return (
    <button 
      onClick={handleSubmit}
      disabled={createInvoice.isPending}
    >
      {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
    </button>
  );
}

// =====================================================
// 4. UPDATE INVOICE
// =====================================================

function UpdateInvoiceButton({ id }: { id: string }) {
  const updateInvoice = useUpdateInvoice();

  const handleUpdate = async () => {
    try {
      await updateInvoice.mutateAsync({
        id,
        updates: {
          buyer_name: 'Updated Customer Name',
          notes: 'Updated notes'
        }
      });
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  return (
    <button onClick={handleUpdate} disabled={updateInvoice.isPending}>
      Update Invoice
    </button>
  );
}

// =====================================================
// 5. UPDATE INVOICE WITH ITEMS
// =====================================================

function UpdateInvoiceWithItemsButton({ id }: { id: string }) {
  const updateInvoiceWithItems = useUpdateInvoiceWithItems();

  const handleUpdate = async () => {
    try {
      await updateInvoiceWithItems.mutateAsync({
        id,
        invoice: {
          subtotal: 2000,
          grand_total: 2360
        },
        items: [
          {
            item_order: 1,
            description: 'Updated Product 1',
            quantity: 20,
            unit: 'Pcs',
            rate: 100,
            gst_rate: 18,
            amount: 2000
          }
        ]
      });
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  return (
    <button onClick={handleUpdate} disabled={updateInvoiceWithItems.isPending}>
      Update Invoice & Items
    </button>
  );
}

// =====================================================
// 6. DELETE INVOICE
// =====================================================

function DeleteInvoiceButton({ id }: { id: string }) {
  const deleteInvoice = useDeleteInvoice();

  const handleDelete = async () => {
    if (!confirm('Are you sure?')) return;
    
    try {
      await deleteInvoice.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <button onClick={handleDelete} disabled={deleteInvoice.isPending}>
      Delete Invoice
    </button>
  );
}

// =====================================================
// 7. UPDATE INVOICE STATUS
// =====================================================

function UpdateStatusButton({ id }: { id: string }) {
  const updateStatus = useUpdateInvoiceStatus();

  const handleStatusChange = async (status: 'paid' | 'unpaid' | 'partial') => {
    try {
      await updateStatus.mutateAsync({ id, status });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div>
      <button onClick={() => handleStatusChange('paid')}>Mark as Paid</button>
      <button onClick={() => handleStatusChange('unpaid')}>Mark as Unpaid</button>
      <button onClick={() => handleStatusChange('partial')}>Mark as Partial</button>
    </div>
  );
}

// =====================================================
// 8. UPDATE PAYMENT
// =====================================================

function UpdatePaymentButton({ id }: { id: string }) {
  const updatePayment = useUpdatePayment();

  const handlePayment = async () => {
    try {
      await updatePayment.mutateAsync({
        id,
        amount_paid: 1180,
        payment_mode: 'upi',
        status: 'paid'
      });
    } catch (error) {
      console.error('Failed to update payment:', error);
    }
  };

  return (
    <button onClick={handlePayment} disabled={updatePayment.isPending}>
      Record Payment
    </button>
  );
}

// =====================================================
// 9. GET INVOICE SUMMARIES
// =====================================================

function InvoiceSummariesList() {
  const { data: summaries } = useInvoiceSummaries({
    type: 'sale',
    limit: 10
  });

  return (
    <div>
      {summaries?.map(summary => (
        <div key={summary.id}>
          {summary.invoice_number} - Items: {summary.item_count} - Balance: ₹{summary.balance_due}
        </div>
      ))}
    </div>
  );
}

// =====================================================
// 10. GET TOTALS AND OUTSTANDING - Simplified
// =====================================================

function DashboardStats() {
  // Using specific hooks for better readability
  const { data: salesTotals } = useSalesTotals();
  const { data: purchaseTotals } = usePurchaseTotals();
  const { data: receivables } = useSalesReceivables();
  const { data: payables } = usePurchasePayables();

  return (
    <div>
      <div>Total Sales: ₹{salesTotals}</div>
      <div>Total Purchases: ₹{purchaseTotals}</div>
      <div>Receivables: ₹{receivables}</div>
      <div>Payables: ₹{payables}</div>
    </div>
  );
}

// With date range
function MonthlyStats() {
  const startDate = '2025-01-01';
  const endDate = '2025-01-31';
  
  const { data: monthlySales } = useSalesTotals(startDate, endDate);
  const { data: monthlyPurchases } = usePurchaseTotals(startDate, endDate);

  return (
    <div>
      <div>January Sales: ₹{monthlySales}</div>
      <div>January Purchases: ₹{monthlyPurchases}</div>
    </div>
  );
}

// =====================================================
// 11. PREFETCH FOR BETTER UX
// =====================================================

function InvoiceListWithPrefetch() {
  const { data: invoices } = useInvoices({ limit: 20 });
  const prefetchInvoice = usePrefetchInvoice();

  return (
    <div>
      {invoices?.map(invoice => (
        <div 
          key={invoice.id}
          onMouseEnter={() => prefetchInvoice(invoice.id!)}
        >
          {invoice.invoice_number}
        </div>
      ))}
    </div>
  );
}

// Prefetch by type on tab hover
function InvoiceTabsWithPrefetch() {
  const prefetchByType = usePrefetchInvoicesByType();

  return (
    <div>
      <button onMouseEnter={() => prefetchByType('sale')}>
        Sales
      </button>
      <button onMouseEnter={() => prefetchByType('purchase')}>
        Purchases
      </button>
    </div>
  );
}

export {
  AllInvoicesList,
  SalesInvoicesList,
  UnpaidInvoicesList,
  FilteredInvoicesList,
  InvoiceDetail,
  CreateInvoiceForm,
  UpdateInvoiceButton,
  UpdateInvoiceWithItemsButton,
  DeleteInvoiceButton,
  UpdateStatusButton,
  UpdatePaymentButton,
  InvoiceSummariesList,
  DashboardStats,
  MonthlyStats,
  InvoiceListWithPrefetch,
  InvoiceTabsWithPrefetch,
};
