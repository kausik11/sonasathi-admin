export type CategoryField = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  options?: string[];
  step?: string;
  unit?: string;
};

const ringSizes = Array.from({ length: 30 }, (_, index) => String(index + 1));

const fieldsByCategory: Record<string, CategoryField[]> = {
  rings: [
    { key: "ringSize", label: "Ring size", type: "select", options: ringSizes },
    { key: "ringSizeSystem", label: "Ring size system", type: "select", options: ["Indian", "US", "UK"] },
    { key: "ringStyle", label: "Ring style", type: "select", options: ["Solitaire", "Band", "Cocktail", "Engagement", "Other"] },
  ],
  bangles: [
    { key: "bangleSize", label: "Bangle size", type: "select", options: ["2.2", "2.4", "2.6", "2.8", "2.10", "2.12"] },
    { key: "bangleStyle", label: "Bangle style", type: "select", options: ["Kada", "Openable", "Slip-on", "Cuff", "Other"] },
  ],
  bracelets: [
    { key: "braceletLengthCm", label: "Bracelet length", type: "number", step: "0.1", unit: "cm" },
    { key: "braceletStyle", label: "Bracelet style", type: "select", options: ["Chain", "Tennis", "Charm", "Bangle", "Other"] },
    { key: "braceletClosure", label: "Closure", type: "select", options: ["Lobster clasp", "Toggle", "Box clasp", "Adjustable", "Other"] },
  ],
  earrings: [
    { key: "earringStyle", label: "Earring style", type: "select", options: ["Studs", "Drops", "Hoops", "Jhumkas", "Chandbalis", "Other"] },
    { key: "earringClosure", label: "Earring closure", type: "select", options: ["Push back", "Screw back", "Hook", "Hinged", "Other"] },
    { key: "pairCount", label: "Number of pairs", type: "number", step: "1" },
  ],
  pendants: [
    { key: "pendantStyle", label: "Pendant style", type: "text" },
    { key: "chainIncluded", label: "Chain included", type: "select", options: ["Yes", "No"] },
    { key: "chainLengthCm", label: "Chain length", type: "number", step: "0.1", unit: "cm" },
  ],
  necklaces: [
    { key: "necklaceStyle", label: "Necklace style", type: "select", options: ["Choker", "Princess", "Matinee", "Long", "Layered", "Other"] },
    { key: "necklaceLengthCm", label: "Necklace length", type: "number", step: "0.1", unit: "cm" },
    { key: "closure", label: "Closure", type: "text" },
  ],
  chains: [
    { key: "chainStyle", label: "Chain style", type: "text" },
    { key: "chainLengthCm", label: "Chain length", type: "number", step: "0.1", unit: "cm" },
    { key: "chainWeave", label: "Chain weave", type: "text" },
  ],
  "necklace set": [
    { key: "necklaceStyle", label: "Necklace style", type: "text" },
    { key: "setIncludes", label: "Set includes", type: "text" },
    { key: "necklaceLengthCm", label: "Necklace length", type: "number", step: "0.1", unit: "cm" },
  ],
  "pendant set": [
    { key: "pendantStyle", label: "Pendant style", type: "text" },
    { key: "setIncludes", label: "Set includes", type: "text" },
    { key: "chainIncluded", label: "Chain included", type: "select", options: ["Yes", "No"] },
  ],
  mangalsutra: [
    { key: "chainLengthCm", label: "Mangalsutra length", type: "number", step: "0.1", unit: "cm" },
    { key: "beadMaterial", label: "Bead material", type: "select", options: ["Black beads", "Gold beads", "Black and gold beads", "Other"] },
    { key: "pendantIncluded", label: "Pendant included", type: "select", options: ["Yes", "No"] },
  ],
  tika: [
    { key: "tikaStyle", label: "Tika style", type: "select", options: ["Maang tika", "Matha patti", "Borla", "Other"] },
    { key: "chainLengthCm", label: "Chain length", type: "number", step: "0.1", unit: "cm" },
  ],
  nose: [
    { key: "noseJewelleryType", label: "Nose jewellery type", type: "select", options: ["Nose pin", "Nose ring", "Nath", "Other"] },
    { key: "piercingSide", label: "Piercing side", type: "select", options: ["Left", "Right", "Either"] },
  ],
  coins: [
    { key: "coinDenomination", label: "Coin denomination", type: "text" },
    { key: "coinFinish", label: "Coin finish", type: "select", options: ["Brilliant", "Proof", "Antique", "Other"] },
    { key: "coinCertification", label: "Certification", type: "text" },
  ],
};

export function getProductCategoryFields(category: string) {
  const normalized = category.trim().toLocaleLowerCase();
  if (normalized === "nose jewellery" || normalized === "nose pins" || normalized === "nath") return fieldsByCategory.nose;
  if (normalized === "tika / tikka" || normalized === "maang tikka") return fieldsByCategory.tika;
  return fieldsByCategory[normalized] ?? [];
}

export const SONASATHI_CATEGORIES = [
  "Earrings", "Bangles", "Rings", "Bracelets", "Pendants", "Necklaces", "Chains",
  "Necklace Set", "Pendant Set", "Mangalsutra", "Tika", "Nose", "Coins",
] as const;
