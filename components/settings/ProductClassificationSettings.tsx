"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, GripVertical, Save, RotateCcw, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getClassificationConfig,
  saveClassificationConfig,
  resetClassificationConfig,
  DEFAULT_CLASSIFICATION_FIELDS,
  type ClassificationField,
} from "@/lib/product-classification-config";

export default function ProductClassificationSettings() {
  const [classifications, setClassifications] = useState<ClassificationField[]>(DEFAULT_CLASSIFICATION_FIELDS);
  const [classificationDepth, setClassificationDepth] = useState("4");

  useEffect(() => {
    const config = getClassificationConfig();
    setClassifications(config.fields);
    setClassificationDepth(config.classificationDepth.toString());
  }, []);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDepthChange = (newDepth: string) => {
    setClassificationDepth(newDepth);
    const depth = parseInt(newDepth);
    
    // Auto-enable first N, disable rest
    setClassifications(classifications.map((c, idx) => ({
      ...c,
      enabled: idx < depth
    })));
  };

  const handleAddClassification = () => {
    const newId = `custom_${Date.now()}`;
    setClassifications([
      ...classifications,
      { id: newId, name: "New Classification", enabled: true }
    ]);
  };

  const handleRemoveClassification = (id: string) => {
    setClassifications(classifications.filter(c => c.id !== id));
  };

  const handleToggleClassification = (id: string) => {
    setClassifications(classifications.map(c =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
  };

  const handleRenameClassification = (id: string, newName: string) => {
    setClassifications(classifications.map(c =>
      c.id === id ? { ...c, name: newName } : c
    ));
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

    setClassifications(newClassifications);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSave = () => {
    saveClassificationConfig({
      classificationDepth: parseInt(classificationDepth),
      fields: classifications,
    });
    alert("Classification settings saved successfully!");
  };

  const handleReset = () => {
    resetClassificationConfig();
    setClassifications(DEFAULT_CLASSIFICATION_FIELDS);
    setClassificationDepth("4");
  };

  const enabledCount = classifications.filter(c => c.enabled).length;

  return (
    <div className="space-y-6">
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
              <Label>Classification Fields</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddClassification}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Field
              </Button>
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

                  {/* Remove Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveClassification(classification.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Info */}
      <Card className="py-4 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="text-base">Where This Applies</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
