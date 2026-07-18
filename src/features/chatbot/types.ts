/**
 * Types for the offline assistant.
 *
 * The assistant is deliberately *not* a language model. It is a deterministic
 * intent engine over a snapshot of our own data, so it can never invent a price,
 * a possession date or a project that does not exist. When it cannot answer from
 * the snapshot it says so and hands over to a human.
 */

/** A trimmed project record — only what the assistant needs to answer. */
export interface KnowledgeProject {
  slug: string;
  name: string;
  category: string;
  status: string;
  tagline: string;
  description: string;
  location: string;
  city: string;
  priceLabel: string;
  priceFrom: number;
  configurations: string[];
  areaRange: string;
  possession: string;
  amenities: string[];
  hasVirtualTour: boolean;
  hasBrochure: boolean;
}

export interface KnowledgeFaq {
  question: string;
  answer: string;
  category: string;
}

/**
 * Everything the assistant is allowed to know. Assembled on the server from the
 * repository layer and handed to the client once — so the assistant works
 * instantly and offline, with no API call and no external service.
 */
export interface KnowledgeSnapshot {
  projects: KnowledgeProject[];
  faqs: KnowledgeFaq[];
  company: {
    name: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    foundedYear: number;
  };
}

/** A link or escalation the assistant offers alongside an answer. */
export interface BotAction {
  label: string;
  href: string;
  external?: boolean;
}

/** The assistant's structured reply. */
export interface BotReply {
  /** Prose answer. Always grounded in the snapshot. */
  text: string;
  /** Projects to render as cards under the answer. */
  projects?: KnowledgeProject[];
  /** Suggested next steps. */
  actions?: BotAction[];
  /** Follow-up prompts the user can tap. */
  suggestions?: string[];
  /** True when the assistant could not answer from its data. */
  unanswered?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  reply: BotReply;
}
