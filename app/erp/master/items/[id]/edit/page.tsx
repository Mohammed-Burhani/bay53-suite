"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/components/master/items/ItemForm";

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = Number(params.id);
  const backToList = () => router.push("/erp/master/items");

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Back to items" onClick={backToList}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">Edit Item</h1>
          <p className="text-xs text-muted-foreground">Update item #{itemId}</p>
        </div>
      </div>

      {Number.isInteger(itemId) && itemId > 0 ? (
        <ItemForm itemId={itemId} onSuccess={backToList} onCancel={backToList} />
      ) : (
        <p className="text-sm text-muted-foreground">Invalid item id.</p>
      )}
    </div>
  );
}
