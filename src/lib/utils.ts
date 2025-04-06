import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date, format: string): string {
  const pad = (num: number): string => num.toString().padStart(2, '0');

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const shortMonths = months.map((m) => m.substring(0, 3));

  const tokens: Record<string, () => string> = {
    YYYY: () => date.getFullYear().toString(),
    YY: () => date.getFullYear().toString().slice(-2),
    MMMM: () => months[date.getMonth()],
    MMM: () => shortMonths[date.getMonth()],
    MM: () => pad(date.getMonth() + 1),
    M: () => (date.getMonth() + 1).toString(),
    DD: () => pad(date.getDate()),
    D: () => date.getDate().toString(),
    HH: () => pad(date.getHours()),
    H: () => date.getHours().toString(),
    hh: () => pad(date.getHours() % 12 || 12),
    h: () => (date.getHours() % 12 || 12).toString(),
    mm: () => pad(date.getMinutes()),
    m: () => date.getMinutes().toString(),
    ss: () => pad(date.getSeconds()),
    s: () => date.getSeconds().toString(),
    A: () => (date.getHours() < 12 ? 'AM' : 'PM'),
    a: () => (date.getHours() < 12 ? 'am' : 'pm'),
  };

  // Replace square brackets content with a placeholder
  const bracketedTexts: string[] = [];
  const formatWithoutBrackets = format.replace(/\[([^\]]+)\]/g, (_, text) => {
    bracketedTexts.push(text);
    return `§§${bracketedTexts.length - 1}§§`;
  });

  // Replace tokens
  let result = formatWithoutBrackets;
  const tokenRegex = new RegExp(Object.keys(tokens).join('|'), 'g');
  result = result.replace(tokenRegex, (match) => tokens[match]());

  // Restore bracketed content
  result = result.replace(
    /§§(\d+)§§/g,
    (_, index) => bracketedTexts[Number.parseInt(index)]
  );

  return result;
}
