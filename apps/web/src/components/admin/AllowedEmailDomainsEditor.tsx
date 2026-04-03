"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";

interface AllowedEmailDomainsEditorProps {
  domains: string[];
  onChange: (domains: string[]) => void;
  websiteDomain?: string;
}

export function AllowedEmailDomainsEditor({ 
  domains, 
  onChange, 
  websiteDomain 
}: AllowedEmailDomainsEditorProps) {
  const [newDomain, setNewDomain] = useState("");
  const [error, setError] = useState("");

  const validateDomain = (domain: string): boolean => {
    // Basic domain validation - should contain at least one dot and no spaces
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
    return domainRegex.test(domain);
  };

  const handleAddDomain = () => {
    const normalized = newDomain.toLowerCase().replace(/^www\./, "").trim();
    
    if (!normalized) {
      setError("Please enter a domain");
      return;
    }

    if (!validateDomain(normalized)) {
      setError("Please enter a valid domain (e.g., example.org)");
      return;
    }

    if (domains.includes(normalized)) {
      setError("This domain is already added");
      return;
    }

    if (websiteDomain && normalized === websiteDomain.toLowerCase().replace(/^www\./, "")) {
      setError("This domain matches the website domain (already included automatically)");
      return;
    }

    onChange([...domains, normalized]);
    setNewDomain("");
    setError("");
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    onChange(domains.filter(d => d !== domainToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddDomain();
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Additional Email Domains</Label>
        <p className="text-sm text-muted-foreground">
          Add extra domains that employees can use for verification (besides the website domain).
        </p>
      </div>

      {websiteDomain && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Primary domain from website:</span>
          <Badge variant="outline" className="font-mono">
            {websiteDomain}
          </Badge>
          <span className="text-xs">(automatic)</span>
        </div>
      )}

      {/* Current domains */}
      {domains.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {domains.map((domain) => (
            <Badge
              key={domain}
              variant="secondary"
              className="flex items-center gap-1 font-mono"
            >
              {domain}
              <button
                type="button"
                onClick={() => handleRemoveDomain(domain)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                aria-label={`Remove ${domain}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add new domain */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="example.org"
            value={newDomain}
            onChange={(e) => {
              setNewDomain(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            className="font-mono"
          />
          {error && (
            <p className="text-sm text-destructive mt-1">{error}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddDomain}
          aria-label="Add domain"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: Use this for companies where employees use a different email domain than the website 
        (e.g., website is company.com but employees use @company.org).
      </p>
    </div>
  );
}
