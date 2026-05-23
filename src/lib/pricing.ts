export type SdCounty =
  | "Aurora"
  | "Beadle"
  | "Bennett"
  | "Bon Homme"
  | "Brookings"
  | "Brown"
  | "Brule"
  | "Buffalo"
  | "Butte"
  | "Campbell"
  | "Charles Mix"
  | "Clark"
  | "Clay"
  | "Codington"
  | "Corson"
  | "Custer"
  | "Davison"
  | "Day"
  | "Deuel"
  | "Dewey"
  | "Douglas"
  | "Edmunds"
  | "Fall River"
  | "Faulk"
  | "Grant"
  | "Gregory"
  | "Haakon"
  | "Hamlin"
  | "Hand"
  | "Hanson"
  | "Harding"
  | "Hughes"
  | "Hutchinson"
  | "Hyde"
  | "Jackson"
  | "Jerauld"
  | "Jones"
  | "Kingsbury"
  | "Lake"
  | "Lawrence"
  | "Lincoln"
  | "Lyman"
  | "Marshall"
  | "McCook"
  | "McPherson"
  | "Meade"
  | "Mellette"
  | "Miner"
  | "Minnehaha"
  | "Moody"
  | "Pennington"
  | "Perkins"
  | "Potter"
  | "Roberts"
  | "Sanborn"
  | "Spink"
  | "Stanley"
  | "Sully"
  | "Todd"
  | "Tripp"
  | "Turner"
  | "Union"
  | "Walworth"
  | "Yankton"
  | "Ziebach";

export const SD_COUNTIES: SdCounty[] = [
  "Aurora",
  "Beadle",
  "Bennett",
  "Bon Homme",
  "Brookings",
  "Brown",
  "Brule",
  "Buffalo",
  "Butte",
  "Campbell",
  "Charles Mix",
  "Clark",
  "Clay",
  "Codington",
  "Corson",
  "Custer",
  "Davison",
  "Day",
  "Deuel",
  "Dewey",
  "Douglas",
  "Edmunds",
  "Fall River",
  "Faulk",
  "Grant",
  "Gregory",
  "Haakon",
  "Hamlin",
  "Hand",
  "Hanson",
  "Harding",
  "Hughes",
  "Hutchinson",
  "Hyde",
  "Jackson",
  "Jerauld",
  "Jones",
  "Kingsbury",
  "Lake",
  "Lawrence",
  "Lincoln",
  "Lyman",
  "Marshall",
  "McCook",
  "McPherson",
  "Meade",
  "Mellette",
  "Miner",
  "Minnehaha",
  "Moody",
  "Pennington",
  "Perkins",
  "Potter",
  "Roberts",
  "Sanborn",
  "Spink",
  "Stanley",
  "Sully",
  "Todd",
  "Tripp",
  "Turner",
  "Union",
  "Walworth",
  "Yankton",
  "Ziebach",
];

export type PricingQuote = {
  population: number;
  annualUsd: number;
  monthlyEquivalentUsd: number;
  breakdown: {
    baseAnnualUsd: number;
    perResidentAnnualUsd: number;
    minAnnualUsd: number;
    maxAnnualUsd: number;
  };
};

// Simple, transparent pricing formula (tweak anytime):
// annual = clamp(min, base + population * perResident)
export function quoteAnnual(population: number): PricingQuote {
  const safePop = Number.isFinite(population) ? Math.max(0, Math.floor(population)) : 0;

  const baseAnnualUsd = 150;
  const perResidentAnnualUsd = 0.004; // $0.004 / resident / year (=$4 per 1,000 residents / year)
  const minAnnualUsd = 190;
  const maxAnnualUsd = 990;

  const raw = baseAnnualUsd + safePop * perResidentAnnualUsd;
  const annualUsd = Math.min(maxAnnualUsd, Math.max(minAnnualUsd, Math.round(raw)));
  const monthlyEquivalentUsd = Math.round((annualUsd / 12) * 100) / 100;

  return {
    population: safePop,
    annualUsd,
    monthlyEquivalentUsd,
    breakdown: { baseAnnualUsd, perResidentAnnualUsd, minAnnualUsd, maxAnnualUsd },
  };
}
