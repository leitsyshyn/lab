"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { COUNTRIES } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface MultiSelectComboboxProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  maxDisplayed?: number;
}

export function CountryMultiSelect({
  selected,
  onChange,
  placeholder = "Select countries...",
  maxSelections,
  maxDisplayed = 3,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredCountries = React.useMemo(() => {
    if (!search) return COUNTRIES;
    const searchLower = search.toLowerCase();
    return COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(searchLower) ||
        country.code.toLowerCase().includes(searchLower),
    );
  }, [search]);

  const handleSelect = (countryCode: string) => {
    if (selected.includes(countryCode)) {
      onChange(selected.filter((c) => c !== countryCode));
    } else {
      if (maxSelections && selected.length >= maxSelections) {
        return;
      }
      onChange([...selected, countryCode]);
    }
  };

  const handleRemove = (countryCode: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(selected.filter((c) => c !== countryCode));
  };

  const selectedCountries = selected
    .map((code) => COUNTRIES.find((c) => c.code === code))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  const displayedCountries = selectedCountries.slice(0, maxDisplayed);
  const remainingCount = selectedCountries.length - maxDisplayed;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10"
        >
          <div className="flex items-center gap-1 flex-1 overflow-hidden">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {displayedCountries.map((country) => (
                  <Badge
                    key={country.code}
                    variant="secondary"
                    className="gap-1 shrink-0"
                  >
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                    <span
                      role="button"
                      aria-label={`Remove ${country.name}`}
                      tabIndex={0}
                      className="ml-1 cursor-pointer hover:opacity-70"
                      onMouseDown={(e) => handleRemove(country.code, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          onChange(selected.filter((c) => c !== country.code));
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))}
                {remainingCount > 0 && (
                  <Badge variant="secondary" className="shrink-0">
                    +{remainingCount} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search countries..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandList className="max-h-[300px]">
            <CommandGroup>
              {filteredCountries.map((country) => {
                const isSelected = selected.includes(country.code);
                return (
                  <CommandItem
                    key={country.code}
                    value={country.code}
                    onSelect={() => handleSelect(country.code)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="mr-2">{country.flag}</span>
                    <span>{country.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
