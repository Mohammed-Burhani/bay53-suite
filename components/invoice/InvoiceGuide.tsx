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
  Sparkles,
  Languages
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/lib/contexts/language-context";
import { useGoogleTranslate } from "@/lib/hooks/use-google-translate";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface InvoiceGuideProps {
  mode: 'create' | 'edit' | 'list';
}

export function InvoiceGuide({ mode }: InvoiceGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  const buttonText = useGoogleTranslate('Quick Guide', language);
  const titleText = useGoogleTranslate(
    mode === 'create' ? 'Creating Your Invoice' : 
    mode === 'edit' ? 'Editing Your Invoice' : 
    'Managing Your Invoices',
    language
  );
  const descriptionText = useGoogleTranslate(
    mode === 'create' ? 'Follow these steps to create a GST-compliant invoice' :
    mode === 'edit' ? 'Learn how to modify your invoice details' :
    'Understand all the features available for managing invoices',
    language
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
      >
        <HelpCircle className="h-4 w-4" />
        {buttonText.translatedText}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={`max-h-[85vh] max-w-2xl ${language === 'TA' ? 'text-[0.9em]' : ''}`}>
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <DialogTitle className={`flex items-center gap-2 ${language === 'TA' ? 'text-lg' : 'text-xl'} flex-1`}>
                <div className="rounded-lg bg-indigo-100 p-2 shrink-0">
                  <Info className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="wrap-break-word">{titleText.translatedText}</span>
              </DialogTitle>
              <ToggleGroup 
                type="single" 
                value={language} 
                onValueChange={(value) => value && setLanguage(value as 'EN' | 'TA')}
                className="gap-1 shrink-0"
              >
                <ToggleGroupItem 
                  value="EN" 
                  aria-label="English"
                  className="h-8 px-3 text-xs data-[state=on]:bg-indigo-100 data-[state=on]:text-indigo-700"
                >
                  <Languages className="h-3 w-3 mr-1" />
                  EN
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="TA" 
                  aria-label="Tamil"
                  className="h-8 px-3 text-xs data-[state=on]:bg-indigo-100 data-[state=on]:text-indigo-700"
                >
                  <Languages className="h-3 w-3 mr-1" />
                  TA
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <DialogDescription className={language === 'TA' ? 'text-xs' : 'text-sm'}>
              {descriptionText.translatedText}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(85vh-140px)] pr-4">
            {mode === 'create' && <CreateGuide language={language} />}
            {mode === 'edit' && <EditGuide language={language} />}
            {mode === 'list' && <ListGuide language={language} />}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateGuide({ language }: { language: string }) {
  const isTamil = language === 'TA';
  const step1Title = useGoogleTranslate('1. Invoice Details', language);
  const step1Desc = useGoogleTranslate('Invoice number is auto-generated. Add tax invoice number if needed. Select the invoice date.', language);
  
  const step2Title = useGoogleTranslate('2. From & To Details', language);
  const step2Desc = useGoogleTranslate('Fill in seller (your business) and buyer (customer) information.', language);
  const proTipLabel = useGoogleTranslate('Pro Tip', language);
  const proTipText = useGoogleTranslate('Start typing to see suggestions from previous invoices. Click to auto-fill all details instantly!', language);
  
  const step3Title = useGoogleTranslate('3. Add Items', language);
  const step3Desc = useGoogleTranslate('Add products/services with quantity, rate, and GST. You can add up to 8 items per invoice.', language);
  const descriptionLabel = useGoogleTranslate('Description', language);
  const quantityLabel = useGoogleTranslate('Quantity & Unit', language);
  const rateLabel = useGoogleTranslate('Rate per unit', language);
  const gstLabel = useGoogleTranslate('GST percentage', language);
  
  const step4Title = useGoogleTranslate('4. Review & Save', language);
  const step4Desc = useGoogleTranslate('GST is calculated automatically based on seller and buyer states. Review the summary and click "Create Invoice" to save.', language);
  
  const readyTitle = useGoogleTranslate('Ready to Start?', language);
  const readyDesc = useGoogleTranslate('Use the autocomplete feature to save time. The system remembers your previous entries and auto-fills everything for you!', language);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 p-3 rounded-lg bg-linear-to-r from-indigo-50 to-blue-50 border border-indigo-100">
        <div className="rounded-full bg-indigo-500 p-2 h-fit shrink-0">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-foreground mb-1.5 ${isTamil ? 'text-sm' : 'text-base'}`}>{step1Title.translatedText}</p>
          <p className={`text-muted-foreground leading-relaxed ${isTamil ? 'text-xs' : 'text-sm'}`}>
            {step1Desc.translatedText}
          </p>
        </div>
      </div>

      <div className="flex gap-3 p-3 rounded-lg bg-linear-to-r from-blue-50 to-purple-50 border border-blue-100">
        <div className="rounded-full bg-blue-500 p-2 h-fit shrink-0">
          <Users className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-foreground mb-1.5 ${isTamil ? 'text-sm' : 'text-base'}`}>{step2Title.translatedText}</p>
          <p className={`text-muted-foreground leading-relaxed mb-2 ${isTamil ? 'text-xs' : 'text-sm'}`}>
            {step2Desc.translatedText}
          </p>
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className={`font-medium text-amber-900 mb-0.5 ${isTamil ? 'text-[10px]' : 'text-xs'}`}>{proTipLabel.translatedText}</p>
              <p className={`text-amber-800 ${isTamil ? 'text-[10px]' : 'text-xs'}`}>
                {proTipText.translatedText}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 p-3 rounded-lg bg-linear-to-r from-purple-50 to-pink-50 border border-purple-100">
        <div className="rounded-full bg-purple-500 p-2 h-fit shrink-0">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-foreground mb-1.5 ${isTamil ? 'text-sm' : 'text-base'}`}>{step3Title.translatedText}</p>
          <p className={`text-muted-foreground leading-relaxed mb-2 ${isTamil ? 'text-xs' : 'text-sm'}`}>
            {step3Desc.translatedText}
          </p>
          <div className={`grid grid-cols-2 gap-2 ${isTamil ? 'text-[10px]' : 'text-xs'}`}>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
              <span className="text-muted-foreground truncate">{descriptionLabel.translatedText}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
              <span className="text-muted-foreground truncate">{quantityLabel.translatedText}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
              <span className="text-muted-foreground truncate">{rateLabel.translatedText}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
              <span className="text-muted-foreground truncate">{gstLabel.translatedText}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 p-3 rounded-lg bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-100">
        <div className="rounded-full bg-emerald-500 p-2 h-fit shrink-0">
          <Calculator className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-foreground mb-1.5 ${isTamil ? 'text-sm' : 'text-base'}`}>{step4Title.translatedText}</p>
          <p className={`text-muted-foreground leading-relaxed ${isTamil ? 'text-xs' : 'text-sm'}`}>
            {step4Desc.translatedText}
          </p>
        </div>
      </div>

      <div className="mt-6 p-3 bg-linear-to-r from-indigo-500 to-purple-500 text-white rounded-lg">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className={`font-semibold mb-1 ${isTamil ? 'text-sm' : 'text-base'}`}>{readyTitle.translatedText}</p>
            <p className={`text-indigo-50 ${isTamil ? 'text-xs' : 'text-sm'}`}>
              {readyDesc.translatedText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditGuide({ language }: { language: string }) {
  const isTamil = language === 'TA';
  const introText = useGoogleTranslate('You can edit all invoice details except the invoice number. Changes are saved when you click "Update Invoice".', language);
  const modifyItemsTitle = useGoogleTranslate('Modify Items', language);
  const modifyItemsDesc = useGoogleTranslate('Change quantities, rates, or add/remove items', language);
  const updatePartyTitle = useGoogleTranslate('Update Party Information', language);
  const updatePartyDesc = useGoogleTranslate('Modify seller or buyer details as needed', language);
  const adjustPaymentTitle = useGoogleTranslate('Adjust Payment Details', language);
  const adjustPaymentDesc = useGoogleTranslate('Update payment mode, amount paid, and status', language);
  const importantNote = useGoogleTranslate('Important Note', language);
  const noteText = useGoogleTranslate('Invoice numbers cannot be changed after creation to maintain compliance and audit trail.', language);

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-100">
        <p className={`text-muted-foreground leading-relaxed mb-3 ${isTamil ? 'text-xs' : 'text-sm'}`}>
          {introText.translatedText}
        </p>
        
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-md border border-gray-100">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className={`font-medium text-foreground mb-0.5 ${isTamil ? 'text-xs' : 'text-sm'}`}>{modifyItemsTitle.translatedText}</p>
              <p className={`text-muted-foreground ${isTamil ? 'text-[10px]' : 'text-xs'}`}>{modifyItemsDesc.translatedText}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-md border border-gray-100">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className={`font-medium text-foreground mb-0.5 ${isTamil ? 'text-xs' : 'text-sm'}`}>{updatePartyTitle.translatedText}</p>
              <p className={`text-muted-foreground ${isTamil ? 'text-[10px]' : 'text-xs'}`}>{updatePartyDesc.translatedText}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-md border border-gray-100">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className={`font-medium text-foreground mb-0.5 ${isTamil ? 'text-xs' : 'text-sm'}`}>{adjustPaymentTitle.translatedText}</p>
              <p className={`text-muted-foreground ${isTamil ? 'text-[10px]' : 'text-xs'}`}>{adjustPaymentDesc.translatedText}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className={`font-medium text-amber-900 mb-0.5 ${isTamil ? 'text-xs' : 'text-sm'}`}>{importantNote.translatedText}</p>
            <p className={`text-amber-800 ${isTamil ? 'text-[10px]' : 'text-xs'}`}>
              {noteText.translatedText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListGuide({ language }: { language: string }) {
  const isTamil = language === 'TA';
  const taxInvoiceTitle = useGoogleTranslate('Generate Tax Invoice', language);
  const taxInvoiceDesc = useGoogleTranslate('Consolidates multiple pending invoices from the same sender into one tax invoice. Perfect for courier/logistics businesses.', language);
  const groupsText = useGoogleTranslate('Groups invoices by sender name', language);
  const createsText = useGoogleTranslate('Creates consolidated tax invoice', language);
  const marksText = useGoogleTranslate('Marks originals as "Ready"', language);
  
  const actionsTitle = useGoogleTranslate('Invoice Actions', language);
  const printLabel = useGoogleTranslate('Print', language);
  const printDesc = useGoogleTranslate('Print invoice directly', language);
  const downloadLabel = useGoogleTranslate('Download', language);
  const downloadDesc = useGoogleTranslate('Save as PDF', language);
  const editLabel = useGoogleTranslate('Edit', language);
  const editDesc = useGoogleTranslate('Modify details', language);
  const viewLabel = useGoogleTranslate('View', language);
  const viewDesc = useGoogleTranslate('See full details', language);
  
  const statusTitle = useGoogleTranslate('Invoice Status', language);
  const pendingLabel = useGoogleTranslate('Pending', language);
  const pendingDesc = useGoogleTranslate('Not yet processed', language);
  const readyLabel = useGoogleTranslate('Ready', language);
  const readyDesc = useGoogleTranslate('Processed, ready for tax invoice', language);
  const taxInvoiceLabel = useGoogleTranslate('Tax Invoice', language);
  const taxInvoiceStatusDesc = useGoogleTranslate('Final consolidated invoice', language);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 p-3 rounded-lg bg-linear-to-r from-purple-50 to-pink-50 border border-purple-100">
        <div className="rounded-full bg-purple-500 p-2 h-fit shrink-0">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-foreground mb-1.5 ${isTamil ? 'text-sm' : 'text-base'}`}>{taxInvoiceTitle.translatedText}</p>
          <p className={`text-muted-foreground leading-relaxed ${isTamil ? 'text-xs' : 'text-sm'}`}>
            {taxInvoiceDesc.translatedText}
          </p>
          <div className={`mt-2.5 space-y-1 ${isTamil ? 'text-[10px]' : 'text-xs'}`}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></div>
              <span className="text-muted-foreground">{groupsText.translatedText}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></div>
              <span className="text-muted-foreground">{createsText.translatedText}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></div>
              <span className="text-muted-foreground">{marksText.translatedText}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 p-3 rounded-lg bg-linear-to-r from-blue-50 to-cyan-50 border border-blue-100">
        <div className="rounded-full bg-blue-500 p-2 h-fit shrink-0">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-foreground mb-2 ${isTamil ? 'text-sm' : 'text-base'}`}>{actionsTitle.translatedText}</p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-start gap-1.5">
              <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-medium text-blue-700">🖨️</span>
              </div>
              <div className="min-w-0">
                <p className={`font-medium text-foreground ${isTamil ? 'text-[10px]' : 'text-xs'}`}>{printLabel.translatedText}</p>
                <p className={`text-muted-foreground ${isTamil ? 'text-[9px]' : 'text-[10px]'}`}>{printDesc.translatedText}</p>
              </div>
            </div>
            <div className="flex items-start gap-1.5">
              <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-medium text-blue-700">📥</span>
              </div>
              <div className="min-w-0">
                <p className={`font-medium text-foreground ${isTamil ? 'text-[10px]' : 'text-xs'}`}>{downloadLabel.translatedText}</p>
                <p className={`text-muted-foreground ${isTamil ? 'text-[9px]' : 'text-[10px]'}`}>{downloadDesc.translatedText}</p>
              </div>
            </div>
            <div className="flex items-start gap-1.5">
              <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-medium text-blue-700">✏️</span>
              </div>
              <div className="min-w-0">
                <p className={`font-medium text-foreground ${isTamil ? 'text-[10px]' : 'text-xs'}`}>{editLabel.translatedText}</p>
                <p className={`text-muted-foreground ${isTamil ? 'text-[9px]' : 'text-[10px]'}`}>{editDesc.translatedText}</p>
              </div>
            </div>
            <div className="flex items-start gap-1.5">
              <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-medium text-blue-700">👁️</span>
              </div>
              <div className="min-w-0">
                <p className={`font-medium text-foreground ${isTamil ? 'text-[10px]' : 'text-xs'}`}>{viewLabel.translatedText}</p>
                <p className={`text-muted-foreground ${isTamil ? 'text-[9px]' : 'text-[10px]'}`}>{viewDesc.translatedText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 p-3 rounded-lg bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-100">
        <div className="rounded-full bg-emerald-500 p-2 h-fit shrink-0">
          <Calculator className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-foreground mb-2.5 ${isTamil ? 'text-sm' : 'text-base'}`}>{statusTitle.translatedText}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Badge variant="destructive" className={isTamil ? 'text-[10px]' : 'text-xs'}>{pendingLabel.translatedText}</Badge>
              <span className={`text-muted-foreground ${isTamil ? 'text-[10px]' : 'text-xs'}`}>{pendingDesc.translatedText}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Badge variant="secondary" className={isTamil ? 'text-[10px]' : 'text-xs'}>{readyLabel.translatedText}</Badge>
              <span className={`text-muted-foreground ${isTamil ? 'text-[10px]' : 'text-xs'}`}>{readyDesc.translatedText}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Badge variant="default" className={isTamil ? 'text-[10px]' : 'text-xs'}>{taxInvoiceLabel.translatedText}</Badge>
              <span className={`text-muted-foreground ${isTamil ? 'text-[10px]' : 'text-xs'}`}>{taxInvoiceStatusDesc.translatedText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
