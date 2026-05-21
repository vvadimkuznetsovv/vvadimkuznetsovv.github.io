export interface Answer {
  answer_text: string;
  is_correct: boolean;
}

export interface Question {
  title: string;
  ticket_number: string;
  ticket_category: string;
  image: string | null;
  question: string;
  answers: Answer[];
  correct_answer: string;
  answer_tip: string;
  topic: string[];
  id: string;
}

export interface Sign {
  number: string;
  title: string;
  image: string;
  description: string | null;
}

export type SignsByCategory = Record<string, Record<string, Sign>>;
