"use client";

import { useState, useEffect, useCallback } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Undo2, Redo2, Eye, Pencil } from "lucide-react";
import { useFormEditorData } from "./useFormEditorData";
import { useUndoRedo, type FormSnapshot } from "./useUndoRedo";
import { InteractiveFormPreview } from "./InteractiveFormPreview";
import { SettingsPanel } from "./SettingsPanel";
import { AddSectionDialog, AddFieldDialog, AddRatingDialog, AddBenefitDialog } from "./AddItemDialog";
import type { Selection, FormSection, FormField, RatingCategory, StandardBenefit } from "./types";

interface VisualFormEditorProps {
  formType: string;
}

export function VisualFormEditor({ formType }: VisualFormEditorProps) {
  const [selection, setSelection] = useState<Selection>({ type: null, id: null });
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [addRatingOpen, setAddRatingOpen] = useState(false);
  const [addBenefitOpen, setAddBenefitOpen] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const formData = useFormEditorData(formType);
  const {
    config,
    sections,
    fields,
    ratingCategories,
    standardBenefits,
    isLoading,
    isSaving,
    updateConfig,
    updateSection,
    updateField,
    updateRating,
    updateBenefit,
    reorderSections,
    reorderFields,
    reorderBenefits,
    createSection,
    createField,
    createRating,
    createBenefit,
    deleteSection,
    deleteField,
    deleteRating,
    deleteBenefit,
    setSections,
    setFields,
    setRatingCategories,
    setStandardBenefits,
  } = formData;

  // Initialize undo/redo with current state
  const initialSnapshot: FormSnapshot = {
    sections: sections as unknown[],
    fields: fields as unknown[],
    ratingCategories: ratingCategories as unknown[],
    standardBenefits: standardBenefits as unknown[],
  };

  const {
    state: undoRedoState,
    canUndo,
    canRedo,
    undo: undoAction,
    redo: redoAction,
    pushState,
  } = useUndoRedo(initialSnapshot);

  // Track state changes for undo/redo
  const pushCurrentState = useCallback(() => {
    pushState({
      sections: sections as unknown[],
      fields: fields as unknown[],
      ratingCategories: ratingCategories as unknown[],
      standardBenefits: standardBenefits as unknown[],
    });
  }, [sections, fields, ratingCategories, standardBenefits, pushState]);

  // Restore state from undo/redo
  const restoreFromSnapshot = useCallback((snapshot: FormSnapshot) => {
    setSections(snapshot.sections as FormSection[]);
    setFields(snapshot.fields as FormField[]);
    setRatingCategories(snapshot.ratingCategories as RatingCategory[]);
    setStandardBenefits(snapshot.standardBenefits as StandardBenefit[]);
  }, [setSections, setFields, setRatingCategories, setStandardBenefits]);

  // Handle undo - restore previous state
  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    undoAction();
  }, [canUndo, undoAction]);

  // Handle redo - restore next state  
  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    redoAction();
  }, [canRedo, redoAction]);

  // Apply undo/redo state changes
  useEffect(() => {
    if (undoRedoState.sections.length > 0 || undoRedoState.fields.length > 0) {
      restoreFromSnapshot(undoRedoState);
    }
  }, [undoRedoState, restoreFromSnapshot]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Wrap update functions to track history
  const trackedUpdateSection = async (id: string, updates: Partial<FormSection>) => {
    pushCurrentState();
    return updateSection(id, updates);
  };

  const trackedUpdateField = async (id: string, updates: Partial<FormField>) => {
    pushCurrentState();
    return updateField(id, updates);
  };

  const trackedUpdateRating = async (id: string, updates: Partial<RatingCategory>) => {
    pushCurrentState();
    return updateRating(id, updates);
  };

  const trackedUpdateBenefit = async (id: string, updates: Partial<StandardBenefit>) => {
    pushCurrentState();
    return updateBenefit(id, updates);
  };

  const trackedReorderSections = (newSections: FormSection[]) => {
    pushCurrentState();
    reorderSections(newSections);
  };

  const trackedReorderFields = (sectionId: string, newFields: FormField[]) => {
    pushCurrentState();
    reorderFields(sectionId, newFields);
  };

  const trackedReorderBenefits = (newBenefits: StandardBenefit[]) => {
    pushCurrentState();
    reorderBenefits(newBenefits);
  };

  const handleUpdateBenefitsSectionOrder = async (newOrder: number) => {
    if (!config) return;
    await updateConfig({ benefits_section_display_order: newOrder });
  };

  const handleAddSection = () => {
    setAddSectionOpen(true);
  };

  const handleAddField = (sectionId: string) => {
    setCurrentSectionId(sectionId);
    setAddFieldOpen(true);
  };

  const handleAddRating = () => {
    setAddRatingOpen(true);
  };

  const handleAddBenefit = () => {
    setAddBenefitOpen(true);
  };

  const handleCreateSection = async (key: string, title: string) => {
    const newSection = await createSection(key, title);
    if (newSection) {
      setSelection({ type: 'section', id: newSection.id, data: newSection });
    }
  };

  const handleCreateField = async (key: string, label: string, type: string) => {
    if (!currentSectionId) return;
    const newField = await createField(currentSectionId, key, label, type);
    if (newField) {
      setSelection({ type: 'field', id: newField.id, data: newField });
    }
  };

  const handleCreateRating = async (key: string, label: string) => {
    const newRating = await createRating(key, label);
    if (newRating) {
      setSelection({ type: 'rating', id: newRating.id, data: newRating });
    }
  };

  const handleCreateBenefit = async (key: string, label: string) => {
    const newBenefit = await createBenefit(key, label);
    if (newBenefit) {
      setSelection({ type: 'benefit', id: newBenefit.id, data: newBenefit });
    }
  };

  const handleDeleteSection = async (id: string) => {
    const success = await deleteSection(id);
    if (success) {
      setSelection({ type: null, id: null });
    }
    return success;
  };

  const handleDeleteField = async (id: string) => {
    const success = await deleteField(id);
    if (success) {
      setSelection({ type: null, id: null });
    }
    return success;
  };

  const handleDeleteRating = async (id: string) => {
    const success = await deleteRating(id);
    if (success) {
      setSelection({ type: null, id: null });
    }
    return success;
  };

  const handleDeleteBenefit = async (id: string) => {
    const success = await deleteBenefit(id);
    if (success) {
      setSelection({ type: null, id: null });
    }
    return success;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-background h-[calc(100vh-220px)] min-h-[600px]">
        <ResizablePanelGroup direction="horizontal">
          {/* Form Preview Panel */}
          <ResizablePanel defaultSize={65} minSize={50}>
            <div className="h-full flex flex-col">
              <div className="border-b px-4 py-2 bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm font-medium">
                      {isPreviewMode ? "Preview Mode" : "Form Preview"}
                    </span>
                    {!isPreviewMode && (
                      <span className="text-xs text-muted-foreground ml-2">Click any element to edit • Drag to reorder</span>
                    )}
                  </div>
                  
                  {/* Preview Mode Toggle */}
                  <div className="flex items-center gap-1 border-l pl-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isPreviewMode ? "default" : "ghost"}
                          size="sm"
                          onClick={() => {
                            setIsPreviewMode(!isPreviewMode);
                            if (!isPreviewMode) {
                              setSelection({ type: null, id: null });
                            }
                          }}
                          className="h-8 gap-2"
                        >
                          {isPreviewMode ? (
                            <>
                              <Pencil className="h-4 w-4" strokeWidth={1.5} />
                              <span className="text-xs">Edit</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" strokeWidth={1.5} />
                              <span className="text-xs">Preview</span>
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isPreviewMode ? "Switch to Edit Mode" : "Preview as Employee"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Undo/Redo Buttons - hidden in preview mode */}
                  {!isPreviewMode && (
                    <div className="flex items-center gap-1 border-l pl-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleUndo}
                            disabled={!canUndo}
                            className="h-8 w-8 p-0"
                          >
                            <Undo2 className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Undo (Ctrl+Z)</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRedo}
                            disabled={!canRedo}
                            className="h-8 w-8 p-0"
                          >
                            <Redo2 className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Redo (Ctrl+Y)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
                
                {isSaving && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
                    Saving...
                  </div>
                )}
              </div>
              <ScrollArea className="flex-1 bg-muted/20">
                <InteractiveFormPreview
                  config={config}
                  sections={sections}
                  fields={fields}
                  ratingCategories={ratingCategories}
                  standardBenefits={standardBenefits}
                  selection={selection}
                  onSelect={setSelection}
                  formType={formType}
                  onReorderSections={trackedReorderSections}
                  onReorderFields={trackedReorderFields}
                  onAddSection={handleAddSection}
                  onAddField={handleAddField}
                  onAddRating={handleAddRating}
                  onAddBenefit={handleAddBenefit}
                  onUpdateBenefitsSectionOrder={handleUpdateBenefitsSectionOrder}
                  onReorderBenefits={trackedReorderBenefits}
                  isPreviewMode={isPreviewMode}
                />
              </ScrollArea>
            </div>
          </ResizablePanel>

          {!isPreviewMode && (
            <>
              <ResizableHandle withHandle />

              {/* Settings Panel */}
              <ResizablePanel defaultSize={35} minSize={25}>
                <div className="h-full flex flex-col">
                  <div className="border-b px-4 py-2 bg-muted/50">
                    <span className="text-sm font-medium">Settings</span>
                  </div>
                  <SettingsPanel
                    selection={selection}
                    onClearSelection={() => setSelection({ type: null, id: null })}
                    onUpdateConfig={updateConfig}
                    onUpdateSection={trackedUpdateSection}
                    onUpdateField={trackedUpdateField}
                    onUpdateRating={trackedUpdateRating}
                    onUpdateBenefit={trackedUpdateBenefit}
                    onDeleteSection={handleDeleteSection}
                    onDeleteField={handleDeleteField}
                    onDeleteRating={handleDeleteRating}
                    onDeleteBenefit={handleDeleteBenefit}
                    isSaving={isSaving}
                  />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Dialogs */}
      <AddSectionDialog
        open={addSectionOpen}
        onOpenChange={setAddSectionOpen}
        onAdd={handleCreateSection}
      />
      <AddFieldDialog
        open={addFieldOpen}
        onOpenChange={setAddFieldOpen}
        onAdd={handleCreateField}
      />
      <AddRatingDialog
        open={addRatingOpen}
        onOpenChange={setAddRatingOpen}
        onAdd={handleCreateRating}
      />
      <AddBenefitDialog
        open={addBenefitOpen}
        onOpenChange={setAddBenefitOpen}
        onAdd={handleCreateBenefit}
      />
    </>
  );
}
