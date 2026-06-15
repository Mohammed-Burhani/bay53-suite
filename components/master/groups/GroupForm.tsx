"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useParentGroups } from "@/lib/hooks/useGroups";

export interface GroupFormValues {
  name: string;
  parentId: number;
}

const groupSchema = Yup.object().shape({
  name: Yup.string().required("Name is required").min(2, "Min 2 characters"),
  parentId: Yup.number().min(0, "Invalid parent group"),
});

interface GroupFormProps {
  initialValues: GroupFormValues;
  onSubmit: (values: GroupFormValues) => void;
  onCancel: () => void;
  submitLabel: string;
  excludeGroupId?: number;
}

export function GroupForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  excludeGroupId,
}: GroupFormProps) {
  const { data: parentGroups = [], isLoading: isLoadingParents } = useParentGroups();

  const availableParents = parentGroups.filter(
    (g) => !excludeGroupId || g.id !== excludeGroupId
  );

  return (
    <Card className="py-4">
      <CardContent className="p-6">
        <Formik
          initialValues={initialValues}
          validationSchema={groupSchema}
          onSubmit={onSubmit}
          enableReinitialize
        >
          {({ setFieldValue, values, isSubmitting }) => (
            <Form className="grid gap-6">
              <div className="rounded-lg border p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Group Details
                </p>
                <FormField name="name" label="Name *" />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Parent Group</label>
                  <Select
                    value={values.parentId.toString()}
                    onValueChange={(value) => setFieldValue("parentId", Number(value))}
                    disabled={isLoadingParents}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select parent group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None (Root Group)</SelectItem>
                      {availableParents.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ErrorMessage name="parentId" component="p" className="text-xs text-destructive" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isLoadingParents} className="gap-2">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitLabel}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
}

function FormField({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Field
        name={name}
        type={type}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
      />
      <ErrorMessage name={name} component="p" className="text-xs text-destructive" />
    </div>
  );
}
