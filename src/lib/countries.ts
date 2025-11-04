import countries from "world-countries";

export const COUNTRIES = countries
  .map((country) => ({
    code: country.cca3,
    name: country.name.common,
    flag: country.flag,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getCountryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

export function getCountryFlag(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.flag ?? "";
}
