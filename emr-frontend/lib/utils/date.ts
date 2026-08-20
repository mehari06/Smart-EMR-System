export function calculateAge(dateOfBirth: string | undefined): number {
  if (!dateOfBirth) return 0;
  
  const dob = new Date(dateOfBirth);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs); // miliseconds from epoch
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}
