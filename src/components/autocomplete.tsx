"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import debounce from "lodash.debounce";
import * as React from "react";

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

type Item = {
  id: string;
  term: string;
  seq: number;
  year?: number | null;
  titleType?: string | null;
};

async function fetchPage(q: string, skip: number, limit: number) {
  const params = new URLSearchParams();
  params.set("q", q);
  params.set("skip", String(skip));
  params.set("limit", String(limit));

  const res = await fetch(`/api/search?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("fetch_failed");

  return res.json() as Promise<{
    items: Item[];
    total: number;
    nextLink: string | null;
  }>;
}

const MIN_CHARS = 3;

export function TermCombobox({
  onSelect,
  limit = 30,
}: {
  onSelect?: (item: Item) => void;
  limit?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Item | null>(null);

  const debouncedSetQuery = React.useMemo(
    () =>
      debounce((value: string) => {
        setQuery(value.trim());
      }, 250),
    [],
  );

  React.useEffect(() => {
    return () => debouncedSetQuery.cancel();
  }, [debouncedSetQuery]);

  const canSearch = query.length >= MIN_CHARS;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["terms", query, limit],
    enabled: canSearch,
    queryFn: async ({ pageParam }) => {
      const skip = typeof pageParam === "number" ? pageParam : 0;
      const page = await fetchPage(query, skip, limit);
      return { ...page, skip };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.nextLink) return undefined;
      const acc = pages.reduce(
        (n: number, p: any) => n + (p.items?.length ?? 0),
        0,
      );
      return acc; // next skip
    },
  });

  // 1) flatten pages
  const flatRaw = React.useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.items),
    [data],
  );

  // 2) dedupe by id to avoid duplicate-key warnings if backend overlaps pages
  const flat = React.useMemo(() => {
    const byId = new Map<string, Item>();
    for (const item of flatRaw) {
      if (!byId.has(item.id)) {
        byId.set(item.id, item);
      }
    }
    return Array.from(byId.values());
  }, [flatRaw]);

  const handleScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    const target = event.currentTarget;
    const nearBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 48;

    if (nearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const displayLabel = selected?.term || "Select term…";

  const emptyMessage = !canSearch
    ? `Type at least ${MIN_CHARS} characters to search.`
    : isLoading || isFetching
      ? "Loading…"
      : "No results.";

  const formatMeta = (item: Item) => {
    const parts: string[] = [];
    if (item.titleType) parts.push(item.titleType);
    if (item.year) parts.push(String(item.year));
    return parts.join(" · ");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {displayLabel}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={input}
            onValueChange={(value) => {
              setInput(value);
              debouncedSetQuery(value);
            }}
            placeholder={`Search titles (min ${MIN_CHARS} chars)…`}
          />

          <CommandEmpty>{emptyMessage}</CommandEmpty>

          <CommandList
            className="max-h-72 overflow-auto"
            onScroll={handleScroll}
          >
            <CommandGroup>
              {flat.map((item) => {
                const meta = formatMeta(item);
                return (
                  <CommandItem
                    key={item.id} // unique + stable
                    value={item.id} // also unique, avoids multi-highlight for same term
                    onSelect={() => {
                      setSelected(item);
                      onSelect?.(item);
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span>{item.term}</span>
                      {meta && (
                        <span className="text-xs text-muted-foreground">
                          {meta}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {isFetchingNextPage && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Loading more…
              </div>
            )}
            {!hasNextPage && flat.length > 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                End of results
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
