import { slugify } from "@/lib/utils";
import type { NormalizedLocationResult } from "@/lib/discovery/types";

const TRINIDAD_LOCATIONS = [
  { aliases: ["trinidad", "trinidad and tobago"], normalized: "Trinidad and Tobago", city: "Trinidad", region: "Trinidad and Tobago" },
  { aliases: ["tobago", "scarborough", "crown point"], normalized: "Tobago, Trinidad and Tobago", city: "Tobago", region: "Trinidad and Tobago" },
  { aliases: ["port of spain"], normalized: "Port of Spain, Trinidad and Tobago", city: "Port of Spain", region: "Trinidad and Tobago" },
  { aliases: ["san fernando"], normalized: "San Fernando, Trinidad and Tobago", city: "San Fernando", region: "Trinidad and Tobago" },
  { aliases: ["chaguanas"], normalized: "Chaguanas, Trinidad and Tobago", city: "Chaguanas", region: "Trinidad and Tobago" },
  { aliases: ["arima"], normalized: "Arima, Trinidad and Tobago", city: "Arima", region: "Trinidad and Tobago" },
  { aliases: ["point lisas"], normalized: "Point Lisas, Trinidad and Tobago", city: "Point Lisas", region: "Trinidad and Tobago" },
  { aliases: ["tunapuna"], normalized: "Tunapuna, Trinidad and Tobago", city: "Tunapuna", region: "Trinidad and Tobago" },
  { aliases: ["couva"], normalized: "Couva, Trinidad and Tobago", city: "Couva", region: "Trinidad and Tobago" },
  { aliases: ["maraval"], normalized: "Maraval, Trinidad and Tobago", city: "Maraval", region: "Trinidad and Tobago" },
  { aliases: ["pointe-a-pierre", "pointe--pierre", "pointe pierre"], normalized: "Pointe-a-Pierre, Trinidad and Tobago", city: "Pointe-a-Pierre", region: "Trinidad and Tobago" }
];

const CARIBBEAN_MARKERS = [
  "caribbean",
  "jamaica",
  "barbados",
  "guyana",
  "grenada",
  "saint lucia",
  "st lucia",
  "bahamas"
];

const REMOTE_RESTRICTIONS = [
  "us only",
  "united states only",
  "uk only",
  "europe only",
  "eu only",
  "canada only",
  "must reside"
];

function normalizeWhitespace(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function normalizeDiscoveryLocation(rawValue: string): NormalizedLocationResult {
  const normalizedRaw = normalizeWhitespace(rawValue || "Location not specified");
  const remote = /remote|anywhere|worldwide|global/i.test(normalizedRaw);
  const restrictedRemote = REMOTE_RESTRICTIONS.some((marker) => normalizedRaw.includes(marker));

  for (const entry of TRINIDAD_LOCATIONS) {
    if (entry.aliases.some((alias) => normalizedRaw.includes(alias))) {
      return {
        slug: slugify(entry.normalized),
        rawValue,
        normalizedValue: entry.normalized,
        country: "Trinidad and Tobago",
        region: entry.region,
        city: entry.city,
        scope: "TRINIDAD_TOBAGO",
        isRemoteFriendly: remote,
        isTrinidadAndTobago: true,
        isCaribbean: true,
        aliases: entry.aliases
      };
    }
  }

  if (remote) {
    return {
      slug: restrictedRemote ? slugify(rawValue || "restricted-remote") : "remote-worldwide",
      rawValue,
      normalizedValue: restrictedRemote ? rawValue : "Remote",
      scope: "REMOTE",
      isRemoteFriendly: !restrictedRemote,
      isTrinidadAndTobago: false,
      isCaribbean: !restrictedRemote,
      aliases: ["remote"]
    };
  }

  const isCaribbean = CARIBBEAN_MARKERS.some((marker) => normalizedRaw.includes(marker));

  return {
    slug: slugify(rawValue || "location-not-specified"),
    rawValue,
    normalizedValue: rawValue || "Location not specified",
    country: isCaribbean ? "Caribbean" : undefined,
    scope: isCaribbean ? "CARIBBEAN" : "GLOBAL",
    isRemoteFriendly: false,
    isTrinidadAndTobago: false,
    isCaribbean,
    aliases: []
  };
}
