"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { TermCombobox } from "@/components/autocomplete";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";

export default function ComboboxPage() {
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    term: string;
  } | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Demo</CardTitle>
              <CardDescription>
                Search and select items using Typesense
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ItemGroup className="gap-6">
                <Item className="p-0">
                  <ItemHeader className="font-semibold">Search</ItemHeader>
                  <ItemContent className="w-full">
                    <TermCombobox
                      onSelect={(item) => {
                        console.log("Selected", item);
                        setSelectedItem(item);
                      }}
                    />
                  </ItemContent>
                </Item>

                {selectedItem && (
                  <Item className="p-0">
                    <ItemHeader className="font-semibold">
                      Selected Item
                    </ItemHeader>
                    <ItemMedia variant="icon">
                      <Search className="h-4 w-4" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{selectedItem.term}</ItemTitle>
                      <ItemDescription>ID: {selectedItem.id}</ItemDescription>
                    </ItemContent>
                  </Item>
                )}
              </ItemGroup>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
