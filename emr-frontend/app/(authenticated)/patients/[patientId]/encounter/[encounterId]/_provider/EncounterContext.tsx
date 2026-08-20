'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useEncounter } from '@/hooks/useEncounter';
import { usePatient } from '@/hooks/usePatients';
import { Encounter } from '@/types/clinical';
import { Patient } from '@/types/patient';

interface EncounterContextType {
  encounter: Encounter | undefined;
  patient: Patient | undefined;
  isLoading: boolean;
  isError: boolean;
  encounterId: number;
  patientId: number;
}

const EncounterContext = createContext<EncounterContextType | undefined>(undefined);

export const EncounterProvider = ({
  children,
  encounterId,
  patientId,
}: {
  children: ReactNode;
  encounterId: number;
  patientId: number;
}) => {
  const { data: encounter, isLoading: isLoadingEncounter, isError: isErrorEncounter } = useEncounter(encounterId);
  const { data: patient, isLoading: isLoadingPatient, isError: isErrorPatient } = usePatient(patientId);

  const isLoading = isLoadingEncounter || isLoadingPatient;
  const isError = isErrorEncounter || isErrorPatient;

  return (
    <EncounterContext.Provider
      value={{
        encounter,
        patient,
        isLoading,
        isError,
        encounterId,
        patientId,
      }}
    >
      {children}
    </EncounterContext.Provider>
  );
};

export const useEncounterContext = () => {
  const context = useContext(EncounterContext);
  if (context === undefined) {
    throw new Error('useEncounterContext must be used within an EncounterProvider');
  }
  return context;
};
