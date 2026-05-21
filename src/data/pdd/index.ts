import type { Question, SignsByCategory } from "./types";
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

export function getAllSignsFlat(): Sign[] {
  const out: Sign[] = [];
  for (const group of Object.values(signs)) {
    for (const sign of Object.values(group)) {
      out.push(sign);
    }
  }
  return out;
}

export function getSignGroups(): string[] {
  return Object.keys(signs);
}

type Sign = SignsByCategory[string][string];
