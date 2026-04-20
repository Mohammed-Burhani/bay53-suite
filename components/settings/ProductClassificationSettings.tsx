"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, X, GripVertical, Save, RotateCcw, Tag, Info, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/hooks/useAuth";
import {
  useClassificationConfig,
  useInitializeConfig,
  useBulkUpdateFields,
  useUpdateClassificationDepth,
} from "@/lib/hooks/useProductClassification";
import { toast } from "sonner";

interface LocalClassificationField {
  id: string;
  field_id: string;
  name: string;
  enabled: boolean;
  display_order: number;
  is_custom?: boolean;
}

export default function ProductClassificationSettings() {
  const session = useSession();
  const organizationId = session?.company?.id?.toString() || "demo-org";

  const { data: config, isLoading, error } = useClassificationConfig(organizationId);
  const initializeConfig = useInitializeConfig();
  const bulkUpdateFields = useBulkUpdateFields();
  const updateDepth = useUpdateClassificationDepth();

  const [classifications, setClassifications] = useState<LocalClassificationField[]>([]);
  const [classificationDepth, setClassificationDepth] = useState("4");
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showFirstTimeHelp, setShowFirstTimeHelp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize config if not exists
  useEffect(() => {
    if (!isLoading && !config && !error) {
      setShowFirstTimeHelp(true);
      initializeConfig.mutate({
        organization_id: organizationId,
        classification_depth: 4,
        created_by: session?.user?.user_ID?.toString(),
      });
    }
  }, [isLoading, config, error, organizationId, session?.user?.user_ID]);

  // Load config into local state
  useEffect(() => {
    if (config) {
      setClassificationDepth(config.classification_depth.toString());
      
      // Filter to only show allowed 8 fields
      const ALLOWED_FIELDS = ['item_code', 'item', 'aliases', 'category', 'sub_cat', 'size', 'ref_no', 'color'];
      const filteredFields = config.fields
        .filter(f => ALLOWED_FIELDS.includes(f.field_id))
        .map((f) => ({
          id: f.id,
          field_id: f.field_id,
          name: f.field_name,
          enabled: f.enabled,
          display_order: f.display_order,
          is_custom: f.is_custom,
        }));
      
      setClassifications(filteredFields);
      setHasChanges(false);
    }
  }, [config]);

  const handleDepthChange = (newDepth: string) => {
    setClassificationDepth(newDepth);
    const depth = parseInt(newDepth);
    
    // Auto-enable first N, disable rest
    setClassifications(classifications.map((c, idx) => ({
      ...c,
      enabled: idx < depth
    })));
    setHasChanges(true);
  };

  // Removed - no custom fields allowed

  const handleRemoveClassification = (id: string) => {
    const field = classifications.find(c => c.id === id);
    if (field && !field.is_custom) {
      toast.error("Cannot delete built-in fields");
      return;
    }
    setClassifications(classifications.filter(c => c.id !== id));
    setHasChanges(true);
  };

  const handleToggleClassification = (id: string) => {
    setClassifications(classifications.map(c =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
    setHasChanges(true);
  };

  const handleRenameClassification = (id: string, newName: string) => {
    setClassifications(classifications.map(c =>
      c.id === id ? { ...c, name: newName } : c
    ));
    setHasChanges(true);
  };

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIdx = classifications.findIndex(c => c.id === draggedItem);
    const targetIdx = classifications.findIndex(c => c.id === targetId);

    const newClassifications = [...classifications];
    const [removed] = newClassifications.splice(draggedIdx, 1);
    newClassifications.splice(targetIdx, 0, removed);

    // Update display orders
    newClassifications.forEach((c, idx) => {
      c.display_order = idx + 1;
    });

    setClassifications(newClassifications);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSave = async () => {
    if (!config) {
      toast.error("Configuration not loaded");
      return;
    }

    // Validation
    const enabledFields = classifications.filter(c => c.enabled);
    if (enabledFields.length === 0) {
      toast.error("At least one field must be enabled");
      return;
    }

    const emptyNames = classifications.filter(c => !c.name.trim());
    if (emptyNames.length > 0) {
      toast.error("All fields must have a name");
      return;
    }

    try {
      setIsSaving(true);

      // Update depth if changed
      if (parseInt(classificationDepth) !== config.classification_depth) {
        await updateDepth.mutateAsync({
          organizationId,
          depth: parseInt(classificationDepth),
          userId: session?.user?.user_ID?.toString(),
        });
      }

      // Bulk update fields
      await bulkUpdateFields.mutateAsync({
        configId: config.id,
        fields: classifications.map((c, idx) => ({
          field_id: c.field_id,
          field_name: c.name,
          display_order: idx + 1,
          enabled: c.enabled,
        })),
        userId: session?.user?.user_ID?.toString(),
      });

      setHasChanges(false);
      setShowFirstTimeHelp(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (config) {
      // Filter to only show allowed 8 fields
      const ALLOWED_FIELDS = ['item_code', 'item', 'aliases', 'category', 'sub_cat', 'size', 'ref_no', 'color'];
      const filteredFields = config.fields
        .filter(f => ALLOWED_FIELDS.includes(f.field_id))
        .map((f) => ({
          id: f.id,
          field_id: f.field_id,
          name: f.field_name,
          enabled: f.enabled,
          display_order: f.display_order,
          is_custom: f.is_custom,
        }));
      
      setClassifications(filteredFields);
      setClassificationDepth(config.classification_depth.toString());
      setHasChanges(false);
    }
  };

  const enabledCount = classifications.filter(c => c.enabled).length;
  const isSaveDisabled = !hasChanges || isSaving || !config;
  const saveButtonTooltip = !config 
    ? "Loading configuration..." 
    : !hasChanges 
    ? "No changes to save" 
    : isSaving 
    ? "Saving changes..." 
    : "Save your changes";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load classification settings. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* First-time user help */}
      {showFirstTimeHelp && (
        <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-sm">
            <strong>Welcome to Product Classifications!</strong> This feature lets you customize how product information appears throughout your system. 
            Start by selecting how many classification levels you need, then customize the field names to match your business terminology.
          </AlertDescription>
        </Alert>
      )}

      <Card className="py-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Product Classifications
              </CardTitle>
              <CardDescription className="mt-2">
                Customize column names and classifications for products shown in reports, invoices, and inventory
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {enabledCount} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Classification Depth */}
          <div className="space-y-2">
            <Label htmlFor="classification-depth">Classification Depth</Label>
            <Select value={classificationDepth} onValueChange={handleDepthChange}>
              <SelectTrigger id="classification-depth" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Level</SelectItem>
                <SelectItem value="2">2 Levels</SelectItem>
                <SelectItem value="3">3 Levels</SelectItem>
                <SelectItem value="4">4 Levels</SelectItem>
                <SelectItem value="5">5 Levels</SelectItem>
                <SelectItem value="6">6 Levels</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Automatically enables first {classificationDepth} field{parseInt(classificationDepth) !== 1 ? 's' : ''} (you can still toggle manually)
            </p>
          </div>

          {/* Classifications List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Classification Fields (Fixed 8 Fields)</Label>
            </div>

            <div className="space-y-2">
              {classifications.map((classification, index) => (
                <div
                  key={classification.id}
                  draggable
                  onDragStart={() => handleDragStart(classification.id)}
                  onDragOver={(e) => handleDragOver(e, classification.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all",
                    draggedItem === classification.id && "opacity-50",
                    classification.enabled ? "border-border" : "border-dashed opacity-60"
                  )}
                >
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Order Number */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted text-sm font-medium">
                    {index + 1}
                  </div>

                  {/* Input Field */}
                  <Input
                    value={classification.name}
                    onChange={(e) => handleRenameClassification(classification.id, e.target.value)}
                    className="flex-1"
                    placeholder="Classification name"
                  />

                  {/* Toggle Button */}
                  <Button
                    size="sm"
                    variant={classification.enabled ? "default" : "outline"}
                    onClick={() => handleToggleClassification(classification.id)}
                    className="min-w-[80px]"
                  >
                    {classification.enabled ? "Enabled" : "Disabled"}
                  </Button>

                  {/* Remove Button - Hidden (no custom fields) */}
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Drag to reorder • Only enabled fields will appear in reports and invoices
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2 pt-4 border-t">
            <Label>Preview</Label>
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="text-sm font-medium mb-2">Active Classifications:</div>
              <div className="flex flex-wrap gap-2">
                {classifications
                  .filter(c => c.enabled)
                  .map((c, idx) => (
                    <Badge key={c.id} variant="secondary">
                      {idx + 1}. {c.name}
                    </Badge>
                  ))}
              </div>
              {enabledCount === 0 && (
                <p className="text-sm text-muted-foreground">No classifications enabled</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1">
                    <Button 
                      onClick={handleSave} 
                      className="w-full"
                      disabled={isSaveDisabled}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {isSaveDisabled && (
                  <TooltipContent>
                    <p>{saveButtonTooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            
            <Button 
              onClick={handleReset} 
              variant="outline"
              disabled={!hasChanges || isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          
          {hasChanges && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-2">
              <AlertCircle className="h-3 w-3" />
              You have unsaved changes
            </p>
          )}
        </CardContent>
      </Card>

      {/* Usage Info & Help */}
      <Card className="py-4 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            How to Use This Feature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Quick Start Guide:</h4>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li><strong>Set Classification Depth:</strong> Choose how many product attributes you want to track (1-6 levels)</li>
              <li><strong>Customize Field Names:</strong> Click on any field name to rename it to match your terminology</li>
              <li><strong>Reorder Fields:</strong> Drag fields up or down to change their display order</li>
              <li><strong>Enable/Disable:</strong> Toggle fields on/off based on what you need</li>

              <li><strong>Save Changes:</strong> Click "Save Changes" to apply your configuration</li>
            </ol>
          </div>

          <div className="pt-2 border-t">
            <h4 className="text-sm font-semibold mb-2">Where This Applies:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                <span><strong>Reports:</strong> Current Stock, Inventory Report, Item Register</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                <span><strong>Invoices:</strong> Product line items and descriptions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                <span><strong>Inventory:</strong> Product listings and search results</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                <span><strong>Stock Management:</strong> Stock in/out forms</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
