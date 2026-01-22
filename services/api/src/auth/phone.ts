export const normalizeGhanaPhone = (input: string): string => {
  const trimmed = input.replace(/\s+/g, '').replace(/-/g, '');
  if (trimmed.startsWith('+233')) return `+233${trimmed.slice(4)}`;
  if (trimmed.startsWith('233')) return `+233${trimmed.slice(3)}`;
  if (trimmed.startsWith('0')) return `+233${trimmed.slice(1)}`;
  return trimmed;
};

export const maskPhone = (phone: string): string => {
  if (phone.length < 6) return phone;
  const end = phone.slice(-3);
  return `${phone.slice(0, 4)}******${end}`;
};
