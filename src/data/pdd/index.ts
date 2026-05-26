import type { Question, Sign, SignsByCategory } from "./types";
import signsData from "./signs.json";
import hardData from "./hard-questions.json";

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

// 100 «сложных» вопросов — куратор pddmaster.ru (статистика ошибок).
// Источник: PDF /img/pdf/ekzamen-difficult-ab-pddmaster.ru.pdf
let _hardQuestions: Question[] | null = null;
export function getHardQuestions(): Question[] {
  if (_hardQuestions) return _hardQuestions;
  const idSet = new Set((hardData as { ids: string[] }).ids);
  const byId = new Map<string, Question>();
  for (const q of getAllQuestionsFlat()) byId.set(q.id, q);
  _hardQuestions = (hardData as { ids: string[] }).ids
    .map((id) => byId.get(id))
    .filter((q): q is Question => Boolean(q));
  return _hardQuestions;
}

let _topicMap: Map<string, Question[]> | null = null;
function buildTopicMap(): Map<string, Question[]> {
  if (_topicMap) return _topicMap;
  const m = new Map<string, Question[]>();
  for (const qs of tickets.values()) {
    for (const q of qs) {
      for (const t of q.topic) {
        if (!m.has(t)) m.set(t, []);
        m.get(t)!.push(q);
      }
    }
  }
  _topicMap = m;
  return m;
}

export function getAllTopics(): string[] {
  return [...buildTopicMap().keys()].sort((a, b) => a.localeCompare(b, "ru"));
}

export function getTopicQuestions(topic: string): Question[] {
  return buildTopicMap().get(topic) ?? [];
}

export function getTopicSummary(topic: string) {
  const questions = getTopicQuestions(topic);
  const tickets = new Set(questions.map((q) => q.ticket_number));
  return {
    topic,
    questionCount: questions.length,
    ticketCount: tickets.size,
  };
}

const cyrToLat: Record<string, string> = {
  а:"a", б:"b", в:"v", г:"g", д:"d", е:"e", ё:"yo", ж:"zh", з:"z",
  и:"i", й:"y", к:"k", л:"l", м:"m", н:"n", о:"o", п:"p", р:"r",
  с:"s", т:"t", у:"u", ф:"f", х:"h", ц:"ts", ч:"ch", ш:"sh", щ:"sch",
  ъ:"", ы:"y", ь:"", э:"e", ю:"yu", я:"ya",
};

export function topicSlug(t: string): string {
  const lower = t.toLowerCase().replace(/[«»"']/g, "");
  let out = "";
  for (const ch of lower) out += cyrToLat[ch] ?? ch;
  return out.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getTopicBySlug(slug: string): string | undefined {
  for (const topic of getAllTopics()) {
    if (topicSlug(topic) === slug) return topic;
  }
  return undefined;
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
