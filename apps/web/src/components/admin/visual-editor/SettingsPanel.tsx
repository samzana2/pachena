"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, X, FileText, LayoutGrid, Type, Star, Gift, Trash2, Package } from "lucide-react";
import { IconPicker } from "./IconPicker";
import { OptionsEditor } from "./OptionsEditor";
import type { Selection, FormConfiguration, FormSection, FormField, RatingCategory, StandardBenefit } from "./types";

interface SettingsPanelProps {
  selection: Selection;
  onClearSelection: () => void;
  onUpdateConfig: (updates: Partial<FormConfiguration>) => Promise<boolean>;
  onUpdateSection: (id: string, updates: Partial<FormSection>) => Promise<boolean>;
  onUpdateField: (id: string, updates: Partial<FormField>) => Promise<boolean>;
  onUpdateRating: (id: string, updates: Partial<RatingCategory>) => Promise<boolean>;
  onUpdateBenefit: (id: string, updates: Partial<StandardBenefit>) => Promise<boolean>;
  onDeleteSection: (id: string) => Promise<boolean>;
  onDeleteField: (id: string) => Promise<boolean>;
  onDeleteRating: (id: string) => Promise<boolean>;
  onDeleteBenefit: (id: string) => Promise<boolean>;
  isSaving: boolean;
}

export function SettingsPanel({
  selection,
  onClearSelection,
  onUpdateConfig,
  onUpdateSection,
  onUpdateField,
  onUpdateRating,
  onUpdateBenefit,
  onDeleteSection,
  onDeleteField,
  onDeleteRating,
  onDeleteBenefit,
  isSaving,
}: SettingsPanelProps) {
  if (!selection.type || !selection.data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-50" strokeWidth={1.5} />
        <h3 className="font-medium text-foreground mb-2">No element selected</h3>
        <p className="text-sm">
          Click on any element in the form preview to edit its properties
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selection.type === 'header' && <FileText className="h-4 w-4" strokeWidth={1.5} />}
          {selection.type === 'section' && <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />}
          {selection.type === 'field' && <Type className="h-4 w-4" strokeWidth={1.5} />}
          {selection.type === 'rating' && <Star className="h-4 w-4" strokeWidth={1.5} />}
          {selection.type === 'benefit' && <Gift className="h-4 w-4" strokeWidth={1.5} />}
          {selection.type === 'benefitsSection' && <Package className="h-4 w-4" strokeWidth={1.5} />}
          <span className="font-medium capitalize">{selection.type === 'benefitsSection' ? 'Benefits Section' : selection.type} Settings</span>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
          <Button variant="ghost" size="icon" onClick={onClearSelection}>
            <X className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>

        {selection.type === 'header' && (
          <HeaderSettings 
            data={selection.data as FormConfiguration} 
            onUpdate={onUpdateConfig} 
          />
        )}
        {selection.type === 'section' && (
          <SectionSettings 
            data={selection.data as FormSection} 
            onUpdate={onUpdateSection}
            onDelete={onDeleteSection}
          />
        )}
        {selection.type === 'field' && (
          <FieldSettings 
            data={selection.data as FormField} 
            onUpdate={onUpdateField}
            onDelete={onDeleteField}
          />
        )}
        {selection.type === 'rating' && (
          <RatingSettings 
            data={selection.data as RatingCategory} 
            onUpdate={onUpdateRating}
            onDelete={onDeleteRating}
          />
        )}
        {selection.type === 'benefit' && (
          <BenefitSettings 
            data={selection.data as StandardBenefit} 
            onUpdate={onUpdateBenefit}
            onDelete={onDeleteBenefit}
          />
        )}
        {selection.type === 'benefitsSection' && (
          <BenefitsSectionSettings 
            data={selection.data as FormConfiguration} 
            onUpdate={onUpdateConfig} 
          />
        )}
      </div>
    </ScrollArea>
  );
}

// Auto-save hook
function useAutoSave<T>(
  value: T,
  onSave: (value: T) => Promise<boolean>,
  delay: number = 500
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const initialValue = useRef(value);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    initialValue.current = value;
    setIsDirty(false);
  }, [JSON.stringify(value)]);

  const save = useCallback((newValue: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsDirty(true);
    timeoutRef.current = setTimeout(async () => {
      await onSave(newValue);
      setIsDirty(false);
    }, delay);
  }, [onSave, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { save, isDirty };
}

// Header Settings
function HeaderSettings({ 
  data, 
  onUpdate 
}: { 
  data: FormConfiguration; 
  onUpdate: (updates: Partial<FormConfiguration>) => Promise<boolean>;
}) {
  const [title, setTitle] = useState(data.title || "");
  const [description, setDescription] = useState(data.description || "");

  const { save } = useAutoSave(
    { title, description },
    (value) => onUpdate(value)
  );

  useEffect(() => {
    setTitle(data.title || "");
    setDescription(data.description || "");
  }, [data.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    save({ title: newTitle, description });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    save({ title, description: newDescription });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="form-title">Form Title</Label>
        <Input
          id="form-title"
          value={title}
          onChange={handleTitleChange}
          placeholder="Enter form title"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="form-description">Form Description</Label>
        <Textarea
          id="form-description"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Enter form description"
          rows={3}
        />
      </div>
    </div>
  );
}

// Section Settings
function SectionSettings({ 
  data, 
  onUpdate,
  onDelete,
}: { 
  data: FormSection; 
  onUpdate: (id: string, updates: Partial<FormSection>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [title, setTitle] = useState(data.section_title);
  const [description, setDescription] = useState(data.section_description || "");
  const [isVisible, setIsVisible] = useState(data.is_visible ?? true);
  const [icon, setIcon] = useState(data.section_icon);

  const { save } = useAutoSave(
    { section_title: title, section_description: description, is_visible: isVisible, section_icon: icon },
    (value) => onUpdate(data.id, value)
  );

  useEffect(() => {
    setTitle(data.section_title);
    setDescription(data.section_description || "");
    setIsVisible(data.is_visible ?? true);
    setIcon(data.section_icon);
  }, [data.id]);

  const handleChange = (updates: Partial<FormSection>) => {
    if ('section_title' in updates) setTitle(updates.section_title as string);
    if ('section_description' in updates) setDescription(updates.section_description as string);
    if ('is_visible' in updates) setIsVisible(updates.is_visible as boolean);
    if ('section_icon' in updates) setIcon(updates.section_icon as string | null);
    
    save({
      section_title: 'section_title' in updates ? updates.section_title as string : title,
      section_description: 'section_description' in updates ? updates.section_description as string : description,
      is_visible: 'is_visible' in updates ? updates.is_visible as boolean : isVisible,
      section_icon: 'section_icon' in updates ? updates.section_icon as string | null : icon,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="section-title">Section Title</Label>
        <Input
          id="section-title"
          value={title}
          onChange={(e) => handleChange({ section_title: e.target.value })}
          placeholder="Enter section title"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="section-description">Section Description</Label>
        <Textarea
          id="section-description"
          value={description}
          onChange={(e) => handleChange({ section_description: e.target.value })}
          placeholder="Enter section description"
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Section Icon</Label>
        <IconPicker value={icon} onChange={(iconName) => handleChange({ section_icon: iconName })} />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="section-visible">Visible</Label>
        <Switch
          id="section-visible"
          checked={isVisible}
          onCheckedChange={(checked) => handleChange({ is_visible: checked })}
        />
      </div>
      
      <Separator />
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Delete Section
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this section and all its fields. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(data.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Field Settings
function FieldSettings({ 
  data, 
  onUpdate,
  onDelete,
}: { 
  data: FormField; 
  onUpdate: (id: string, updates: Partial<FormField>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [label, setLabel] = useState(data.field_label);
  const [description, setDescription] = useState(data.description || "");
  const [placeholder, setPlaceholder] = useState(data.placeholder || "");
  const [isRequired, setIsRequired] = useState(data.is_required ?? false);
  const [isVisible, setIsVisible] = useState(data.is_visible ?? true);
  const [allowOtherText, setAllowOtherText] = useState(data.allow_other_text ?? false);
  const [otherTextPlaceholder, setOtherTextPlaceholder] = useState(data.other_text_placeholder || "");
  const [options, setOptions] = useState<string[]>(() => {
    if (!data.options) return [];
    if (Array.isArray(data.options)) return data.options.map(String);
    if (typeof data.options === 'string') {
      try {
        const parsed = JSON.parse(data.options);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const { save } = useAutoSave(
    { field_label: label, description, placeholder, is_required: isRequired, is_visible: isVisible, options, allow_other_text: allowOtherText, other_text_placeholder: otherTextPlaceholder },
    (value) => onUpdate(data.id, value)
  );

  useEffect(() => {
    setLabel(data.field_label);
    setDescription(data.description || "");
    setPlaceholder(data.placeholder || "");
    setIsRequired(data.is_required ?? false);
    setIsVisible(data.is_visible ?? true);
    setAllowOtherText(data.allow_other_text ?? false);
    setOtherTextPlaceholder(data.other_text_placeholder || "");
    if (data.options) {
      if (Array.isArray(data.options)) {
        setOptions(data.options.map(String));
      } else if (typeof data.options === 'string') {
        try {
          const parsed = JSON.parse(data.options);
          setOptions(Array.isArray(parsed) ? parsed.map(String) : []);
        } catch {
          setOptions([]);
        }
      }
    } else {
      setOptions([]);
    }
  }, [data.id]);

  const handleChange = (updates: Partial<FormField & { options: string[] }>) => {
    const newLabel = 'field_label' in updates ? updates.field_label as string : label;
    const newDescription = 'description' in updates ? updates.description as string : description;
    const newPlaceholder = 'placeholder' in updates ? updates.placeholder as string : placeholder;
    const newIsRequired = 'is_required' in updates ? updates.is_required as boolean : isRequired;
    const newIsVisible = 'is_visible' in updates ? updates.is_visible as boolean : isVisible;
    const newOptions = 'options' in updates ? updates.options as string[] : options;
    const newAllowOtherText = 'allow_other_text' in updates ? updates.allow_other_text as boolean : allowOtherText;
    const newOtherTextPlaceholder = 'other_text_placeholder' in updates ? updates.other_text_placeholder as string : otherTextPlaceholder;

    if ('field_label' in updates) setLabel(newLabel);
    if ('description' in updates) setDescription(newDescription);
    if ('placeholder' in updates) setPlaceholder(newPlaceholder);
    if ('is_required' in updates) setIsRequired(newIsRequired);
    if ('is_visible' in updates) setIsVisible(newIsVisible);
    if ('options' in updates) setOptions(newOptions);
    if ('allow_other_text' in updates) setAllowOtherText(newAllowOtherText);
    if ('other_text_placeholder' in updates) setOtherTextPlaceholder(newOtherTextPlaceholder);
    
    save({
      field_label: newLabel,
      description: newDescription,
      placeholder: newPlaceholder,
      is_required: newIsRequired,
      is_visible: newIsVisible,
      options: newOptions,
      allow_other_text: newAllowOtherText,
      other_text_placeholder: newOtherTextPlaceholder,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Field Key</Label>
        <Input value={data.field_key} disabled className="bg-muted" />
      </div>
      <div className="space-y-2">
        <Label>Field Type</Label>
        <Input value={data.field_type} disabled className="bg-muted capitalize" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="field-label">Display Label</Label>
        <Input
          id="field-label"
          value={label}
          onChange={(e) => handleChange({ field_label: e.target.value })}
          placeholder="Enter field label"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="field-description">Description</Label>
        <Textarea
          id="field-description"
          value={description}
          onChange={(e) => handleChange({ description: e.target.value })}
          placeholder="Optional helper text shown below the question"
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="field-placeholder">Placeholder</Label>
        <Input
          id="field-placeholder"
          value={placeholder}
          onChange={(e) => handleChange({ placeholder: e.target.value })}
          placeholder="Enter placeholder text"
        />
      </div>
      
      {data.field_type === 'select' && (
        <>
          <OptionsEditor
            options={options}
            onChange={(newOptions) => handleChange({ options: newOptions })}
          />
          
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-other-text">Allow "Other" with text input</Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, selecting "Other" will show a text input
                </p>
              </div>
              <Switch
                id="allow-other-text"
                checked={allowOtherText}
                onCheckedChange={(checked) => handleChange({ allow_other_text: checked })}
              />
            </div>
            
            {allowOtherText && (
              <div className="space-y-2">
                <Label htmlFor="other-placeholder">Custom input placeholder</Label>
                <Input
                  id="other-placeholder"
                  value={otherTextPlaceholder}
                  onChange={(e) => handleChange({ other_text_placeholder: e.target.value })}
                  placeholder="e.g., Please specify your role family"
                />
              </div>
            )}
          </div>
        </>
      )}
      
      <div className="flex items-center justify-between">
        <Label htmlFor="field-required">Required</Label>
        <Switch
          id="field-required"
          checked={isRequired}
          onCheckedChange={(checked) => handleChange({ is_required: checked })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="field-visible">Visible</Label>
        <Switch
          id="field-visible"
          checked={isVisible}
          onCheckedChange={(checked) => handleChange({ is_visible: checked })}
        />
      </div>
      
      <Separator />
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Delete Field
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Field</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this field. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(data.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Rating Settings
function RatingSettings({ 
  data, 
  onUpdate,
  onDelete,
}: { 
  data: RatingCategory; 
  onUpdate: (id: string, updates: Partial<RatingCategory>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [label, setLabel] = useState(data.category_label);
  const [isActive, setIsActive] = useState(data.is_active ?? true);

  const { save } = useAutoSave(
    { category_label: label, is_active: isActive },
    (value) => onUpdate(data.id, value)
  );

  useEffect(() => {
    setLabel(data.category_label);
    setIsActive(data.is_active ?? true);
  }, [data.id]);

  const handleChange = (updates: Partial<RatingCategory>) => {
    if ('category_label' in updates) setLabel(updates.category_label as string);
    if ('is_active' in updates) setIsActive(updates.is_active as boolean);
    
    save({
      category_label: 'category_label' in updates ? updates.category_label as string : label,
      is_active: 'is_active' in updates ? updates.is_active as boolean : isActive,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Category Key</Label>
        <Input value={data.category_key} disabled className="bg-muted" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rating-label">Display Label</Label>
        <Input
          id="rating-label"
          value={label}
          onChange={(e) => handleChange({ category_label: e.target.value })}
          placeholder="Enter rating label"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="rating-active">Active</Label>
        <Switch
          id="rating-active"
          checked={isActive}
          onCheckedChange={(checked) => handleChange({ is_active: checked })}
        />
      </div>
      
      <Separator />
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Delete Rating Category
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rating Category</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this rating category. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(data.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Benefit Settings
function BenefitSettings({ 
  data, 
  onUpdate,
  onDelete,
}: { 
  data: StandardBenefit; 
  onUpdate: (id: string, updates: Partial<StandardBenefit>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [label, setLabel] = useState(data.benefit_label);
  const [isActive, setIsActive] = useState(data.is_active ?? true);

  const { save } = useAutoSave(
    { benefit_label: label, is_active: isActive },
    (value) => onUpdate(data.id, value)
  );

  useEffect(() => {
    setLabel(data.benefit_label);
    setIsActive(data.is_active ?? true);
  }, [data.id]);

  const handleChange = (updates: Partial<StandardBenefit>) => {
    if ('benefit_label' in updates) setLabel(updates.benefit_label as string);
    if ('is_active' in updates) setIsActive(updates.is_active as boolean);
    
    save({
      benefit_label: 'benefit_label' in updates ? updates.benefit_label as string : label,
      is_active: 'is_active' in updates ? updates.is_active as boolean : isActive,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Benefit Key</Label>
        <Input value={data.benefit_key} disabled className="bg-muted" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="benefit-label">Display Label</Label>
        <Input
          id="benefit-label"
          value={label}
          onChange={(e) => handleChange({ benefit_label: e.target.value })}
          placeholder="Enter benefit label"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="benefit-active">Active</Label>
        <Switch
          id="benefit-active"
          checked={isActive}
          onCheckedChange={(checked) => handleChange({ is_active: checked })}
        />
      </div>
      
      <Separator />
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Delete Benefit
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Benefit</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this benefit. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(data.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Benefits Section Settings
function BenefitsSectionSettings({ 
  data, 
  onUpdate 
}: { 
  data: FormConfiguration; 
  onUpdate: (updates: Partial<FormConfiguration>) => Promise<boolean>;
}) {
  const [title, setTitle] = useState(data.benefits_section_title || "Standard Benefits");
  const [description, setDescription] = useState(data.benefits_section_description || "");
  const [isVisible, setIsVisible] = useState(data.benefits_section_visible ?? true);
  const [icon, setIcon] = useState(data.benefits_section_icon || "Gift");

  const { save } = useAutoSave(
    { benefits_section_title: title, benefits_section_description: description, benefits_section_visible: isVisible, benefits_section_icon: icon },
    (value) => onUpdate(value)
  );

  useEffect(() => {
    setTitle(data.benefits_section_title || "Standard Benefits");
    setDescription(data.benefits_section_description || "");
    setIsVisible(data.benefits_section_visible ?? true);
    setIcon(data.benefits_section_icon || "Gift");
  }, [data.id]);

  const handleChange = (updates: Partial<FormConfiguration>) => {
    if ('benefits_section_title' in updates) setTitle(updates.benefits_section_title as string);
    if ('benefits_section_description' in updates) setDescription(updates.benefits_section_description as string);
    if ('benefits_section_visible' in updates) setIsVisible(updates.benefits_section_visible as boolean);
    if ('benefits_section_icon' in updates) setIcon(updates.benefits_section_icon as string);
    
    save({
      benefits_section_title: 'benefits_section_title' in updates ? updates.benefits_section_title as string : title,
      benefits_section_description: 'benefits_section_description' in updates ? updates.benefits_section_description as string : description,
      benefits_section_visible: 'benefits_section_visible' in updates ? updates.benefits_section_visible as boolean : isVisible,
      benefits_section_icon: 'benefits_section_icon' in updates ? updates.benefits_section_icon as string : icon,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="benefits-section-title">Section Title</Label>
        <Input
          id="benefits-section-title"
          value={title}
          onChange={(e) => handleChange({ benefits_section_title: e.target.value })}
          placeholder="Enter section title"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="benefits-section-description">Section Description</Label>
        <Textarea
          id="benefits-section-description"
          value={description}
          onChange={(e) => handleChange({ benefits_section_description: e.target.value })}
          placeholder="Enter section description"
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Section Icon</Label>
        <IconPicker value={icon} onChange={(iconName) => handleChange({ benefits_section_icon: iconName })} />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="benefits-section-visible">Visible</Label>
        <Switch
          id="benefits-section-visible"
          checked={isVisible}
          onCheckedChange={(checked) => handleChange({ benefits_section_visible: checked })}
        />
      </div>
      
      <Separator />
      
      <p className="text-xs text-muted-foreground">
        Drag this section in the preview to reorder it. Click on individual benefits to edit them.
      </p>
    </div>
  );
}
