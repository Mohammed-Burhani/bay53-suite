"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LedgerForm } from "@/components/master/ledgers/LedgerForm";

export default function EditLedgerPage() {
  const router = useRouter();
  const params = useParams();
  const ledgerId = Number(params.id);
  const backToList = () => router.push("/erp/master/ledgers");

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Back to ledgers" onClick={backToList}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">Edit Ledger</h1>
          <p className="text-xs text-muted-foreground">Update ledger #{ledgerId}</p>
        </div>
      </div>

      {Number.isInteger(ledgerId) && ledgerId > 0 ? (
        <LedgerForm ledgerId={ledgerId} onSuccess={backToList} onCancel={backToList} />
      ) : (
        <p className="text-sm text-muted-foreground">Invalid ledger id.</p>
      )}
    </div>
  );
}
