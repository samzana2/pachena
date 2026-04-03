"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  DollarSign,
  Star,
  MessageSquare,
  ThumbsUp,
  Lock,
  User,
  Building2,
  Users,
  Shield,
  Heart,
  Award,
  Clock,
  Calendar,
  FileText,
  Settings,
  Home,
  Mail,
  Phone,
  MapPin,
  Globe,
  Zap,
  Target,
  TrendingUp,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";

const AVAILABLE_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: "Briefcase", icon: Briefcase },
  { name: "DollarSign", icon: DollarSign },
  { name: "Star", icon: Star },
  { name: "MessageSquare", icon: MessageSquare },
  { name: "ThumbsUp", icon: ThumbsUp },
  { name: "Lock", icon: Lock },
  { name: "User", icon: User },
  { name: "Building2", icon: Building2 },
  { name: "Users", icon: Users },
  { name: "Shield", icon: Shield },
  { name: "Heart", icon: Heart },
  { name: "Award", icon: Award },
  { name: "Clock", icon: Clock },
  { name: "Calendar", icon: Calendar },
  { name: "FileText", icon: FileText },
  { name: "Settings", icon: Settings },
  { name: "Home", icon: Home },
  { name: "Mail", icon: Mail },
  { name: "Phone", icon: Phone },
  { name: "MapPin", icon: MapPin },
  { name: "Globe", icon: Globe },
  { name: "Zap", icon: Zap },
  { name: "Target", icon: Target },
  { name: "TrendingUp", icon: TrendingUp },
  { name: "CheckCircle", icon: CheckCircle },
];

interface IconPickerProps {
  value: string | null;
  onChange: (iconName: string | null) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedIcon = AVAILABLE_ICONS.find((i) => i.name === value);
  const SelectedIconComponent = selectedIcon?.icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          {SelectedIconComponent ? (
            <>
              <SelectedIconComponent className="h-4 w-4" strokeWidth={1.5} />
              <span>{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select icon...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid grid-cols-5 gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 w-9 p-0",
              !value && "bg-primary/10 text-primary"
            )}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            <span className="text-xs">None</span>
          </Button>
          {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
            <Button
              key={name}
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-9 p-0",
                value === name && "bg-primary/10 text-primary"
              )}
              onClick={() => {
                onChange(name);
                setOpen(false);
              }}
              title={name}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
