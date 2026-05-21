import type { Question, Sign, SignsByCategory } from "./types";
import signsData from "./signs.json";

const ticketModules = import.meta.glob<{ default: Question[] }>(
  "./tickets/*.json",
  { eager: true },
);

function extractNum(path: string): number {
  const m = path.match(/(\d+)\.json$/);
  return m ? Number.parseInt(m[1], 10) : 0;
}

const tickets: Map<number, Question[]> = new Map(
  Object.entries(ticketModules)
    .map(([path, mod]) => [extractNum(path), mod.default] as const)
    .sort(([a], [b]) => a - b),
);

export function getAllTicketNumbers(): number[] {
  return [...tickets.keys()];
}

export function getTicket(num: number): Question[] | undefined {
  return tickets.get(num);
}

export function getAllQuestionsFlat(): Question[] {
  const out: Question[] = [];
  for (const qs of tickets.values()) out.push(...qs);
  return out;
}

export function getTicketSummary(num: number) {
  const questions = tickets.get(num) ?? [];
  const topics = new Set<string>();
  for (const q of questions) for (const t of q.topic) topics.add(t);
  return {
    number: num,
    questionCount: questions.length,
    topics: [...topics],
  };
}

export const signs = signsData as unknown as SignsByCategory;

export function getSignGroups(): string[] {
  return Object.keys(signs);
}

export function getSignsByCategory(): { category: string; items: Sign[] }[] {
  return Object.entries(signs).map(([category, group]) => ({
    category,
    items: Object.values(group),
  }));
}

export function getAllSignsFlat(): { category: string; sign: Sign }[] {
  const out: { category: string; sign: Sign }[] = [];
  for (const [category, group] of Object.entries(signs)) {
    for (const sign of Object.values(group)) {
      out.push({ category, sign });
    }
  }
  return out;
}

export function signSlug(number: string): string {
  return number.replace(/\./g, "-");
}

export function signFromSlug(slug: string): string {
  return slug.replace(/-/g, ".");
}

export function getSignByNumber(num: string): { category: string; sign: Sign } | undefined {
  for (const [category, group] of Object.entries(signs)) {
    const sign = group[num];
    if (sign) return { category, sign };
  }
  return undefined;
}
