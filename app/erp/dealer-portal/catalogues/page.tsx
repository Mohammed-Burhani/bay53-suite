"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Search, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CATALOGUES, type Catalogue } from "@/lib/admin-proto/mock";
import { fmtDate } from "@/components/admin-proto/parts";

const size = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

export default function CataloguesPage() {
  const [text, setText] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [scope, setScope] = useState<Catalogue["scope"]>("All Dealers");
  const rows = useMemo(
    () => CATALOGUES.filter((c) => !text || `${c.title} ${c.description}`.toLowerCase().includes(text.toLowerCase())),
    [text]
  );

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold tracking-tight">Catalogues</h1>
          <p className="text-sm text-muted-foreground">Documents dealers can download from the portal.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-9 w-64 pl-8" placeholder="Search catalogues…" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload catalogue
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((c) => (
          <Card key={c.id} className="card-hover py-4">
            <CardContent className="flex gap-3">
              <div className="flex h-16 w-14 shrink-0 items-center justify-center rounded-md bg-rose-100 text-rose-600">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{c.title}</div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px]">
                    {c.scope}
                  </Badge>
                  <span>{c.pages} pages</span>
                  <span>· {size(c.fileSizeKb)}</span>
                  <span>· {fmtDate(c.updatedAt)}</span>
                </div>
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" title="Download" onClick={() => toast.info(`Downloading ${c.title}`)}>
                <Download className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload catalogue</DialogTitle>
            <DialogDescription>It appears in the dealer portal immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input placeholder="e.g. Winter Price List 2026" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Visible to</Label>
                <Select value={scope} onValueChange={(v) => setScope(v as Catalogue["scope"])}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["All Dealers", "Distributors", "Retailers", "Installers"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Pages</Label>
                <Input type="number" min={1} placeholder="0" />
              </div>
            </div>
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground hover:bg-muted/40">
              <Upload className="h-5 w-5" />
              Choose a PDF file
              <input type="file" accept="application/pdf" className="hidden" />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success("Catalogue uploaded");
                setUploadOpen(false);
              }}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
