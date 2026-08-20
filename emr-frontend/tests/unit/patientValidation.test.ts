import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate the schema for testing
const createPatientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Min 8 characters'),
  date_of_birth: z.string().min(1, 'Date of birth required'),
  gender: z.enum(['M', 'F']),
  phone: z.string().min(7, 'Phone required'),
  address: z.string().min(1, 'Address required'),
  emergency_contact_name: z.string().min(1, 'Emergency contact required'),
  emergency_contact_phone: z.string().min(7, 'Emergency contact phone required'),
});

describe('Create Patient Validation', () => {
  it('accepts valid data', () => {
    const validData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      password: 'password123',
      date_of_birth: '1990-01-01',
      gender: 'M',
      phone: '0912345678',
      address: 'Test Address',
      emergency_contact_name: 'Jane Doe',
      emergency_contact_phone: '0999999999',
    };
    
    expect(() => createPatientSchema.parse(validData)).not.toThrow();
  });

  it('rejects invalid email', () => {
    const invalidData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'invalid-email',
      password: 'password123',
      date_of_birth: '1990-01-01',
      gender: 'M',
      phone: '0912345678',
      address: 'Test Address',
      emergency_contact_name: 'Jane Doe',
      emergency_contact_phone: '0999999999',
    };
    
    expect(() => createPatientSchema.parse(invalidData)).toThrow();
  });

  it('rejects short password', () => {
    const invalidData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      password: 'short',
      date_of_birth: '1990-01-01',
      gender: 'M',
      phone: '0912345678',
      address: 'Test Address',
      emergency_contact_name: 'Jane Doe',
      emergency_contact_phone: '0999999999',
    };
    
    expect(() => createPatientSchema.parse(invalidData)).toThrow();
  });

  it('rejects invalid gender', () => {
    const invalidData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      password: 'password123',
      date_of_birth: '1990-01-01',
      gender: 'X',
      phone: '0912345678',
      address: 'Test Address',
      emergency_contact_name: 'Jane Doe',
      emergency_contact_phone: '0999999999',
    };
    
    expect(() => createPatientSchema.parse(invalidData)).toThrow();
  });
});