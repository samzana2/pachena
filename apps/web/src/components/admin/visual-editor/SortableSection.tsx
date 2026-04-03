import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

interface SortableSectionProps {
  id: string;
  children: ReactNode;
}

export function SortableSection({ id, children }: SortableSectionProps) {
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
      className={cn("relative group", isDragging && "opacity-50 z-50")}
    >
      <button
        type="button"
        className={cn(
          "absolute -left-8 top-4 cursor-grab touch-none p-1 rounded",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" strokeWidth={1.5} />
      </button>
      {children}
    </div>
  );
}
