import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const passwordRules = {
  upper: /[A-Z]/,
  lower: /[a-z]/,
  number: /[0-9]/,
  special: /[^A-Za-z0-9]/,
  length: (v: string) => v?.length >= 8 && v?.length <= 128,
};

export const getPasswordScore = (password: string) => {
  return Object.values({
    upper: passwordRules.upper.test(password),
    lower: passwordRules.lower.test(password),
    number: passwordRules.number.test(password),
    special: passwordRules.special.test(password),
    length: passwordRules.length(password),
  }).filter(Boolean).length;
};
