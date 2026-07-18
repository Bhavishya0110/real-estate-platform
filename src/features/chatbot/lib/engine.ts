import type {
  BotReply,
  KnowledgeProject,
  KnowledgeSnapshot,
} from "../types";

/**
 * OFFLINE ANSWER ENGINE
 *
 * A deterministic, rule-based intent engine over the knowledge snapshot. No
 * model, no network, no external service — which is what makes the core promise
 * enforceable: every fact in a reply is read directly out of our own data, and
 * anything not in the data produces an explicit "I don't have that" rather than
 * a guess.
 *
 * Structure:
 *   1. Extract entities (project, category, budget, BHK, locality) from the text.
 *   2. Match an intent by keyword.
 *   3. Answer that intent *from the snapshot*.
 *   4. Fall through to an honest miss.
 *
 * This is intentionally the seam where a smarter local engine can be dropped in
 * later: replace `answer()` and everything above it keeps working.
 */

/* ------------------------------------------------------------------ helpers */

const CATEGORY_WORDS: Record<string, string> = {
  residential: "Residential",
  flat: "Residential",
  flats: "Residential",
  apartment: "Residential",
  apartments: "Residential",
  home: "Residential",
  homes: "Residential",
  house: "Residential",
  commercial: "Commercial",
  shop: "Commercial",
  shops: "Commercial",
  retail: "Commercial",
  office: "Commercial",
  offices: "Commercial",
  invest: "Commercial",
  investment: "Commercial",
  plot: "Plots",
  plots: "Plots",
  land: "Plots",
  senior: "Senior Living",
  luxury: "Luxury",
  penthouse: "Luxury",
};

function normalise(text: string) {
  return text.toLowerCase().trim();
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

/** Parses "1.5 cr", "75 lakh", "80l", "2crore" into rupees. */
function extractBudget(text: string): number | null {
  const crore = text.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/);
  if (crore) return Number(crore[1]) * 10000000;

  const lakh = text.match(/(\d+(?:\.\d+)?)\s*(?:l\b|lac|lakh|lakhs)/);
  if (lakh) return Number(lakh[1]) * 100000;

  return null;
}

function extractBhk(text: string): number | null {
  const found = text.match(/(\d)\s*bhk/);
  return found ? Number(found[1]) : null;
}

function extractCategory(text: string): string | null {
  for (const [word, category] of Object.entries(CATEGORY_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(text)) return category;
  }
  return null;
}

/** Finds every project explicitly named in the message. */
function extractProjects(
  text: string,
  snapshot: KnowledgeSnapshot,
): KnowledgeProject[] {
  return snapshot.projects.filter((project) => {
    const name = project.name.toLowerCase();
    // Match the full name, and also the distinctive word ("majestic" for
    // "The Majestic") so people need not type the article.
    const distinctive = name.replace(/^the\s+/, "");
    return text.includes(name) || text.includes(distinctive);
  });
}

function matchesBhk(project: KnowledgeProject, bhk: number) {
  return project.configurations.some((configuration) => {
    const found = configuration.match(/(\d+)\s*BHK/i);
    if (!found) return false;
    return bhk >= 4 ? Number(found[1]) >= 4 : Number(found[1]) === bhk;
  });
}

function summarise(project: KnowledgeProject) {
  return `${project.name} — ${project.category}, ${project.status}. ${project.priceLabel}, ${project.configurations.join(" / ")}, in ${project.location}, ${project.city}. Possession: ${project.possession}.`;
}

const CONTACT_ACTIONS = (snapshot: KnowledgeSnapshot) => [
  { label: "Contact us", href: "/contact" },
  {
    label: "WhatsApp",
    href: `https://wa.me/${snapshot.company.whatsapp}`,
    external: true,
  },
];

const DEFAULT_SUGGESTIONS = [
  "Show me residential projects",
  "What is ready to move?",
  "Compare Crosswalk and The Pearl",
  "Book a site visit",
];

/* ------------------------------------------------------------------- intents */

export function answer(input: string, snapshot: KnowledgeSnapshot): BotReply {
  const text = normalise(input);

  if (!text) {
    return {
      text: "Ask me anything about our projects — budget, location, possession or amenities.",
      suggestions: DEFAULT_SUGGESTIONS,
    };
  }

  const named = extractProjects(text, snapshot);
  const category = extractCategory(text);
  const budget = extractBudget(text);
  const bhk = extractBhk(text);

  /* --- Greeting ---------------------------------------------------------- */
  if (includesAny(text, ["hello", "hi ", "hey", "namaste"]) && text.length < 20) {
    return {
      text: `Hello. I can help you explore ${snapshot.projects.length} JMS Group projects across Gurugram and the NCR — and I only answer from our own project data. What are you looking for?`,
      suggestions: DEFAULT_SUGGESTIONS,
    };
  }

  /* --- Compare ----------------------------------------------------------- */
  if (includesAny(text, ["compare", "difference", "vs", "versus"])) {
    if (named.length >= 2) {
      const [a, b] = named;
      return {
        text: [
          `Here is how they differ:`,
          ``,
          `${a.name}: ${a.priceLabel}, ${a.configurations.join(" / ")}, ${a.areaRange}. ${a.status}, possession ${a.possession}. ${a.location}.`,
          ``,
          `${b.name}: ${b.priceLabel}, ${b.configurations.join(" / ")}, ${b.areaRange}. ${b.status}, possession ${b.possession}. ${b.location}.`,
        ].join("\n"),
        projects: [a, b],
        actions: CONTACT_ACTIONS(snapshot),
        suggestions: ["Which is better value?", "Book a site visit"],
      };
    }

    return {
      text: "Tell me which two projects to compare and I will put them side by side — for example, “compare Crosswalk and The Pearl”. You can also tick up to three projects on the Projects page to compare them there.",
      actions: [{ label: "Browse projects", href: "/projects" }],
      suggestions: ["Compare Crosswalk and The Pearl"],
    };
  }

  /* --- A specific project ------------------------------------------------ */
  if (named.length === 1) {
    const project = named[0];
    const wantsAmenities = includesAny(text, ["amenity", "amenities", "facilities"]);
    const wantsPrice = includesAny(text, ["price", "cost", "rate", "budget", "how much"]);
    const wantsLocation = includesAny(text, ["where", "location", "address", "located"]);

    if (wantsAmenities) {
      return {
        text: `${project.name} includes: ${project.amenities.join(", ")}.`,
        projects: [project],
        actions: [{ label: `View ${project.name}`, href: `/projects/${project.slug}` }],
      };
    }

    if (wantsPrice) {
      return {
        text: `${project.name} starts at ${project.priceLabel} for ${project.configurations.join(" / ")} (${project.areaRange}). Possession: ${project.possession}. That is the published starting price — the final figure depends on the unit, floor and facing you choose.`,
        projects: [project],
        actions: [
          { label: "Work out the EMI", href: "/emi-calculator" },
          ...CONTACT_ACTIONS(snapshot),
        ],
      };
    }

    if (wantsLocation) {
      return {
        text: `${project.name} is in ${project.location}, ${project.city}.`,
        projects: [project],
        actions: [{ label: `View ${project.name}`, href: `/projects/${project.slug}` }],
      };
    }

    return {
      text: `${project.description}\n\n${summarise(project)}`,
      projects: [project],
      actions: [
        { label: `View ${project.name}`, href: `/projects/${project.slug}` },
        ...CONTACT_ACTIONS(snapshot),
      ],
      suggestions: [
        `What amenities does ${project.name} have?`,
        `Show me similar projects`,
      ],
    };
  }

  /* --- Similar projects -------------------------------------------------- */
  if (includesAny(text, ["similar", "like this", "alternatives"])) {
    const reference = named[0];
    const pool = reference
      ? snapshot.projects.filter(
          (p) => p.category === reference.category && p.slug !== reference.slug,
        )
      : [];

    if (pool.length > 0) {
      return {
        text: `Projects in the same category as ${reference.name}:`,
        projects: pool.slice(0, 4),
        actions: [{ label: "Browse all projects", href: "/projects" }],
      };
    }
  }

  /* --- Site visit -------------------------------------------------------- */
  if (includesAny(text, ["site visit", "visit", "viewing", "appointment", "schedule", "book"])) {
    return {
      text: `Happy to arrange that. Site visits run Monday to Saturday, 10am–7pm, and Sundays by appointment. Send your preferred day through the contact form or WhatsApp and an advisor will confirm.`,
      actions: CONTACT_ACTIONS(snapshot),
      suggestions: ["Which projects are ready to move?"],
    };
  }

  /* --- Home loan / EMI --------------------------------------------------- */
  if (includesAny(text, ["emi", "loan", "instal", "interest", "finance", "mortgage"])) {
    return {
      text: "You can work out the monthly figure yourself — our EMI calculator shows the instalment, the total interest and the true cost of the loan. Move the sliders for your own amount, rate and tenure. I cannot quote you an interest rate, as that depends on the lender's assessment of your profile.",
      actions: [
        { label: "Open EMI calculator", href: "/emi-calculator" },
        ...CONTACT_ACTIONS(snapshot),
      ],
    };
  }

  /* --- Contact ----------------------------------------------------------- */
  if (includesAny(text, ["contact", "phone", "call", "email", "reach", "office", "address"])) {
    return {
      text: `You can reach ${snapshot.company.name} on ${snapshot.company.phone} or ${snapshot.company.email}. Our office is at ${snapshot.company.address}.`,
      actions: CONTACT_ACTIONS(snapshot),
    };
  }

  /* --- Residential vs commercial guidance -------------------------------- */
  if (
    includesAny(text, ["residential or commercial", "which should i", "help me choose", "buy to live", "rental income"])
  ) {
    return {
      text: "It comes down to what you want the asset to do. If you are going to live in it, look at the residential portfolio — apartments, independent floors, plots and senior living. If you want rental income or capital appreciation, the commercial portfolio is priced against realistic rents. I can shortlist either once you tell me your budget.",
      actions: [
        { label: "Residential", href: "/residential" },
        { label: "Commercial", href: "/commercial" },
      ],
      suggestions: ["Residential under 1.5 cr", "Commercial under 2 cr"],
    };
  }

  /* --- Recommend / browse with constraints -------------------------------- */
  const wantsList =
    includesAny(text, [
      "show", "list", "browse", "recommend", "suggest", "looking for",
      "options", "available", "projects", "ready to move", "under", "budget",
    ]) ||
    Boolean(category) ||
    Boolean(budget) ||
    Boolean(bhk);

  if (wantsList) {
    let matches = snapshot.projects;

    if (category) matches = matches.filter((p) => p.category === category);
    if (budget) matches = matches.filter((p) => p.priceFrom <= budget);
    if (bhk) matches = matches.filter((p) => matchesBhk(p, bhk));
    if (includesAny(text, ["ready to move", "ready"])) {
      matches = matches.filter((p) => p.status === "Ready to Move");
    }

    const constraints = [
      category,
      budget ? `under ₹${(budget / 10000000).toFixed(2)} Cr` : null,
      bhk ? `${bhk} BHK` : null,
    ]
      .filter(Boolean)
      .join(", ");

    if (matches.length === 0) {
      return {
        text: `I could not find anything in our portfolio matching ${constraints || "that"}. I would rather tell you that than suggest something that does not fit. An advisor can tell you what is releasing next in that bracket.`,
        actions: CONTACT_ACTIONS(snapshot),
        suggestions: DEFAULT_SUGGESTIONS,
        unanswered: true,
      };
    }

    // Recommendations are capped at five, per the brief.
    const shortlist = matches.slice(0, 5);

    return {
      text: constraints
        ? `${matches.length} ${matches.length === 1 ? "project matches" : "projects match"} ${constraints}. ${shortlist.length < matches.length ? `Here are the first ${shortlist.length}:` : "Here they are:"}`
        : `Here are ${shortlist.length} of our ${snapshot.projects.length} projects:`,
      projects: shortlist,
      actions: [{ label: "Browse all projects", href: "/projects" }],
      suggestions: ["Book a site visit", "Work out the EMI"],
    };
  }

  /* --- FAQ --------------------------------------------------------------- */
  const terms = text.split(/\s+/).filter((word) => word.length > 3);
  if (terms.length > 0) {
    const scored = snapshot.faqs
      .map((faq) => {
        const haystack = `${faq.question} ${faq.answer}`.toLowerCase();
        const score = terms.filter((term) => haystack.includes(term)).length;
        return { faq, score };
      })
      .filter((entry) => entry.score >= Math.min(2, terms.length))
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      return {
        text: `${scored[0].faq.question}\n\n${scored[0].faq.answer}`,
        actions: [{ label: "See all FAQs", href: "/faq" }, ...CONTACT_ACTIONS(snapshot)],
      };
    }
  }

  /* --- Honest miss -------------------------------------------------------- */
  return {
    text: "I don't have that in our project data, so I would rather not guess. I can help with our projects, prices, locations, amenities, possession dates, EMI and site visits — or put you straight through to an advisor who can answer anything I cannot.",
    actions: CONTACT_ACTIONS(snapshot),
    suggestions: DEFAULT_SUGGESTIONS,
    unanswered: true,
  };
}
