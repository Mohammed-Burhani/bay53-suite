"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/components/master/items/ItemForm";

export default function CreateItemPage() {
  const router = useRouter();
  const backToList = () => router.push("/erp/master/items");

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Back to items" onClick={backToList}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">Add Item</h1>
          <p className="text-xs text-muted-foreground">Create a new item in the item master</p>
        </div>
      </div>

      <ItemForm itemId={null} onSuccess={backToList} onCancel={backToList} />
    </div>
  );
}
