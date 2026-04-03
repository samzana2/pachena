"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, GripVertical, Trash2, Loader2, Save } from "lucide-react";
const supabase = createBrowserSupabaseClient();

interface RatingCategory {
  id: string;
  category_key: string;
  category_label: string;
  display_order: number;
  is_active: boolean | null;
}

export function RatingCategoryManager() {
  const [categories, setCategories] = useState<RatingCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategory, setNewCategory] = useState({ key: "", label: "" });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("rating_category_configs")
      .select("*")
      .order("display_order");

    if (error) {
      toast.error("Failed to load rating categories");
    } else {
      setCategories(data || []);
    }
    setIsLoading(false);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("rating_category_configs")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update category");
    } else {
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, is_active: isActive } : cat))
      );
    }
  };

  const handleUpdateLabel = (id: string, label: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, category_label: label } : cat))
    );
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    
    for (const cat of categories) {
      const { error } = await supabase
        .from("rating_category_configs")
        .update({ category_label: cat.category_label, display_order: cat.display_order })
        .eq("id", cat.id);
      
      if (error) {
        toast.error(`Failed to save ${cat.category_label}`);
        setIsSaving(false);
        return;
      }
    }
    
    toast.success("Categories saved successfully");
    setIsSaving(false);
  };

  const handleAddCategory = async () => {
    if (!newCategory.key || !newCategory.label) {
      toast.error("Please fill in both key and label");
      return;
    }

    const maxOrder = Math.max(...categories.map((c) => c.display_order), 0);
    
    const { data, error } = await supabase
      .from("rating_category_configs")
      .insert({
        category_key: newCategory.key,
        category_label: newCategory.label,
        display_order: maxOrder + 1,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add category");
    } else {
      setCategories((prev) => [...prev, data]);
      setNewCategory({ key: "", label: "" });
      toast.success("Category added");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase
      .from("rating_category_configs")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete category");
    } else {
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      toast.success("Category deleted");
    }
  };

  const moveCategory = (index: number, direction: "up" | "down") => {
    const newCategories = [...categories];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    
    // Swap display orders
    const tempOrder = newCategories[index].display_order;
    newCategories[index].display_order = newCategories[targetIndex].display_order;
    newCategories[targetIndex].display_order = tempOrder;
    
    // Swap positions in array
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
    
    setCategories(newCategories);
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
          <h3 className="text-lg font-medium">Rating Categories</h3>
          <p className="text-sm text-muted-foreground">
            Configure the rating categories shown in the review form
          </p>
        </div>
        <Button onClick={handleSaveAll} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="space-y-3">
        {categories.map((category, index) => (
          <Card key={category.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveCategory(index, "up")}
                  disabled={index === 0}
                >
                  <GripVertical className="h-4 w-4 rotate-90" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveCategory(index, "down")}
                  disabled={index === categories.length - 1}
                >
                  <GripVertical className="h-4 w-4 rotate-90" />
                </Button>
              </div>
              
              <div className="flex-1 grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Key</Label>
                  <Input value={category.category_key} disabled className="bg-muted" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Label</Label>
                  <Input
                    value={category.category_label}
                    onChange={(e) => handleUpdateLabel(category.id, e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={category.is_active ?? false}
                  onCheckedChange={(checked) => handleToggleActive(category.id, checked)}
                />
                <span className="text-xs text-muted-foreground w-12">
                  {category.is_active ? "Active" : "Hidden"}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDeleteCategory(category.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="newKey">Category Key</Label>
              <Input
                id="newKey"
                placeholder="e.g., teamwork"
                value={newCategory.key}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, key: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="newLabel">Display Label</Label>
              <Input
                id="newLabel"
                placeholder="e.g., Team Collaboration"
                value={newCategory.label}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, label: e.target.value }))}
              />
            </div>
            <Button onClick={handleAddCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
