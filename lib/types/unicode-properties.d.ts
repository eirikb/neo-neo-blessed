declare module 'unicode-properties' {
  export function getCategory(codePoint: number): string;
  export function getScript(codePoint: number): string;
  export function getEastAsianWidth(codePoint: number): string;
  export function getNumericValue(codePoint: number): number | null;
  export function isAlphabetic(codePoint: number): boolean;
  export function isUppercase(codePoint: number): boolean;
  export function isLowercase(codePoint: number): boolean;
  export function isWhiteSpace(codePoint: number): boolean;
}
