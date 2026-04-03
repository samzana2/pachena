import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TraceCard } from "@/components/ui/trace-card";
import { cn } from "@/lib/utils";
import { ReactNode, forwardRef } from "react";

interface FormSectionCardProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  optional?: boolean;
  hasError?: boolean;
}

export const FormSectionCard = forwardRef<HTMLDivElement, FormSectionCardProps>(
  ({ id, title, description, children, className, optional, hasError }, ref) => {
    return (
      <TraceCard 
        ref={ref}
        id={`section-${id}`}
        autoTrace
        className={cn(
          "scroll-mt-24",
          hasError && "border-destructive",
          className
        )}
      >
        <CardHeader className="pb-4">
          <CardTitle className={cn("text-lg flex items-center gap-2", hasError && "text-destructive")}>
            {title}
            {optional && (
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Optional
              </span>
            )}
          </CardTitle>
          {description && (
            <CardDescription className="mt-1">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </TraceCard>
    );
  }
);

FormSectionCard.displayName = "FormSectionCard";
