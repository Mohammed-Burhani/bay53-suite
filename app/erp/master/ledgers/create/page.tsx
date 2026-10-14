"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LedgerForm } from "@/components/master/ledgers/LedgerForm";

function CreateLedger() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyParam = Number(searchParams.get("copyFrom"));
  const copyFromId = Number.isInteger(copyParam) && copyParam > 0 ? copyParam : null;
  const backToList = () => router.push("/erp/master/ledgers");

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Back to ledgers" onClick={backToList}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">{copyFromId ? "Save Ledger As" : "Add Ledger"}</h1>
          <p className="text-xs text-muted-foreground">
            {copyFromId ? `Create a new ledger based on #${copyFromId}` : "Create a new ledger in the ledger master"}
          </p>
        </div>
      </div>

      <LedgerForm ledgerId={null} copyFromId={copyFromId} onSuccess={backToList} onCancel={backToList} />
    </div>
  );
}

export default function CreateLedgerPage() {
  return (
    <Suspense>
      <CreateLedger />
    </Suspense>
  );
}
