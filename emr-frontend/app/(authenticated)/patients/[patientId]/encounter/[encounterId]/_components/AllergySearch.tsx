'use client';

import { useState, useEffect } from 'react';
import { useAllergySearch } from '@/hooks/useAllergies';
import { Allergy } from '@/types/allergies';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce'; // Assuming this exists or I'll create it
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';

interface AllergySearchProps {
  onSelect: (allergy: Allergy) => void;
}

export function AllergySearch({ onSelect }: AllergySearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  const { data, isLoading } = useAllergySearch(debouncedSearch);
  const results = data?.results || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search allergens (e.g., Peanuts, Penicillin)..." 
            className="pl-9 cursor-pointer"
            readOnly
            onClick={() => setOpen(true)}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command className="flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-slate-950" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Type allergen name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin text-slate-400" />}
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            {!isLoading && results.length === 0 && search.length >= 3 && (
              <div className="py-6 text-center text-sm text-slate-500">
                No allergens found.
              </div>
            )}
            {!isLoading && search.length < 3 && (
              <div className="py-6 text-center text-sm text-slate-500">
                Please enter at least 3 characters.
              </div>
            )}
            {results.length > 0 && (
              <CommandGroup>
                {results.map((allergy: Allergy) => (
                  <CommandItem
                    key={allergy.id}
                    value={allergy.name}
                    onSelect={() => {
                      onSelect(allergy);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="flex cursor-pointer items-center px-4 py-2 text-sm hover:bg-slate-100 aria-selected:bg-slate-100"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{allergy.name}</span>
                      <span className="text-xs text-slate-500">
                        {allergy.category === 'D' ? 'Drug' : 
                         allergy.category === 'F' ? 'Food' : 
                         allergy.category === 'E' ? 'Environmental' : 'Other'}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
