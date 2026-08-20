'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, User } from 'lucide-react';
import { patientsApi, type PatientListItem } from '@/lib/api/patients';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PatientSearchSelectProps {
  value: number | null;
  onChange: (patientId: number | null) => void;
  error?: string;
  disabled?: boolean;
}

export function PatientSearchSelect({ value, onChange, error, disabled }: PatientSearchSelectProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  // Fetch patients based on search
  const { data, isLoading } = useQuery({
    queryKey: ['patients', 'search', debouncedSearch],
    queryFn: () => patientsApi.list({ 
      search: debouncedSearch || undefined, 
      page_size: 20 
    }),
    enabled: isOpen, // Only fetch when dropdown is open
  });

  const patients = data?.results ?? [];

  const handleSelect = (patient: PatientListItem) => {
    setSelectedPatient(patient);
    onChange(patient.id);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    setSelectedPatient(null);
    onChange(null);
    setSearch('');
  };

  return (
    <div className="relative">
      {/* Selected patient display / Search input */}
      {selectedPatient ? (
        <div className="flex items-center justify-between w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{selectedPatient.full_name}</p>
              <p className="text-xs text-slate-400">
                {selectedPatient.patient_number || `ID: ${selectedPatient.id}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-red-500 transition-colors"
            disabled={disabled}
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search patient by name or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              // Delay closing to allow click on dropdown
              setTimeout(() => setIsOpen(false), 200);
            }}
            className="pl-9"
            disabled={disabled}
          />
        </div>
      )}

      {/* Dropdown results */}
      {isOpen && !selectedPatient && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg max-h-60 overflow-y-auto">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}

          {/* Empty state */}
          {!isLoading && patients.length === 0 && (
            <div className="p-4 text-center text-sm text-slate-500">
              {search.length > 0 ? 'No patients found' : 'Type to search patients'}
            </div>
          )}

          {/* Results list */}
          {!isLoading && patients.length > 0 && (
            <ul>
              {patients.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(patient)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {patient.full_name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {patient.patient_number} • {patient.phone}
                      </p>
                    </div>
                    {patient.is_active ? (
                      <span className="text-xs text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-xs text-slate-400">Inactive</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}