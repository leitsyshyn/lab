// components/TermCombobox.tsx
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
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

type Item = { id: string; term: string; seq: number };

async function fetchPage(q: string, skip: number, limit: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
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

export function TermCombobox({
  onSelect,
  limit = 50,
}: {
  onSelect?: (item: Item) => void;
  limit?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  const setQDebounced = React.useMemo(
    () => debounce((v: string) => setQ(v), 200),
    [],
  );
  React.useEffect(() => () => setQDebounced.cancel(), [setQDebounced]);

  const { data, fetchNextPage, hasNextPage, isFetching, isLoading } =
    useInfiniteQuery({
      queryKey: ["terms", q, limit],
      queryFn: async ({ pageParam }) => {
        const skip = typeof pageParam === "number" ? pageParam : 0;
        const page = await fetchPage(q, skip, limit);
        return { ...page, skip };
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) => {
        if (!lastPage.nextLink) return undefined;
        // next skip = accumulated item count (works with stable seq order)
        const acc = pages.reduce(
          (n: number, p: any) => n + (p.items?.length ?? 0),
          0,
        );
        return acc;
      },
    });

  const flat = React.useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.items),
    [data],
  );

  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? flat.length + 1 : flat.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 8,
  });

  React.useEffect(() => {
    const items = rowVirtualizer.getVirtualItems();
    const last = items[items.length - 1];
    if (!last) return;
    if (last.index >= flat.length - 1 && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [rowVirtualizer, flat.length, hasNextPage, isFetching, fetchNextPage]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {q || "Select term..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search…"
            onValueChange={(v) => setQDebounced(v)}
          />
          <CommandEmpty>{isLoading ? "Loading…" : "No results."}</CommandEmpty>

          <CommandList
            ref={parentRef}
            style={{ height: 300, overflow: "auto", position: "relative" }}
          >
            <div
              style={{
                height: rowVirtualizer.getTotalSize(),
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((vi) => {
                const isLoader = vi.index >= flat.length;
                const item = flat[vi.index];
                return (
                  <div
                    key={isLoader ? "loader" : item.seq} // stable key via numeric sort key
                    data-index={vi.index}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${vi.start}px)`,
                    }}
                  >
                    {isLoader ? (
                      <div className="px-2 py-2 text-sm text-muted-foreground">
                        {hasNextPage ? "Loading more…" : "End of results"}
                      </div>
                    ) : (
                      <CommandItem
                        value={item.term}
                        onSelect={() => {
                          onSelect?.(item);
                          setOpen(false);
                        }}
                      >
                        {item.term}
                      </CommandItem>
                    )}
                  </div>
                );
              })}
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
