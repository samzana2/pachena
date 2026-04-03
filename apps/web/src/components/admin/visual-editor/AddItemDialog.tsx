"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (key: string, title: string) => void;
}

export function AddSectionDialog({ open, onOpenChange, onAdd }: AddSectionDialogProps) {
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    if (key.trim() && title.trim()) {
      onAdd(key.trim().toLowerCase().replace(/\s+/g, '_'), title.trim());
      setKey("");
      setTitle("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="section-key">Section Key</Label>
            <Input
              id="section-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g., work_experience"
            />
            <p className="text-xs text-muted-foreground">Unique identifier (lowercase, underscores)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="section-title">Section Title</Label>
            <Input
              id="section-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Work Experience"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!key.trim() || !title.trim()}>Add Section</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (key: string, label: string, type: string) => void;
}

export function AddFieldDialog({ open, onOpenChange, onAdd }: AddFieldDialogProps) {
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");

  const handleSubmit = () => {
    if (key.trim() && label.trim()) {
      onAdd(key.trim().toLowerCase().replace(/\s+/g, '_'), label.trim(), type);
      setKey("");
      setLabel("");
      setType("text");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Field</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="field-key">Field Key</Label>
            <Input
              id="field-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g., job_title"
            />
            <p className="text-xs text-muted-foreground">Unique identifier (lowercase, underscores)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-label">Field Label</Label>
            <Input
              id="field-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Job Title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-type">Field Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="short_text">Short Text (max 40 chars)</SelectItem>
                <SelectItem value="textarea">Textarea</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="select">Select (Dropdown)</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!key.trim() || !label.trim()}>Add Field</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (key: string, label: string) => void;
}

export function AddRatingDialog({ open, onOpenChange, onAdd }: AddRatingDialogProps) {
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");

  const handleSubmit = () => {
    if (key.trim() && label.trim()) {
      onAdd(key.trim().toLowerCase().replace(/\s+/g, '_'), label.trim());
      setKey("");
      setLabel("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Rating Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rating-key">Category Key</Label>
            <Input
              id="rating-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g., work_life_balance"
            />
            <p className="text-xs text-muted-foreground">Unique identifier (lowercase, underscores)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rating-label">Category Label</Label>
            <Input
              id="rating-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Work-Life Balance"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!key.trim() || !label.trim()}>Add Category</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddBenefitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (key: string, label: string) => void;
}

export function AddBenefitDialog({ open, onOpenChange, onAdd }: AddBenefitDialogProps) {
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");

  const handleSubmit = () => {
    if (key.trim() && label.trim()) {
      onAdd(key.trim().toLowerCase().replace(/\s+/g, '_'), label.trim());
      setKey("");
      setLabel("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Standard Benefit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="benefit-key">Benefit Key</Label>
            <Input
              id="benefit-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g., health_insurance"
            />
            <p className="text-xs text-muted-foreground">Unique identifier (lowercase, underscores)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="benefit-label">Benefit Label</Label>
            <Input
              id="benefit-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Health Insurance"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!key.trim() || !label.trim()}>Add Benefit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
