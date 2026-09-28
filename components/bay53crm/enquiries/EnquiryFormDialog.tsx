"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Building2, ClipboardList, Wrench, Package } from "lucide-react";
import { useCRMMasterValues } from "@/lib/hooks/useCRM";
import { useCRMSalesDocsStore } from "@/lib/stores/crm-sales-docs-store";
import {
  ENQUIRY_PRIORITIES,
  UNITS,
  addDays,
  type EnquiryPriority,
  type EnquiryRequirement,
} from "@/lib/bay53crm/sales-docs";

interface EnquiryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  customerName: "",
  contactPerson: "",
  designation: "",
  phone: "",
  email: "",
  customerState: "",
  regionId: "",
  subject: "",
  vertical: "",
  source: "",
  priority: "Medium" as EnquiryPriority,
  assignedTo: "",
  estimatedValue: "",
  date: today(),
  responseDue: addDays(today(), 5),
  projectLocation: "",
  consultant: "",
  disciplines: [] as string[],
  details: "",
});

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b pb-1.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export function EnquiryFormDialog({ open, onOpenChange }: EnquiryFormDialogProps) {
  const addEnquiry = useCRMSalesDocsStore((s) => s.addEnquiry);
  const { data: regions = [] } = useCRMMasterValues("region");
  const { data: verticals = [] } = useCRMMasterValues("vertical");
  const { data: sources = [] } = useCRMMasterValues("lead_source");
  const { data: assignedTos = [] } = useCRMMasterValues("assigned_to");
  const { data: states = [] } = useCRMMasterValues("customer_state");
  const { data: disciplines = [] } = useCRMMasterValues("brand_approval_discipline");

  const [form, setForm] = useState(emptyForm);
  const [requirements, setRequirements] = useState<EnquiryRequirement[]>([]);

  const set = <K extends keyof ReturnType<typeof emptyForm>>(key: K, value: ReturnType<typeof emptyForm>[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleDiscipline = (d: string, checked: boolean) =>
    set("disciplines", checked ? [...form.disciplines, d] : form.disciplines.filter((x) => x !== d));

  const updateRequirement = (index: number, patch: Partial<EnquiryRequirement>) =>
    setRequirements((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const isValid = form.customerName.trim() && form.contactPerson.trim() && form.subject.trim();

  const handleClose = (next: boolean) => {
    if (!next) {
      setForm(emptyForm());
      setRequirements([]);
    }
    onOpenChange(next);
  };

  const handleSubmit = () => {
    if (!isValid) return;
    const enquiry = addEnquiry({
      ...form,
      customerName: form.customerName.trim(),
      contactPerson: form.contactPerson.trim(),
      subject: form.subject.trim(),
      estimatedValue: Number(form.estimatedValue) || 0,
      status: "New",
      requirements: requirements.filter((r) => r.item.trim()),
      attachments: [],
      activities: [{ date: form.date, by: form.assignedTo || "Admin", note: `Enquiry logged via ${form.source || "direct entry"}.` }],
    });
    toast.success(`Enquiry ${enquiry.enquiryNo} created`);
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Enquiry</DialogTitle>
          <DialogDescription>Capture the customer requirement. You can raise a quotation from it later.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
          <Section icon={Building2} title="Customer Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input value={form.customerName} onChange={(e) => set("customerName", e.target.value)} placeholder="Company name" />
              </div>
              <div className="space-y-2">
                <Label>Contact Person *</Label>
                <Input value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} placeholder="Contact name" />
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. Project Manager" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98xxx xxxxx" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@company.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={form.customerState} onValueChange={(v) => set("customerState", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {states.map((s) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select value={form.regionId} onValueChange={(v) => set("regionId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.id} value={r.code || r.name}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Section>

          <Section icon={ClipboardList} title="Enquiry Details">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="e.g. Tower B – HVAC & Ventilation Package" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Vertical</Label>
                <Select value={form.vertical} onValueChange={(v) => set("vertical", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {verticals.map((v) => (
                      <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => set("source", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {sources.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => set("priority", v as EnquiryPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENQUIRY_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Enquiry Date</Label>
                <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Response Due</Label>
                <Input type="date" value={form.responseDue} onChange={(e) => set("responseDue", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Estimated Value (₹)</Label>
                <Input type="number" value={form.estimatedValue} onChange={(e) => set("estimatedValue", e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select value={form.assignedTo} onValueChange={(v) => set("assignedTo", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {assignedTos.map((a) => (
                      <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Consultant / Architect</Label>
                <Input value={form.consultant} onChange={(e) => set("consultant", e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label>Project Location</Label>
                <Input value={form.projectLocation} onChange={(e) => set("projectLocation", e.target.value)} placeholder="Area, City" />
              </div>
            </div>
          </Section>

          <Section icon={Wrench} title="Scope of Work">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {disciplines.map((d) => (
                <label key={d.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted/40">
                  <Checkbox
                    checked={form.disciplines.includes(d.name)}
                    onCheckedChange={(c) => toggleDiscipline(d.name, c === true)}
                  />
                  {d.name}
                </label>
              ))}
            </div>
          </Section>

          <Section icon={Package} title="Requirement Items">
            {requirements.length === 0 ? (
              <p className="text-xs text-muted-foreground">No items added. Add key items from the customer&apos;s BOQ (optional).</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_140px_90px_90px_32px] gap-2 text-[11px] font-medium text-muted-foreground">
                  <span>Item</span><span>Discipline</span><span>Qty</span><span>Unit</span><span />
                </div>
                {requirements.map((r, i) => (
                  <div key={i} className="grid grid-cols-[1fr_140px_90px_90px_32px] gap-2">
                    <Input value={r.item} onChange={(e) => updateRequirement(i, { item: e.target.value })} placeholder="Item description" />
                    <Select value={r.discipline} onValueChange={(v) => updateRequirement(i, { discipline: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {disciplines.map((d) => (
                          <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" value={r.qty} onChange={(e) => updateRequirement(i, { qty: Number(e.target.value) })} />
                    <Select value={r.unit} onValueChange={(v) => updateRequirement(i, { unit: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost" size="icon" className="h-9 w-8 text-destructive"
                      onClick={() => setRequirements((rows) => rows.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline" size="sm"
              onClick={() => setRequirements((rows) => [...rows, { item: "", discipline: form.disciplines[0] || "", qty: 1, unit: "Nos" }])}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />Add Item
            </Button>
          </Section>

          <div className="space-y-2">
            <Label>Details / Special Requirements</Label>
            <Textarea
              value={form.details}
              onChange={(e) => set("details", e.target.value)}
              placeholder="Preferred makes, compliance needs, timelines, site constraints…"
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid}>Create Enquiry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
