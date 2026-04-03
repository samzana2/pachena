"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CURRENCIES, findCurrency } from "@/lib/currencies";
import { ChevronDown, Search } from "lucide-react";

/** Format a raw digit string with thousand separators for display */
function formatWithCommas(raw: string): string {
  if (!raw) return "";
  return Number(raw).toLocaleString("en-US");
}

/** Strip everything except digits */
function stripNonDigits(val: string): string {
  return val.replace(/[^0-9]/g, "");
}

interface SalaryInputProps {
  currencyValue: string;
  amountValue: string;
  onCurrencyChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  amountPlaceholder?: string;
  disabled?: boolean;
  hasError?: boolean;
}

export function SalaryInput({
  currencyValue,
  amountValue,
  onCurrencyChange,
  onAmountChange,
  amountPlaceholder = "Amount",
  disabled = false,
  hasError = false,
}: SalaryInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = findCurrency(currencyValue);

  const filtered = search.trim()
    ? CURRENCIES.filter(c => {
        const q = search.toLowerCase();
        return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      })
    : CURRENCIES;

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-2 text-sm font-medium shrink-0 hover:bg-muted transition-colors",
              hasError && "border-destructive",
              disabled && "opacity-50 pointer-events-none"
            )}
          >
            {selected ? (
              <>
                <span className="text-base leading-none">{selected.flag}</span>
                <span>{selected.code}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Currency</span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Type a currency / country"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">No currencies found</p>
            ) : (
              filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onCurrencyChange(c.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left",
                    currencyValue === c.code && "bg-muted"
                  )}
                >
                  <span className="text-lg leading-none">{c.flag}</span>
                  <span className="font-medium">{c.code}</span>
                  <span className="text-muted-foreground">{c.name}</span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      <Input
        type="text"
        inputMode="numeric"
        placeholder={amountPlaceholder}
        value={formatWithCommas(amountValue)}
        onChange={(e) => {
          const raw = stripNonDigits(e.target.value);
          onAmountChange(raw);
        }}
        disabled={disabled}
        className={cn("flex-1", hasError && "border-destructive")}
      />
    </div>
  );
}
