"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { FormConfiguration, FormSection, FormField, RatingCategory, StandardBenefit } from "./types";
const supabase = createBrowserSupabaseClient();

export function useFormEditorData(formType: string) {
  const [config, setConfig] = useState<FormConfiguration | null>(null);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [ratingCategories, setRatingCategories] = useState<RatingCategory[]>([]);
  const [standardBenefits, setStandardBenefits] = useState<StandardBenefit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    const { data: configData, error: configError } = await supabase
      .from("form_configurations")
      .select("*")
      .eq("form_type", formType)
      .maybeSingle();

    if (configError || !configData) {
      toast.error("Failed to load form configuration");
      setIsLoading(false);
      return;
    }

    setConfig(configData as FormConfiguration);

    const [sectionsRes, fieldsRes, ratingsRes, benefitsRes] = await Promise.all([
      supabase
        .from("form_sections")
        .select("*")
        .eq("form_config_id", configData.id)
        .order("display_order"),
      supabase
        .from("form_fields")
        .select("*")
        .eq("form_config_id", configData.id)
        .order("display_order"),
      supabase
        .from("rating_category_configs")
        .select("*")
        .order("display_order"),
      supabase
        .from("standard_benefits")
        .select("*")
        .order("display_order"),
    ]);

    if (sectionsRes.error) toast.error("Failed to load sections");
    if (fieldsRes.error) toast.error("Failed to load fields");
    if (ratingsRes.error) toast.error("Failed to load rating categories");
    if (benefitsRes.error) toast.error("Failed to load benefits");

    setSections((sectionsRes.data || []) as FormSection[]);
    setFields((fieldsRes.data || []) as FormField[]);
    setRatingCategories((ratingsRes.data || []) as RatingCategory[]);
    setStandardBenefits((benefitsRes.data || []) as StandardBenefit[]);
    setIsLoading(false);
  }, [formType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update functions
  const updateConfig = async (updates: Partial<FormConfiguration>) => {
    if (!config) return false;
    setIsSaving(true);
    
    const { error } = await supabase
      .from("form_configurations")
      .update(updates)
      .eq("id", config.id);

    setIsSaving(false);
    if (error) {
      toast.error("Failed to update form");
      return false;
    }

    setConfig({ ...config, ...updates });
    toast.success("Form updated");
    return true;
  };

  const updateSection = async (id: string, updates: Partial<FormSection>) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("form_sections")
      .update(updates)
      .eq("id", id);

    setIsSaving(false);
    if (error) {
      toast.error("Failed to update section");
      return false;
    }

    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    toast.success("Section updated");
    return true;
  };

  const updateField = async (id: string, updates: Partial<FormField>) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("form_fields")
      .update(updates)
      .eq("id", id);

    setIsSaving(false);
    if (error) {
      toast.error("Failed to update field");
      return false;
    }

    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    toast.success("Field updated");
    return true;
  };

  const updateRating = async (id: string, updates: Partial<RatingCategory>) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("rating_category_configs")
      .update(updates)
      .eq("id", id);

    setIsSaving(false);
    if (error) {
      toast.error("Failed to update rating");
      return false;
    }

    setRatingCategories(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    toast.success("Rating updated");
    return true;
  };

  const updateBenefit = async (id: string, updates: Partial<StandardBenefit>) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("standard_benefits")
      .update(updates)
      .eq("id", id);

    setIsSaving(false);
    if (error) {
      toast.error("Failed to update benefit");
      return false;
    }

    setStandardBenefits(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    toast.success("Benefit updated");
    return true;
  };

  // Reorder functions
  const reorderSections = async (newSections: FormSection[]) => {
    setSections(newSections);
    
    const updates = newSections.map((section, index) => ({
      id: section.id,
      display_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from("form_sections")
        .update({ display_order: update.display_order })
        .eq("id", update.id);
    }
  };

  const reorderFields = async (sectionId: string, newFields: FormField[]) => {
    const otherFields = fields.filter(f => f.section_id !== sectionId);
    setFields([...otherFields, ...newFields]);
    
    const updates = newFields.map((field, index) => ({
      id: field.id,
      display_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from("form_fields")
        .update({ display_order: update.display_order })
        .eq("id", update.id);
    }
  };

  const reorderBenefits = async (newBenefits: StandardBenefit[]) => {
    setStandardBenefits(newBenefits);
    
    const updates = newBenefits.map((benefit, index) => ({
      id: benefit.id,
      display_order: index + 1,
    }));

    for (const update of updates) {
      await supabase
        .from("standard_benefits")
        .update({ display_order: update.display_order })
        .eq("id", update.id);
    }
  };

  // Create functions
  const createSection = async (sectionKey: string, sectionTitle: string) => {
    if (!config) return null;
    setIsSaving(true);
    
    const maxOrder = Math.max(...sections.map(s => s.display_order), -1);
    
    const { data, error } = await supabase
      .from("form_sections")
      .insert({
        form_config_id: config.id,
        section_key: sectionKey,
        section_title: sectionTitle,
        display_order: maxOrder + 1,
        is_visible: true,
      })
      .select()
      .single();

    setIsSaving(false);
    if (error) {
      toast.error("Failed to create section");
      return null;
    }

    setSections(prev => [...prev, data as FormSection]);
    toast.success("Section created");
    return data as FormSection;
  };

  const createField = async (sectionId: string, fieldKey: string, fieldLabel: string, fieldType: string) => {
    if (!config) return null;
    setIsSaving(true);
    
    const sectionFields = fields.filter(f => f.section_id === sectionId);
    const maxOrder = Math.max(...sectionFields.map(f => f.display_order), -1);
    
    const { data, error } = await supabase
      .from("form_fields")
      .insert({
        form_config_id: config.id,
        section_id: sectionId,
        field_key: fieldKey,
        field_label: fieldLabel,
        field_type: fieldType,
        display_order: maxOrder + 1,
        is_visible: true,
        is_required: false,
      })
      .select()
      .single();

    setIsSaving(false);
    if (error) {
      toast.error("Failed to create field");
      return null;
    }

    setFields(prev => [...prev, data as FormField]);
    toast.success("Field created");
    return data as FormField;
  };

  const createRating = async (categoryKey: string, categoryLabel: string) => {
    setIsSaving(true);
    
    const maxOrder = Math.max(...ratingCategories.map(r => r.display_order), -1);
    
    const { data, error } = await supabase
      .from("rating_category_configs")
      .insert({
        category_key: categoryKey,
        category_label: categoryLabel,
        display_order: maxOrder + 1,
        is_active: true,
      })
      .select()
      .single();

    setIsSaving(false);
    if (error) {
      toast.error("Failed to create rating category");
      return null;
    }

    setRatingCategories(prev => [...prev, data as RatingCategory]);
    toast.success("Rating category created");
    return data as RatingCategory;
  };

  const createBenefit = async (benefitKey: string, benefitLabel: string) => {
    setIsSaving(true);
    
    const maxOrder = Math.max(...standardBenefits.map(b => b.display_order), -1);
    
    const { data, error } = await supabase
      .from("standard_benefits")
      .insert({
        benefit_key: benefitKey,
        benefit_label: benefitLabel,
        display_order: maxOrder + 1,
        is_active: true,
      })
      .select()
      .single();

    setIsSaving(false);
    if (error) {
      toast.error("Failed to create benefit");
      return null;
    }

    setStandardBenefits(prev => [...prev, data as StandardBenefit]);
    toast.success("Benefit created");
    return data as StandardBenefit;
  };

  // Delete functions
  const deleteSection = async (id: string) => {
    setIsSaving(true);
    
    // First delete all fields in this section
    const sectionFields = fields.filter(f => f.section_id === id);
    for (const field of sectionFields) {
      await supabase.from("form_fields").delete().eq("id", field.id);
    }
    
    const { error } = await supabase
      .from("form_sections")
      .delete()
      .eq("id", id);

    setIsSaving(false);
    if (error) {
      toast.error("Failed to delete section");
      return false;
    }

    setSections(prev => prev.filter(s => s.id !== id));
    setFields(prev => prev.filter(f => f.section_id !== id));
    toast.success("Section deleted");
    return true;
  };

  const deleteField = async (id: string) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("form_fields")
      .delete()
      .eq("id", id);

    setIsSaving(false);
    if (error) {
      toast.error("Failed to delete field");
      return false;
    }

    setFields(prev => prev.filter(f => f.id !== id));
    toast.success("Field deleted");
    return true;
  };

  const deleteRating = async (id: string) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("rating_category_configs")
      .delete()
      .eq("id", id);

    setIsSaving(false);
    if (error) {
      toast.error("Failed to delete rating category");
      return false;
    }

    setRatingCategories(prev => prev.filter(r => r.id !== id));
    toast.success("Rating category deleted");
    return true;
  };

  const deleteBenefit = async (id: string) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("standard_benefits")
      .delete()
      .eq("id", id);

    setIsSaving(false);
    if (error) {
      toast.error("Failed to delete benefit");
      return false;
    }

    setStandardBenefits(prev => prev.filter(b => b.id !== id));
    toast.success("Benefit deleted");
    return true;
  };
  // Restore state (for undo/redo)
  const restoreState = useCallback((snapshot: {
    sections: FormSection[];
    fields: FormField[];
    ratingCategories: RatingCategory[];
    standardBenefits: StandardBenefit[];
  }) => {
    setSections(snapshot.sections);
    setFields(snapshot.fields);
    setRatingCategories(snapshot.ratingCategories);
    setStandardBenefits(snapshot.standardBenefits);
  }, []);

  return {
    config,
    sections,
    fields,
    ratingCategories,
    standardBenefits,
    isLoading,
    isSaving,
    refetch: fetchData,
    // Update
    updateConfig,
    updateSection,
    updateField,
    updateRating,
    updateBenefit,
    // Reorder
    reorderSections,
    reorderFields,
    reorderBenefits,
    // Create
    createSection,
    createField,
    createRating,
    createBenefit,
    // Delete
    deleteSection,
    deleteField,
    deleteRating,
    deleteBenefit,
    // State management
    restoreState,
    setSections,
    setFields,
    setRatingCategories,
    setStandardBenefits,
  };
}
