"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, EyeOff, Briefcase, DollarSign, MessageSquare, ThumbsUp, Lock, User, Building2, Users, Shield, Plus, Heart, Award, Clock, Calendar, FileText, Settings, Home, Mail, Phone, MapPin, Globe, Zap, Target, TrendingUp, CheckCircle, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableSection } from "./SortableSection";
import { SortableField } from "./SortableField";
import { SortableBenefit } from "./SortableBenefit";
import type { Selection, FormConfiguration, FormSection, FormField, RatingCategory, StandardBenefit } from "./types";

interface InteractiveFormPreviewProps {
  config: FormConfiguration | null;
  sections: FormSection[];
  fields: FormField[];
  ratingCategories: RatingCategory[];
  standardBenefits: StandardBenefit[];
  selection: Selection;
  onSelect: (selection: Selection) => void;
  formType: string;
  onReorderSections: (sections: FormSection[]) => void;
  onReorderFields: (sectionId: string, fields: FormField[]) => void;
  onAddSection: () => void;
  onAddField: (sectionId: string) => void;
  onAddRating: () => void;
  onAddBenefit: () => void;
  onUpdateBenefitsSectionOrder: (newOrder: number) => void;
  onReorderBenefits: (benefits: StandardBenefit[]) => void;
  isPreviewMode?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  Briefcase, DollarSign, Star, MessageSquare, ThumbsUp, Lock, User, Building: Building2, Building2, Users, Shield,
  Heart, Award, Clock, Calendar, FileText, Settings, Home, Mail, Phone, MapPin, Globe, Zap, Target, TrendingUp, CheckCircle,
};

export function InteractiveFormPreview({
  config,
  sections,
  fields,
  ratingCategories,
  standardBenefits,
  selection,
  onSelect,
  formType,
  onReorderSections,
  onReorderFields,
  onAddSection,
  onAddField,
  onAddRating,
  onAddBenefit,
  onUpdateBenefitsSectionOrder,
  onReorderBenefits,
  isPreviewMode = false,
}: InteractiveFormPreviewProps) {
  const isReviewForm = formType === "review_form";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getFieldsForSection = (sectionId: string) => {
    return fields.filter(f => f.section_id === sectionId).sort((a, b) => a.display_order - b.display_order);
  };

  const getSectionIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const IconComponent = ICON_MAP[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5 text-primary" strokeWidth={1.5} /> : null;
  };

  const isSelected = (type: Selection['type'], id: string | null) => {
    return selection.type === type && selection.id === id;
  };

  const parseOptions = (options: unknown): string[] => {
    if (!options) return [];
    if (Array.isArray(options)) return options.map(String);
    if (typeof options === 'string') {
      try {
        const parsed = JSON.parse(options);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const sortedSections = [...sections].sort((a, b) => a.display_order - b.display_order);
      const oldIndex = sortedSections.findIndex(s => s.id === active.id);
      const newIndex = sortedSections.findIndex(s => s.id === over.id);
      const reordered = arrayMove(sortedSections, oldIndex, newIndex).map((s, i) => ({ ...s, display_order: i }));
      onReorderSections(reordered);
    }
  };

  const handleFieldDragEnd = (sectionId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const sectionFields = getFieldsForSection(sectionId);
      const oldIndex = sectionFields.findIndex(f => f.id === active.id);
      const newIndex = sectionFields.findIndex(f => f.id === over.id);
      const reordered = arrayMove(sectionFields, oldIndex, newIndex).map((f, i) => ({ ...f, display_order: i }));
      onReorderFields(sectionId, reordered);
    }
  };

  const handleBenefitDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const sortedBenefits = [...standardBenefits].sort((a, b) => a.display_order - b.display_order);
      const oldIndex = sortedBenefits.findIndex(b => b.id === active.id);
      const newIndex = sortedBenefits.findIndex(b => b.id === over.id);
      const reordered = arrayMove(sortedBenefits, oldIndex, newIndex).map((b, i) => ({ ...b, display_order: i + 1 }));
      onReorderBenefits(reordered);
    }
  };

  // Track selected values for select fields in preview mode
  const [selectValues, setSelectValues] = useState<Record<string, string>>({});

  const renderField = (field: FormField) => {
    if (!field.is_visible) return null;
    const options = parseOptions(field.options);
    const hasOtherOption = field.allow_other_text && options.some(opt => opt.toLowerCase() === 'other');
    const selectedValue = selectValues[field.id] || '';
    const showOtherInput = hasOtherOption && selectedValue.toLowerCase() === 'other';

    const fieldContent = (
      <div
        className={cn(
          "space-y-2 p-3 rounded-md transition-all",
          isPreviewMode 
            ? "ml-0" 
            : "ml-4 border-2 cursor-pointer",
          !isPreviewMode && isSelected('field', field.id) 
            ? "border-primary bg-primary/5" 
            : !isPreviewMode 
              ? "border-transparent hover:border-muted-foreground/30"
              : ""
        )}
        onClick={isPreviewMode ? undefined : (e) => {
          e.stopPropagation();
          onSelect({ type: 'field', id: field.id, data: field });
        }}
      >
        <div className="space-y-1">
          <Label className="flex items-center gap-1">
            {field.field_label}
            {field.is_required && <span className="text-destructive">*</span>}
          </Label>
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
        
        {field.field_type === 'text' || field.field_type === 'email' || field.field_type === 'url' || field.field_type === 'number' ? (
          <Input type={field.field_type} placeholder={field.placeholder || ''} disabled={!isPreviewMode} />
        ) : field.field_type === 'short_text' ? (
          <div className="space-y-1">
            <Input 
              type="text" 
              placeholder={field.placeholder || ''} 
              disabled={!isPreviewMode}
              maxLength={40}
            />
            <p className="text-xs text-muted-foreground text-right">0/40</p>
          </div>
        ) : field.field_type === 'textarea' ? (
          <Textarea placeholder={field.placeholder || ''} disabled={!isPreviewMode} rows={3} />
        ) : field.field_type === 'select' ? (
          <div className="space-y-2">
            <Select 
              disabled={!isPreviewMode}
              value={selectedValue}
              onValueChange={(value) => setSelectValues(prev => ({ ...prev, [field.id]: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select option'} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt, i) => (
                  <SelectItem key={i} value={String(opt)}>{String(opt)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* In edit mode: always show disabled with note */}
            {hasOtherOption && !isPreviewMode && (
              <div className="pl-2 border-l-2 border-muted">
                <Input 
                  placeholder={field.other_text_placeholder || 'Please specify...'} 
                  disabled
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Shown when "Other" is selected
                </p>
              </div>
            )}
            {/* In preview mode: only show when Other is selected */}
            {showOtherInput && isPreviewMode && (
              <div className="pl-2 border-l-2 border-muted">
                <Input 
                  placeholder={field.other_text_placeholder || 'Please specify...'} 
                  className="text-sm"
                />
              </div>
            )}
          </div>
        ) : field.field_type === 'checkbox' ? (
          <div className="flex items-center gap-2">
            <Checkbox disabled={!isPreviewMode} />
            <span className="text-sm">{field.placeholder || 'Checkbox option'}</span>
          </div>
        ) : null}
      </div>
    );

    if (isPreviewMode) {
      return <div key={field.id}>{fieldContent}</div>;
    }

    return (
      <SortableField key={field.id} id={field.id}>
        {fieldContent}
      </SortableField>
    );
  };

  const renderRatingCategory = (category: RatingCategory) => {
    if (!category.is_active) return null;

    return (
      <div
        key={category.id}
        className={cn(
          "flex items-center justify-between p-3 rounded-md transition-all",
          isPreviewMode 
            ? "" 
            : "border-2 cursor-pointer",
          !isPreviewMode && isSelected('rating', category.id) 
            ? "border-primary bg-primary/5" 
            : !isPreviewMode 
              ? "border-transparent hover:border-muted-foreground/30"
              : ""
        )}
        onClick={isPreviewMode ? undefined : (e) => {
          e.stopPropagation();
          onSelect({ type: 'rating', id: category.id, data: category });
        }}
      >
        <span className="text-sm font-medium">{category.category_label}</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={cn(
              "h-5 w-5 strokeWidth={1.5}",
              isPreviewMode ? "text-muted-foreground/50 hover:text-yellow-400 cursor-pointer" : "text-muted-foreground/30"
            )} strokeWidth={1.5} />
          ))}
        </div>
      </div>
    );
  };

  const renderBenefit = (benefit: StandardBenefit) => {
    if (!benefit.is_active) return null;

    const benefitContent = (
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-md transition-all",
          isPreviewMode 
            ? "" 
            : "border-2 cursor-pointer ml-5",
          !isPreviewMode && isSelected('benefit', benefit.id) 
            ? "border-primary bg-primary/5" 
            : !isPreviewMode 
              ? "border-transparent hover:border-muted-foreground/30"
              : ""
        )}
        onClick={isPreviewMode ? undefined : (e) => {
          e.stopPropagation();
          onSelect({ type: 'benefit', id: benefit.id, data: benefit });
        }}
      >
        <Checkbox disabled={!isPreviewMode} />
        <span className="text-sm">{benefit.benefit_label}</span>
      </div>
    );

    if (isPreviewMode) {
      return <div key={benefit.id}>{benefitContent}</div>;
    }

    return (
      <SortableBenefit key={benefit.id} id={benefit.id}>
        {benefitContent}
      </SortableBenefit>
    );
  };

  const renderSection = (section: FormSection) => {
    // In preview mode, skip hidden sections entirely
    if (isPreviewMode && !section.is_visible) return null;
    
    const sectionFields = getFieldsForSection(section.id);
    const isRatingsSection = section.section_key === 'ratings';

    const sectionContent = (
      <Card 
        className={cn(
          "relative transition-all",
          !isPreviewMode && !section.is_visible && "opacity-50",
          !isPreviewMode && isSelected('section', section.id) && "ring-2 ring-primary"
        )}
      >
        {!isPreviewMode && !section.is_visible && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-muted-foreground">
            <EyeOff className="h-3 w-3" strokeWidth={1.5} />
            Hidden
          </div>
        )}
        <CardHeader 
          className={cn(
            "rounded-t-lg transition-all",
            isPreviewMode 
              ? "" 
              : "cursor-pointer border-2",
            !isPreviewMode && isSelected('section', section.id) 
              ? "border-primary bg-primary/5" 
              : !isPreviewMode 
                ? "border-transparent hover:border-muted-foreground/30"
                : ""
          )}
          onClick={isPreviewMode ? undefined : (e) => {
            e.stopPropagation();
            onSelect({ type: 'section', id: section.id, data: section });
          }}
        >
          <CardTitle className="flex items-center gap-2 text-lg">
            {getSectionIcon(section.section_icon)}
            {section.section_title}
          </CardTitle>
          {section.section_description && (
            <CardDescription>{section.section_description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {isPreviewMode ? (
            // In preview mode, render fields without drag context
            <>{sectionFields.map(renderField)}</>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleFieldDragEnd(section.id)}
            >
              <SortableContext items={sectionFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                {sectionFields.map(renderField)}
              </SortableContext>
            </DndContext>
          )}
          
          {/* Add Field Button - hidden in preview mode */}
          {!isPreviewMode && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={(e) => {
                e.stopPropagation();
                onAddField(section.id);
              }}
            >
              <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Add Field
            </Button>
          )}
          
          {/* Render rating categories in ratings section */}
          {isRatingsSection && isReviewForm && (
            <div className="space-y-2">
              {ratingCategories.map(renderRatingCategory)}
              {!isPreviewMode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddRating();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Add Rating Category
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );

    // Return just the content - wrapping is handled by the parent
    return sectionContent;
  };

  // Render benefits as a standalone section
  const renderBenefitsSection = () => {
    if (!isReviewForm) return null;
    
    // In preview mode, skip if hidden
    if (isPreviewMode && config?.benefits_section_visible === false) return null;
    
    const benefitsSectionIcon = config?.benefits_section_icon || 'Gift';
    const BenefitsIcon = ICON_MAP[benefitsSectionIcon] || ICON_MAP['Gift'];

    const sectionContent = (
      <Card 
        className={cn(
          "relative transition-all",
          !isPreviewMode && config?.benefits_section_visible === false && "opacity-50",
          !isPreviewMode && isSelected('benefitsSection', 'benefits') && "ring-2 ring-primary"
        )}
      >
        {!isPreviewMode && config?.benefits_section_visible === false && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-muted-foreground">
            <EyeOff className="h-3 w-3" strokeWidth={1.5} />
            Hidden
          </div>
        )}
        <CardHeader 
          className={cn(
            "rounded-t-lg transition-all",
            isPreviewMode 
              ? "" 
              : "cursor-pointer border-2",
            !isPreviewMode && isSelected('benefitsSection', 'benefits') 
              ? "border-primary bg-primary/5" 
              : !isPreviewMode 
                ? "border-transparent hover:border-muted-foreground/30"
                : ""
          )}
          onClick={isPreviewMode ? undefined : (e) => {
            e.stopPropagation();
            onSelect({ type: 'benefitsSection', id: 'benefits', data: config || undefined });
          }}
        >
          <CardTitle className="flex items-center gap-2 text-lg">
            {BenefitsIcon && <BenefitsIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />}
            {config?.benefits_section_title || 'Standard Benefits'}
          </CardTitle>
          {config?.benefits_section_description && (
            <CardDescription>{config.benefits_section_description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Benefits Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Add your benefits</Label>
              {!isPreviewMode && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  Employee input
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Enter benefits you receive from your employer
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Health Insurance, Remote Work, Gym Membership..."
                disabled
                className="flex-1"
              />
              <Button disabled>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Preview of added benefits display */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Your Added Benefits (2)
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-1"
              >
                Company Car
                <span className="ml-1 p-0.5 rounded">
                  <X className="h-3 w-3" />
                </span>
              </Badge>
              <Badge
                variant="secondary"
                className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-1"
              >
                Lunch Allowance
                <span className="ml-1 p-0.5 rounded">
                  <X className="h-3 w-3" />
                </span>
              </Badge>
            </div>
          </div>

          {/* Popular benefits to consider */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-2">Popular benefits to consider:</p>
            <div className="flex flex-wrap gap-2">
              {standardBenefits.filter(b => b.is_active).sort((a, b) => a.display_order - b.display_order).map(benefit => (
                <Button 
                  key={benefit.id} 
                  variant="outline" 
                  size="sm" 
                  disabled={isPreviewMode}
                  className={cn(
                    !isPreviewMode && isSelected('benefit', benefit.id) 
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                      : ""
                  )}
                  onClick={isPreviewMode ? undefined : (e) => {
                    e.stopPropagation();
                    onSelect({ type: 'benefit', id: benefit.id, data: benefit });
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {benefit.benefit_label}
                </Button>
              ))}
            </div>
            {!isPreviewMode && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddBenefit();
                }}
              >
                <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Add Suggested Benefit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );

    return sectionContent;
  };

  // Create combined list of sections and benefits section for sorting
  const benefitsSectionOrder = config?.benefits_section_display_order ?? 100;
  
  // Create a combined sortable item list
  type SortableItem = { type: 'section'; id: string; order: number; section: FormSection } | { type: 'benefits'; id: string; order: number };
  
  const sortableItems: SortableItem[] = [
    ...sections.map(s => ({ type: 'section' as const, id: s.id, order: s.display_order, section: s })),
    ...(isReviewForm ? [{ type: 'benefits' as const, id: 'benefits-section', order: benefitsSectionOrder }] : []),
  ].sort((a, b) => a.order - b.order);

  // Handle combined drag end for sections and benefits section
  const handleCombinedDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortableItems.findIndex(item => item.id === active.id);
    const newIndex = sortableItems.findIndex(item => item.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const movedItem = sortableItems[oldIndex];
    const reorderedItems = arrayMove(sortableItems, oldIndex, newIndex);

    // Update display orders
    if (movedItem.type === 'benefits') {
      // Benefits section was moved - update its order
      const newOrder = newIndex;
      onUpdateBenefitsSectionOrder(newOrder);
      
      // Also update regular sections' orders
      const regularSections = reorderedItems
        .filter((item): item is SortableItem & { type: 'section' } => item.type === 'section')
        .map((item, index) => {
          const adjustedIndex = reorderedItems.indexOf(item);
          return { ...item.section, display_order: adjustedIndex };
        });
      onReorderSections(regularSections);
    } else {
      // A regular section was moved
      const regularSections = reorderedItems
        .filter((item): item is SortableItem & { type: 'section' } => item.type === 'section')
        .map((item, index) => {
          const adjustedIndex = reorderedItems.indexOf(item);
          return { ...item.section, display_order: adjustedIndex };
        });
      onReorderSections(regularSections);
      
      // Update benefits section order if needed
      const benefitsItem = reorderedItems.find(item => item.type === 'benefits');
      if (benefitsItem) {
        const benefitsIndex = reorderedItems.indexOf(benefitsItem);
        onUpdateBenefitsSectionOrder(benefitsIndex);
      }
    }
  };

  return (
    <div className={cn("space-y-6 p-6", isPreviewMode ? "max-w-2xl mx-auto" : "pl-10")}>
      {/* Form Header */}
      <div
        className={cn(
          "text-center p-6 rounded-lg transition-all",
          isPreviewMode 
            ? "bg-card border" 
            : "border-2 cursor-pointer",
          !isPreviewMode && isSelected('header', config?.id || null) 
            ? "border-primary bg-primary/5" 
            : !isPreviewMode 
              ? "border-transparent hover:border-muted-foreground/30"
              : ""
        )}
        onClick={isPreviewMode ? undefined : () => onSelect({ type: 'header', id: config?.id || null, data: config || undefined })}
      >
        <h1 className="text-2xl font-bold mb-2">{config?.title || 'Form Title'}</h1>
        <p className="text-muted-foreground">{config?.description || 'Form description'}</p>
      </div>

      {/* Sections with Drag and Drop */}
      {isPreviewMode ? (
        // In preview mode, render without drag context - render items in sorted order
        <>
          {sortableItems.map(item => 
            item.type === 'section' 
              ? <div key={item.id}>{renderSection(item.section)}</div>
              : <div key={item.id}>{renderBenefitsSection()}</div>
          )}
        </>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCombinedDragEnd}
        >
          <SortableContext items={sortableItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
            {sortableItems.map(item => 
              item.type === 'section' 
                ? <SortableSection key={item.id} id={item.id}>{renderSection(item.section)}</SortableSection>
                : <SortableSection key={item.id} id={item.id}>{renderBenefitsSection()}</SortableSection>
            )}
          </SortableContext>
        </DndContext>
      )}

      {/* Add Section Button - hidden in preview mode */}
      {!isPreviewMode && (
        <Button
          variant="outline"
          className="w-full border-dashed py-8"
          onClick={onAddSection}
        >
          <Plus className="h-5 w-5 mr-2" strokeWidth={1.5} />
          Add Section
        </Button>
      )}

      {/* Submit Button - only in preview mode */}
      {isPreviewMode && (
        <Button className="w-full" size="lg">
          Submit Review
        </Button>
      )}
    </div>
  );
}
