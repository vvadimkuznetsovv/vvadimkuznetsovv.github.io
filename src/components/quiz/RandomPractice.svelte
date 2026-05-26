<script lang="ts">
  import QuizSession from "./QuizSession.svelte";

  interface Answer { answer_text: string; is_correct: boolean; }
  interface Question {
    id: string;
    title: string;
    ticket_number: string;
    image: string | null;
    question: string;
    answers: Answer[];
    correct_answer: string;
    answer_tip: string;
    topic: string[];
  }

  interface Props {
    pool: Question[];
    count?: number;
    label?: string;
  }

  let { pool, count = 20, label = "Случайные" }: Props = $props();

  function shuffle<T>(arr: T[]): T[] {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  let questions = $state<Question[]>(shuffle(pool).slice(0, count));

  function regenerate() {
    questions = shuffle(pool).slice(0, count);
  }
</script>

<div class="rp">
  <div class="rp__bar">
    <span class="rp__meta">
      <span class="rp__k">{label}</span>
      <span class="rp__v">{questions.length} вопросов</span>
    </span>
    <button type="button" class="rp__btn" onclick={regenerate}>
      ↻ Новый набор
    </button>
  </div>

  <QuizSession {questions} />
</div>

<style>
  .rp { display: flex; flex-direction: column; gap: 16px; }
  .rp__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    border: 1px solid color-mix(in srgb, var(--color-cyan) 25%, transparent);
    background: rgba(10, 10, 24, 0.7);
  }
  .rp__meta {
    display: inline-flex;
    align-items: baseline;
    gap: 10px;
    font-family: var(--font-hud);
    font-size: 1rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
  .rp__k { color: var(--color-yellow); text-shadow: 0 0 6px var(--color-yellow); }
  .rp__v { color: var(--color-haze); }
  .rp__btn {
    padding: 8px 16px;
    border: 1px solid var(--color-cyan);
    background: rgba(0, 240, 255, 0.10);
    color: var(--color-bone);
    font-family: "Rajdhani", sans-serif;
    font-weight: 600;
    font-size: 0.92rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    cursor: pointer;
    transition: background 0.18s, box-shadow 0.18s;
  }
  .rp__btn:hover {
    background: rgba(0, 240, 255, 0.20);
    box-shadow: 0 0 14px rgba(0, 240, 255, 0.32);
  }
</style>
