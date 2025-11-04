import countries from "world-countries";

export const COUNTRIES = countries
  .map((country) => ({
    // World Bank uses ISO 3166-1 alpha-3 codes
    code: country.cca3,
    name: country.name.common,
    flag: country.flag, // Emoji flag
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getCountryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

export function getCountryFlag(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.flag ?? "";
}
