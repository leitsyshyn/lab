// "use client";

// import { Search } from "lucide-react";
// import { useState } from "react";
// import { TermCombobox } from "@/components/autocomplete";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Item,
//   ItemContent,
//   ItemDescription,
//   ItemGroup,
//   ItemHeader,
//   ItemMedia,
//   ItemTitle,
// } from "@/components/ui/item";

// export default function ComboboxPage() {
//   const [selectedItem, setSelectedItem] = useState<{
//     id: string;
//     term: string;
//   } | null>(null);

//   return (
//     <main className="container mx-auto px-4 py-8">
//       <div className="max-w-2xl mx-auto">
//         <Card>
//             <CardHeader>
//               <CardTitle>Search Demo</CardTitle>
//               <CardDescription>
//                 Search and select items using Typesense
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <ItemGroup className="gap-6">
//                 <Item className="p-0">
//                   <ItemHeader className="font-semibold">Search</ItemHeader>
//                   <ItemContent className="w-full">
//                     <TermCombobox
//                       onSelect={(item) => {
//                         console.log("Selected", item);
//                         setSelectedItem(item);
//                       }}
//                     />
//                   </ItemContent>
//                 </Item>

//                 {selectedItem && (
//                   <Item className="p-0">
//                     <ItemHeader className="font-semibold">
//                       Selected Item
//                     </ItemHeader>
//                     <ItemMedia variant="icon">
//                       <Search className="h-4 w-4" />
//                     </ItemMedia>
//                     <ItemContent>
//                       <ItemTitle>{selectedItem.term}</ItemTitle>
//                       <ItemDescription>ID: {selectedItem.id}</ItemDescription>
//                     </ItemContent>
//                   </Item>
//               )}
//             </ItemGroup>
//           </CardContent>
//         </Card>
//       </div>
//     </main>
//   );
// }

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

type Selected = {
  id: string;
  term: string;
  seq?: number;
};

export default function ComboboxPage() {
  const [selectedItem, setSelectedItem] = useState<Selected | null>(null);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Search Demo</CardTitle>
            <CardDescription>
              Search and select items from a large index using Typesense
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
    </main>
  );
}
