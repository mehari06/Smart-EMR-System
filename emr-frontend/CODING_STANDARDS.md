# Smart EMR Frontend — Coding Standards & Guidelines

This document outlines coding standards for the React/Next.js frontend.

---

## 1. Naming Conventions

### TypeScript / React
- **Components:** `PascalCase` (e.g., `PatientSearchSelect`, `CreateAppointmentModal`)
- **Hooks:** `camelCase` with `use` prefix (e.g., `usePatients`, `useDebounce`)
- **Functions:** `camelCase` (e.g., `handleSubmit`, `formatDate`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `STATUS_COLORS`, `API_BASE_URL`)
- **Types/Interfaces:** `PascalCase` (e.g., `AppointmentListItem`, `PatientDetail`)
- **Files:**
  - Components: `PascalCase.tsx` (e.g., `StatusBadge.tsx`)
  - Hooks: `camelCase.ts` (e.g., `usePatients.ts`)
  - Types: `camelCase.ts` (e.g., `appointments.ts`)
  - API clients: `camelCase.ts` (e.g., `patients.ts`)

---

## 2. Component Structure

Every component must follow:
1. Imports
2. Type definitions
3. Constants (if any)
4. Component definition
5. Helper functions (if needed)
6. Export

### Example:
```tsx
// 1. Imports
import { useState } from 'react';
import { usePatients } from '@/hooks/usePatients';

// 2. Types
interface PatientListProps {
  patients: PatientListItem[];
}

// 3. Constants
const PAGE_SIZE = 10;

// 4. Component
export function PatientList({ patients }: PatientListProps) {
  const [page, setPage] = useState(1);
  // ...
  return <div>...</div>;
}
3. File Organization
text
emr-frontend/
├── app/                    → Next.js pages (routing)
│   ├── (authenticated)/    → Protected routes
│   └── login/              → Public routes
├── components/             → Reusable components
│   ├── ui/                 → shadcn/ui primitives
│   ├── dashboard/          → Dashboard-specific
│   └── encounters/         → Encounter-specific
├── hooks/                  → Custom React hooks
├── lib/
│   ├── api/               → API client modules
│   └── utils/             → Utility functions
├── store/                 → Zustand stores
├── types/                 → TypeScript types
└── __tests__/             → Test files
4. State Management
TanStack Query (Server State)
Use for ALL API data fetching

Always define query keys

Use staleTime for caching

Use placeholderData for pagination

tsx
export function usePatients(params) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => patientsApi.list(params),
    staleTime: 1000 * 60 * 5,
  });
}
Zustand (Client State)
Use ONLY for auth/user state

Keep store minimal

Use persist middleware for session

5. API Layer
Rules:
All API calls go through lib/api/

Use apiClient from lib/api/client.ts

Handle errors in hooks, not components

Use TypeScript types for responses

tsx
export const patientsApi = {
  list: (params) => 
    apiClient.get('/patients', { params }).then(r => r.data),
  get: (id) => 
    apiClient.get(`/patients/${id}`).then(r => r.data),
};
6. TypeScript Standards
Use interface for object types

Use type for unions/aliases

Avoid any - use proper types

Export types from types/ directory

typescript
// Good
interface Patient {
  id: number;
  patient_number: string;
}

// Bad
const patient: any = data;
7. Styling (Tailwind CSS)
Use Tailwind utility classes

Group related classes

Use cn() utility for conditional classes

Follow responsive pattern: mobile → tablet → desktop

tsx
className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
8. Testing Standards
Unit tests: __tests__/unit/

Integration tests: __tests__/integration/

E2E tests: tests/e2e/

Use Testing Library best practices

Mock API with MSW (Mock Service Worker)

tsx
describe('StatusBadge', () => {
  it('renders Scheduled status', () => {
    render(<StatusBadge status="S" />);
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });
});
9. Performance
Use useMemo for expensive computations

Use useCallback for callback props

Use dynamic imports for large components

Use Next.js Image component

Avoid unnecessary re-renders

10. Accessibility
Use semantic HTML elements

Add aria-label to icon-only buttons

Ensure color contrast

Use keyboard navigation

Test with screen readers