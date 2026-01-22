const GH_PREFIXES = ['020', '050', '024', '054', '055', '059', '027', '057', '026', '056'];

export const normalizeGhanaPhone = (input: string): string => {
  const trimmed = input.replace(/\s+/g, '').replace(/-/g, '');
  if (trimmed.startsWith('+233')) return `+233${trimmed.slice(4)}`;
  if (trimmed.startsWith('233')) return `+233${trimmed.slice(3)}`;
  if (trimmed.startsWith('0')) return `+233${trimmed.slice(1)}`;
  return trimmed;
};

export const isValidGhanaPhone = (input: string): boolean => {
  const phone = normalizeGhanaPhone(input);
  if (!/^\+233\d{9}$/.test(phone)) return false;
  const local = `0${phone.slice(4, 7)}`;
  return GH_PREFIXES.includes(local);
};

export const isValidOtp = (input: string, length = 6): boolean => {
  return new RegExp(`^\\d{${length}}$`).test(input);
};
