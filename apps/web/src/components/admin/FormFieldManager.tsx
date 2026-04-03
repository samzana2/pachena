"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, ChevronDown, ChevronUp, Plus, Trash2, GripVertical } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Json } from "@/types/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
const supabase = createBrowserSupabaseClient();

interface FormField {
  id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  display_order: number;
  is_required: boolean | null;
  is_visible: boolean | null;
  placeholder: string | null;
  options: Json | null;
}

interface FormFieldManagerProps {
  formType: string;
}

interface SortableFieldCardProps {
  field: FormField;
  expandedField: string | null;
  setExpandedField: (id: string | null) => void;
  getFieldTypeBadge: (type: string) => React.ReactNode;
  handleToggleVisible: (id: string, isVisible: boolean) => void;
  handleToggleRequired: (id: string, isRequired: boolean) => void;
  handleUpdateField: (id: string, updates: Partial<FormField>) => void;
  handleDeleteField: (id: string, label: string) => void;
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
];

function SortableFieldCard({
  field,
  expandedField,
  setExpandedField,
  getFieldTypeBadge,
  handleToggleVisible,
  handleToggleRequired,
  handleUpdateField,
  handleDeleteField,
}: SortableFieldCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible
        open={expandedField === field.id}
        onOpenChange={(open) => setExpandedField(open ? field.id : null)}
      >
        <Card className={isDragging ? "ring-2 ring-primary" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {/* Drag Handle */}
              <button
                type="button"
                className="cursor-grab touch-none p-1 hover:bg-muted rounded"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </button>

              <CollapsibleTrigger asChild className="flex-1">
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.field_label}</span>
                        {getFieldTypeBadge(field.field_type)}
                        {field.is_required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {field.field_key}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={field.is_visible ?? true}
                        onCheckedChange={(checked) =>
                          handleToggleVisible(field.id, checked)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-xs text-muted-foreground w-12">
                        {field.is_visible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                    {expandedField === field.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="pt-4 mt-4 border-t space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor={`label-${field.id}`}>Field Label</Label>
                  <Input
                    id={`label-${field.id}`}
                    value={field.field_label}
                    onChange={(e) =>
                      handleUpdateField(field.id, { field_label: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`placeholder-${field.id}`}>Placeholder</Label>
                  <Input
                    id={`placeholder-${field.id}`}
                    value={field.placeholder || ""}
                    onChange={(e) =>
                      handleUpdateField(field.id, { placeholder: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`required-${field.id}`}
                    checked={field.is_required ?? false}
                    onCheckedChange={(checked) =>
                      handleToggleRequired(field.id, checked)
                    }
                  />
                  <Label htmlFor={`required-${field.id}`}>Required field</Label>
                </div>
              </div>

              {field.field_type === "select" && (
                <div>
                  <Label htmlFor={`options-${field.id}`}>
                    Options (JSON array)
                  </Label>
                  <Textarea
                    id={`options-${field.id}`}
                    value={typeof field.options === "string" ? field.options : JSON.stringify(field.options || [])}
                    onChange={(e) =>
                      handleUpdateField(field.id, { options: e.target.value as unknown as Json })
                    }
                    placeholder='["Option 1", "Option 2"]'
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter options as a JSON array
                  </p>
                </div>
              )}

              <div className="pt-2 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Field
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{field.field_label}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this field from the form.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteField(field.id, field.field_label)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>
    </div>
  );
}

export function FormFieldManager({ formType }: FormFieldManagerProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [formConfigId, setFormConfigId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddingField, setIsAddingField] = useState(false);
  
  // New field form state
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchFields();
  }, [formType]);

  const fetchFields = async () => {
    setIsLoading(true);
    
    const { data: configData, error: configError } = await supabase
      .from("form_configurations")
      .select("id")
      .eq("form_type", formType)
      .maybeSingle();

    if (configError || !configData) {
      toast.error("Failed to load form configuration");
      setIsLoading(false);
      return;
    }

    setFormConfigId(configData.id);

    const { data, error } = await supabase
      .from("form_fields")
      .select("*")
      .eq("form_config_id", configData.id)
      .order("display_order");

    if (error) {
      toast.error("Failed to load form fields");
    } else {
      setFields(data || []);
    }
    setIsLoading(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update display_order for all items
        return newItems.map((item, index) => ({
          ...item,
          display_order: index + 1,
        }));
      });
      
      toast.info("Field order changed. Click 'Save Changes' to persist.");
    }
  };

  const handleToggleVisible = async (id: string, isVisible: boolean) => {
    const { error } = await supabase
      .from("form_fields")
      .update({ is_visible: isVisible })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update field");
    } else {
      setFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_visible: isVisible } : f))
      );
    }
  };

  const handleToggleRequired = async (id: string, isRequired: boolean) => {
    const { error } = await supabase
      .from("form_fields")
      .update({ is_required: isRequired })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update field");
    } else {
      setFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_required: isRequired } : f))
      );
    }
  };

  const handleUpdateField = (id: string, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleSaveAll = async () => {
    setIsSaving(true);

    for (const field of fields) {
      const { error } = await supabase
        .from("form_fields")
        .update({
          field_label: field.field_label,
          placeholder: field.placeholder,
          options: field.options,
          display_order: field.display_order,
        })
        .eq("id", field.id);

      if (error) {
        toast.error(`Failed to save ${field.field_label}`);
        setIsSaving(false);
        return;
      }
    }

    toast.success("Form fields saved successfully");
    setIsSaving(false);
  };

  const handleAddField = async () => {
    if (!formConfigId) {
      toast.error("Form configuration not found");
      return;
    }

    if (!newFieldKey.trim() || !newFieldLabel.trim()) {
      toast.error("Field key and label are required");
      return;
    }

    const keyRegex = /^[a-z][a-z0-9_]*$/;
    if (!keyRegex.test(newFieldKey)) {
      toast.error("Field key must start with a letter and contain only lowercase letters, numbers, and underscores");
      return;
    }

    if (fields.some(f => f.field_key === newFieldKey)) {
      toast.error("A field with this key already exists");
      return;
    }

    setIsAddingField(true);

    const maxOrder = fields.reduce((max, f) => Math.max(max, f.display_order), 0);

    const { data, error } = await supabase
      .from("form_fields")
      .insert({
        form_config_id: formConfigId,
        field_key: newFieldKey.trim(),
        field_label: newFieldLabel.trim(),
        field_type: newFieldType,
        placeholder: newFieldPlaceholder.trim() || null,
        is_required: newFieldRequired,
        is_visible: true,
        display_order: maxOrder + 1,
        options: newFieldType === "select" ? [] : null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add field");
    } else if (data) {
      setFields((prev) => [...prev, data]);
      toast.success("Field added successfully");
      resetNewFieldForm();
      setIsAddDialogOpen(false);
    }

    setIsAddingField(false);
  };

  const handleDeleteField = async (id: string, label: string) => {
    const { error } = await supabase
      .from("form_fields")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(`Failed to delete ${label}`);
    } else {
      setFields((prev) => prev.filter((f) => f.id !== id));
      toast.success(`${label} deleted`);
    }
  };

  const resetNewFieldForm = () => {
    setNewFieldKey("");
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldPlaceholder("");
    setNewFieldRequired(false);
  };

  const getFieldTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      text: "default",
      textarea: "secondary",
      select: "outline",
      number: "default",
      checkbox: "secondary",
      email: "default",
      url: "outline",
    };
    return <Badge variant={variants[type] || "outline"}>{type}</Badge>;
  };

  const getFormTypeLabel = () => {
    switch (formType) {
      case "review_form":
        return "review form";
      case "claim_form":
        return "claim form";
      default:
        return "form";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Form Fields</h3>
          <p className="text-sm text-muted-foreground">
            Drag to reorder fields. Configure which fields appear in the {getFormTypeLabel()}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Field
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Field</DialogTitle>
                <DialogDescription>
                  Create a new custom field for the {getFormTypeLabel()}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="field-key">Field Key *</Label>
                  <Input
                    id="field-key"
                    value={newFieldKey}
                    onChange={(e) => setNewFieldKey(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                    placeholder="custom_field_name"
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier (lowercase, no spaces)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-label">Field Label *</Label>
                  <Input
                    id="field-label"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="Custom Field Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-type">Field Type</Label>
                  <Select value={newFieldType} onValueChange={setNewFieldType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-placeholder">Placeholder</Label>
                  <Input
                    id="field-placeholder"
                    value={newFieldPlaceholder}
                    onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                    placeholder="Enter placeholder text..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="field-required"
                    checked={newFieldRequired}
                    onCheckedChange={setNewFieldRequired}
                  />
                  <Label htmlFor="field-required">Required field</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddField} disabled={isAddingField}>
                  {isAddingField ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add Field
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {fields.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No fields configured for this form type. Click "Add Field" to create one.
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {fields.map((field) => (
                <SortableFieldCard
                  key={field.id}
                  field={field}
                  expandedField={expandedField}
                  setExpandedField={setExpandedField}
                  getFieldTypeBadge={getFieldTypeBadge}
                  handleToggleVisible={handleToggleVisible}
                  handleToggleRequired={handleToggleRequired}
                  handleUpdateField={handleUpdateField}
                  handleDeleteField={handleDeleteField}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
