"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  HelpCircle, 
  FileText, 
  Users, 
  Package, 
  Calculator,
  CheckCircle2,
  Info,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InvoiceGuideProps {
  mode: 'create' | 'edit' | 'list';
}

export function InvoiceGuide({ mode }: InvoiceGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
      >
        <HelpCircle className="h-4 w-4" />
        Quick Guide
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="rounded-lg bg-indigo-100 p-2">
                <Info className="h-5 w-5 text-indigo-600" />
              </div>
              {mode === 'create' && 'Creating Your Invoice'}
              {mode === 'edit' && 'Editing Your Invoice'}
              {mode === 'list' && 'Managing Your Invoices'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create' && 'Follow these steps to create a GST-compliant invoice'}
              {mode === 'edit' && 'Learn how to modify your invoice details'}
              {mode === 'list' && 'Understand all the features available for managing invoices'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(85vh-140px)] pr-4">
            {mode === 'create' && <CreateGuide />}
            {mode === 'edit' && <EditGuide />}
            {mode === 'list' && <ListGuide />}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateGuide() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 p-4 rounded-lg bg-linear-to-r from-indigo-50 to-blue-50 border border-indigo-100">
        <div className="rounded-full bg-indigo-500 p-2 h-fit">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground mb-2">1. Invoice Details</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Invoice number is auto-generated. Add tax invoice number if needed. Select the invoice date.
          </p>
        </div>
      </div>

      <div className="flex gap-4 p-4 rounded-lg bg-linear-to-r from-blue-50 to-purple-50 border border-blue-100">
        <div className="rounded-full bg-blue-500 p-2 h-fit">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground mb-2">2. From & To Details</p>
          <p className="text-muted-foreground text-sm leading-relaxed mb-2">
            Fill in seller (your business) and buyer (customer) information.
          </p>
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <Sparkles className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-900 mb-1">Pro Tip</p>
              <p className="text-xs text-amber-800">
                Start typing to see suggestions from previous invoices. Click to auto-fill all details instantly!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 p-4 rounded-lg bg-linear-to-r from-purple-50 to-pink-50 border border-purple-100">
        <div className="rounded-full bg-purple-500 p-2 h-fit">
          <Package className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground mb-2">3. Add Items</p>
          <p className="text-muted-foreground text-sm leading-relaxed mb-2">
            Add products/services with quantity, rate, and GST. You can add up to 8 items per invoice.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-muted-foreground">Description</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-muted-foreground">Quantity & Unit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-muted-foreground">Rate per unit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-muted-foreground">GST percentage</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 p-4 rounded-lg bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-100">
        <div className="rounded-full bg-emerald-500 p-2 h-fit">
          <Calculator className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground mb-2">4. Review & Save</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            GST is calculated automatically based on seller and buyer states. Review the summary and click &ldquo;Create Invoice&rdquo; to save.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-linear-to-r from-indigo-500 to-purple-500 text-white rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Ready to Start?</p>
            <p className="text-sm text-indigo-50">
              Use the autocomplete feature to save time. The system remembers your previous entries and auto-fills everything for you!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditGuide() {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-100">
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          You can edit all invoice details except the invoice number. Changes are saved when you click &ldquo;Update Invoice&rdquo;.
        </p>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Modify Items</p>
              <p className="text-xs text-muted-foreground">Change quantities, rates, or add/remove items</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Update Party Information</p>
              <p className="text-xs text-muted-foreground">Modify seller or buyer details as needed</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Adjust Payment Details</p>
              <p className="text-xs text-muted-foreground">Update payment mode, amount paid, and status</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900 mb-1">Important Note</p>
            <p className="text-xs text-amber-800">
              Invoice numbers cannot be changed after creation to maintain compliance and audit trail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListGuide() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 p-4 rounded-lg bg-linear-to-r from-purple-50 to-pink-50 border border-purple-100">
        <div className="rounded-full bg-purple-500 p-2 h-fit">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground mb-2">Generate Tax Invoice</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Consolidates multiple pending invoices from the same sender into one tax invoice. Perfect for courier/logistics businesses.
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <span className="text-muted-foreground">Groups invoices by sender name</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <span className="text-muted-foreground">Creates consolidated tax invoice</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <span className="text-muted-foreground">Marks originals as &ldquo;Ready&rdquo;</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 p-4 rounded-lg bg-linear-to-r from-blue-50 to-cyan-50 border border-blue-100">
        <div className="rounded-full bg-blue-500 p-2 h-fit">
          <Package className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground mb-2">Invoice Actions</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-blue-700">🖨️</span>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Print</p>
                <p className="text-xs text-muted-foreground">Print invoice directly</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-blue-700">📥</span>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Download</p>
                <p className="text-xs text-muted-foreground">Save as PDF</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-blue-700">✏️</span>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Edit</p>
                <p className="text-xs text-muted-foreground">Modify details</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-blue-700">👁️</span>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">View</p>
                <p className="text-xs text-muted-foreground">See full details</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 p-4 rounded-lg bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-100">
        <div className="rounded-full bg-emerald-500 p-2 h-fit">
          <Calculator className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground mb-3">Invoice Status</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant="destructive" className="text-xs">Pending</Badge>
              <span className="text-xs text-muted-foreground">Not yet processed</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">Ready</Badge>
              <span className="text-xs text-muted-foreground">Processed, ready for tax invoice</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="default" className="text-xs">Tax Invoice</Badge>
              <span className="text-xs text-muted-foreground">Final consolidated invoice</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
