import { z } from 'zod';

export const patientFormSchema = z.object({
  first_name: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  last_name: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  gender: z.enum(['Male', 'Female', 'Other'], {
    required_error: 'Please select a gender',
  }),
  phone: z
    .string()
    .regex(/^\+?[\d\s-]{10,}$/, 'Please enter a valid phone number'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.string().optional(),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;