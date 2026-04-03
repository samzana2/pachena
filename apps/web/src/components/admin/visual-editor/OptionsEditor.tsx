"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface OptionsEditorProps {
  options: string[];
  onChange: (options: string[]) => void;
}

function SortableOption({
  id,
  option,
  index,
  onRemove,
  onUpdate,
}: {
  id: string;
  option: string;
  index: number;
  onRemove: () => void;
  onUpdate: (value: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 bg-background rounded border p-2",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <Input
        value={option}
        onChange={(e) => onUpdate(e.target.value)}
        className="h-8 flex-1"
        placeholder="Option value"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
      </Button>
    </div>
  );
}

export function OptionsEditor({ options, onChange }: OptionsEditorProps) {
  const [newOption, setNewOption] = useState("");
  const stableIdsRef = useRef<string[]>([]);
  
  // Generate stable IDs that persist across value changes
  useEffect(() => {
    // Add new IDs for any new options
    while (stableIdsRef.current.length < options.length) {
      stableIdsRef.current.push(`opt-${Date.now()}-${stableIdsRef.current.length}`);
    }
    // Trim if options were removed
    if (stableIdsRef.current.length > options.length) {
      stableIdsRef.current = stableIdsRef.current.slice(0, options.length);
    }
  }, [options.length]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stableIdsRef.current.indexOf(active.id as string);
      const newIndex = stableIdsRef.current.indexOf(over.id as string);
      stableIdsRef.current = arrayMove(stableIdsRef.current, oldIndex, newIndex);
      onChange(arrayMove(options, oldIndex, newIndex));
    }
  };

  const addOption = () => {
    if (newOption.trim()) {
      stableIdsRef.current.push(`opt-${Date.now()}-${stableIdsRef.current.length}`);
      onChange([...options, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    stableIdsRef.current = stableIdsRef.current.filter((_, i) => i !== index);
    onChange(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    onChange(updated);
  };

  // Ensure we have stable IDs for initial render
  if (stableIdsRef.current.length !== options.length) {
    stableIdsRef.current = options.map((_, i) => `opt-${Date.now()}-${i}`);
  }

  return (
    <div className="space-y-3">
      <Label>Options</Label>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={stableIdsRef.current}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {options.map((option, index) => (
              <SortableOption
                key={stableIdsRef.current[index]}
                id={stableIdsRef.current[index]}
                option={option}
                index={index}
                onRemove={() => removeOption(index)}
                onUpdate={(value) => updateOption(index, value)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex gap-2">
        <Input
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          placeholder="Add new option..."
          className="h-8"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOption();
            }
          }}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={addOption}
          disabled={!newOption.trim()}
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}