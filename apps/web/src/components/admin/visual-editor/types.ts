import { Json } from "@/types/supabase";

export interface FormConfiguration {
  id: string;
  form_type: string;
  title: string | null;
  description: string | null;
  header_icon: string | null;
  is_active: boolean | null;
  benefits_section_title: string | null;
  benefits_section_description: string | null;
  benefits_section_icon: string | null;
  benefits_section_display_order: number | null;
  benefits_section_visible: boolean | null;
}

export interface FormSection {
  id: string;
  form_config_id: string;
  section_key: string;
  section_title: string;
  section_description: string | null;
  section_icon: string | null;
  display_order: number;
  is_visible: boolean | null;
}

export interface FormField {
  id: string;
  form_config_id: string;
  section_id: string | null;
  field_key: string;
  field_label: string;
  field_type: string;
  display_order: number;
  is_required: boolean | null;
  is_visible: boolean | null;
  placeholder: string | null;
  options: Json | null;
  description: string | null;
  allow_other_text: boolean | null;
  other_text_placeholder: string | null;
}

export interface RatingCategory {
  id: string;
  category_key: string;
  category_label: string;
  category_description: string | null;
  display_order: number;
  is_active: boolean | null;
}

export interface StandardBenefit {
  id: string;
  benefit_key: string;
  benefit_label: string;
  display_order: number;
  is_active: boolean | null;
}

export type SelectionType = 'header' | 'section' | 'field' | 'rating' | 'benefit' | 'benefitsSection' | null;

export interface Selection {
  type: SelectionType;
  id: string | null;
  data?: FormConfiguration | FormSection | FormField | RatingCategory | StandardBenefit;
}
