interface Section {
  id: string;
  label: string;
}

const SECTIONS: Section[] = [
  { id: "employment", label: "Employment" },
  { id: "compensation", label: "Compensation" },
  { id: "ratings", label: "Ratings" },
  { id: "review", label: "Review" },
  { id: "demographics", label: "Demographics" },
  { id: "feedback", label: "Feedback" },
];

interface FormProgressIndicatorProps {
  activeSection: string;
  completedSections: Set<string>;
}

export function FormProgressIndicator({ 
  activeSection, 
  completedSections 
}: FormProgressIndicatorProps) {
  const activeSectionIndex = SECTIONS.findIndex(s => s.id === activeSection);
  const progressPercentage = ((activeSectionIndex + 1) / SECTIONS.length) * 100;

  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div 
        className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
        style={{ width: `${progressPercentage}%` }}
      />
    </div>
  );
}

export { SECTIONS };
