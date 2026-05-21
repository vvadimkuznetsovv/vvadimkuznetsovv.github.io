<script lang="ts">
  import { onDestroy } from "svelte";

  interface Answer {
    answer_text: string;
    is_correct: boolean;
  }
  interface Question {
    id: string;
    ticket_number: string;
    image: string | null;
    question: string;
    answers: Answer[];
    correct_answer: string;
    answer_tip: string;
    topic: string[];
  }

  interface Props { pool: Question[]; }
  let { pool }: Props = $props();

  // Bucket pool by ticket number for fast random pick
  const ticketBuckets = (() => {
    const map = new Map<string, Question[]>();
    for (const q of pool) {
      const k = q.ticket_number;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(q);
    }
    return map;
  })();
  const ticketKeys = [...ticketBuckets.keys()];

  type Status = "idle" | "in-progress" | "passed" | "failed" | "timeout";

  let status = $state<Status>("idle");
  let baseTicket = $state<string | null>(null);
  let questionsRun = $state<Question[]>([]);
  let answers = $state<Map<number, number>>(new Map());
  let currentIdx = $state(0);
  let elapsed = $state(0);
  let maxTime = $state(20 * 60);
  let timerHandle: ReturnType<typeof setInterval> | null = null;

  // Pre-defined ГИБДД rules text
  const RULES_BASE_QUESTIONS = 20;
  const RULES_BASE_TIME = 20 * 60;
  const RULES_EXTRA_PER_ERROR = 5;
  const RULES_EXTRA_TIME = 5 * 60;
  const RULES_MAX_ERRORS = 2;

  function shuffle<T>(arr: T[]): T[] {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function countErrors(): number {
    let n = 0;
    for (const [qIdx, aIdx] of answers) {
      const q = questionsRun[qIdx];
      if (q && !q.answers[aIdx]?.is_correct) n++;
    }
    return n;
  }

  function start() {
    if (timerHandle) clearInterval(timerHandle);
    baseTicket = ticketKeys[Math.floor(Math.random() * ticketKeys.length)];
    const base = ticketBuckets.get(baseTicket) ?? [];
    questionsRun = shuffle(base).slice(0, RULES_BASE_QUESTIONS);
    answers = new Map();
    currentIdx = 0;
    elapsed = 0;
    maxTime = RULES_BASE_TIME;
    status = "in-progress";
    timerHandle = setInterval(() => {
      elapsed += 1;
      if (elapsed >= maxTime) finish("timeout");
    }, 1000);
  }

  function pick(answerIdx: number) {
    if (answers.has(currentIdx)) return;
    const q = questionsRun[currentIdx];
    answers = new Map(answers).set(currentIdx, answerIdx);
    const isCorrect = q.answers[answerIdx]?.is_correct === true;
    if (!isCorrect) {
      const errs = countErrors();
      if (errs > RULES_MAX_ERRORS) {
        // tot count > 2 → automatic fail
        finish("failed");
        return;
      }
      // Add 5 extras from same topic, not yet used
      const topic = q.topic[0];
      const used = new Set(questionsRun.map((p) => p.id));
      const candidates = pool.filter(
        (p) => p.topic.includes(topic) && !used.has(p.id),
      );
      const extras = shuffle(candidates).slice(0, RULES_EXTRA_PER_ERROR);
      questionsRun = [...questionsRun, ...extras];
      maxTime += RULES_EXTRA_TIME;
    }
  }

  function next() {
    if (currentIdx + 1 >= questionsRun.length) {
      const errs = countErrors();
      finish(errs > RULES_MAX_ERRORS ? "failed" : "passed");
    } else {
      currentIdx += 1;
    }
  }

  function finish(s: Exclude<Status, "idle" | "in-progress">) {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
    status = s;
  }

  function reset() {
    if (timerHandle) clearInterval(timerHandle);
    status = "idle";
    questionsRun = [];
    answers = new Map();
    elapsed = 0;
    maxTime = RULES_BASE_TIME;
    baseTicket = null;
    currentIdx = 0;
  }

  onDestroy(() => {
    if (timerHandle) clearInterval(timerHandle);
  });

  const current = $derived(questionsRun[currentIdx]);
  const userAnswerIdx = $derived(answers.get(currentIdx) ?? null);
  const isPicked = $derived(userAnswerIdx !== null);
  const isCorrect = $derived(
    isPicked && current?.answers[userAnswerIdx!]?.is_correct === true,
  );
  const errorCount = $derived(countErrors());
  const timeRemaining = $derived(Math.max(0, maxTime - elapsed));
  const timeDisplay = $derived(
    `${Math.floor(timeRemaining / 60)
      .toString()
      .padStart(2, "0")}:${(timeRemaining % 60).toString().padStart(2, "0")}`,
  );
  const totalCount = $derived(questionsRun.length);
  const timerCritical = $derived(timeRemaining < 120);
</script>

{#if status === "idle"}
  <div class="exam-start">
    <p class="exam-start__tag">// rules</p>
    <h2 class="exam-start__title">Экзамен по правилам ГИБДД</h2>

    <ul class="exam-start__list">
      <li>
        <span class="exam-start__k">{RULES_BASE_QUESTIONS}</span>
        <span>вопросов из случайного билета</span>
      </li>
      <li>
        <span class="exam-start__k">{RULES_BASE_TIME / 60} мин</span>
        <span>на основные вопросы</span>
      </li>
      <li>
        <span class="exam-start__k">≤ {RULES_MAX_ERRORS}</span>
        <span>допустимых ошибок</span>
      </li>
      <li>
        <span class="exam-start__k">+{RULES_EXTRA_PER_ERROR} / +{RULES_EXTRA_TIME / 60} мин</span>
        <span>дополнительные вопросы по теме ошибки</span>
      </li>
      <li>
        <span class="exam-start__k">3-я ошибка</span>
        <span>→ не сдан</span>
      </li>
    </ul>

    <button type="button" class="exam-start__btn" onclick={start}>
      ▸ Начать экзамен
    </button>
  </div>
{:else if status === "in-progress" && current}
  <div class="exam-bar" class:exam-bar--critical={timerCritical}>
    <span class="exam-bar__cell">
      <span class="exam-bar__k">Билет</span>
      <span class="exam-bar__v">{baseTicket?.replace("Билет ", "") ?? "-"}</span>
    </span>
    <span class="exam-bar__cell">
      <span class="exam-bar__k">Вопрос</span>
      <span class="exam-bar__v">{currentIdx + 1} / {totalCount}</span>
    </span>
    <span class="exam-bar__cell">
      <span class="exam-bar__k">Ошибок</span>
      <span class="exam-bar__v" class:exam-bar__v--err={errorCount > 0}>
        {errorCount} / {RULES_MAX_ERRORS}
      </span>
    </span>
    <span class="exam-bar__timer">⏱ {timeDisplay}</span>
  </div>

  <article class="exam-q hud-frame hud-frame--cyber">
    <span class="hud-c hud-c-tl" aria-hidden="true"></span>
    <span class="hud-c hud-c-tr" aria-hidden="true"></span>
    <span class="hud-c hud-c-bl" aria-hidden="true"></span>
    <span class="hud-c hud-c-br" aria-hidden="true"></span>
    <span class="hud-ribs" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </span>

    <header class="exam-q__topic">{current.topic.join(" · ")}</header>

    {#if current.image}
      <div class="exam-q__img-wrap">
        <img src={current.image} alt={`Вопрос ${currentIdx + 1}`} class="exam-q__img" />
      </div>
    {/if}

    <h2 class="exam-q__text">{current.question}</h2>

    <ol class="exam-q__answers">
      {#each current.answers as a, ai}
        {@const isMine = userAnswerIdx === ai}
        {@const reveal = isPicked}
        {@const showCorrect = reveal && a.is_correct}
        {@const showWrong = reveal && isMine && !a.is_correct}
        <li>
          <button
            type="button"
            class="exam-q__a"
            class:exam-q__a--correct={showCorrect}
            class:exam-q__a--wrong={showWrong}
            class:exam-q__a--dim={reveal && !a.is_correct && !isMine}
            disabled={isPicked}
            onclick={() => pick(ai)}
          >
            <span class="exam-q__a-letter">{String.fromCharCode(65 + ai)}.</span>
            <span class="exam-q__a-text">{a.answer_text}</span>
            {#if showCorrect}<span class="exam-q__a-mark">✓</span>{/if}
            {#if showWrong}<span class="exam-q__a-mark exam-q__a-mark--wrong">✗</span>{/if}
          </button>
        </li>
      {/each}
    </ol>

    {#if isPicked}
      {#if !isCorrect}
        <div class="exam-q__explain">
          <p class="exam-q__explain-label">// почему так</p>
          <p class="exam-q__explain-text">{current.answer_tip}</p>
        </div>
      {/if}
      <div class="exam-q__next-row">
        {#if isCorrect}
          <span class="exam-q__verdict">✓ Верно</span>
        {:else}
          <span class="exam-q__verdict exam-q__verdict--wrong">
            ✗ Ошибка · +{RULES_EXTRA_PER_ERROR} вопросов · +{RULES_EXTRA_TIME / 60} мин
          </span>
        {/if}
        <button type="button" class="exam-q__next" onclick={next}>
          {currentIdx + 1 >= totalCount ? "Завершить →" : "Дальше →"}
        </button>
      </div>
    {/if}
  </article>
{:else}
  <div class="exam-result" data-status={status}>
    <span class="exam-result__tag">// verdict</span>
    {#if status === "passed"}
      <h2 class="exam-result__title exam-result__title--ok">✓ Экзамен сдан</h2>
    {:else if status === "failed"}
      <h2 class="exam-result__title exam-result__title--bad">✗ Экзамен не сдан</h2>
    {:else if status === "timeout"}
      <h2 class="exam-result__title exam-result__title--bad">⏱ Время вышло</h2>
    {/if}

    <dl class="exam-result__stats">
      <div>
        <dt>Билет</dt>
        <dd>{baseTicket?.replace("Билет ", "") ?? "—"}</dd>
      </div>
      <div>
        <dt>Ответов всего</dt>
        <dd>{answers.size} / {totalCount}</dd>
      </div>
      <div>
        <dt>Ошибок</dt>
        <dd>{errorCount}</dd>
      </div>
      <div>
        <dt>Время</dt>
        <dd>{Math.floor(elapsed / 60).toString().padStart(2, "0")}:{(elapsed % 60).toString().padStart(2, "0")}</dd>
      </div>
    </dl>

    <div class="exam-result__actions">
      <button type="button" class="exam-result__btn" onclick={start}>
        ↻ Новый экзамен
      </button>
      <button type="button" class="exam-result__btn exam-result__btn--ghost" onclick={reset}>
        ← К правилам
      </button>
    </div>
  </div>
{/if}

<style>
  /* ---------- start screen ---------- */
  .exam-start {
    border: 1px solid var(--color-rack);
    background: var(--color-deck);
    padding: 28px 26px;
  }
  @media (min-width: 640px) { .exam-start { padding: 36px 38px; } }
  .exam-start__tag {
    font-family: var(--font-hud);
    color: var(--color-yellow);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin: 0;
  }
  .exam-start__title {
    margin: 8px 0 22px;
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 1.7rem;
    color: var(--color-bone);
  }
  @media (min-width: 640px) { .exam-start__title { font-size: 2.1rem; } }
  .exam-start__list {
    list-style: none;
    margin: 0 0 28px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .exam-start__list li {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 16px;
    align-items: baseline;
    padding: 10px 0;
    border-top: 1px solid var(--color-rack);
    font-family: var(--font-ui);
    color: var(--color-haze);
  }
  .exam-start__list li:last-child { border-bottom: 1px solid var(--color-rack); }
  .exam-start__k {
    font-family: var(--font-hud);
    font-size: 1.2rem;
    color: var(--color-cyan);
    text-shadow: 0 0 6px var(--color-cyan);
    letter-spacing: 0.1em;
  }
  .exam-start__btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 28px;
    border: 1px solid var(--color-cyan);
    background: rgba(0, 240, 255, 0.08);
    color: var(--color-bone);
    font-family: "Rajdhani", sans-serif;
    font-weight: 600;
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    cursor: pointer;
    transition: background 0.18s, box-shadow 0.18s;
  }
  .exam-start__btn:hover {
    background: rgba(0, 240, 255, 0.18);
    box-shadow: 0 0 24px rgba(0, 240, 255, 0.4);
  }

  /* ---------- in-progress bar ---------- */
  .exam-bar {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px 28px;
    padding: 12px 18px;
    border: 1px solid color-mix(in srgb, var(--color-cyan) 30%, transparent);
    background: rgba(8, 8, 18, 0.94);
    backdrop-filter: blur(10px);
    margin-bottom: 18px;
    transition: border-color 0.3s;
  }
  .exam-bar--critical {
    border-color: var(--color-magenta);
    animation: bar-flash 1.2s ease-in-out infinite;
  }
  @keyframes bar-flash {
    0%, 100% { box-shadow: 0 0 0 rgba(255, 43, 214, 0); }
    50% { box-shadow: 0 0 24px rgba(255, 43, 214, 0.4); }
  }
  .exam-bar__cell {
    display: inline-flex;
    flex-direction: column;
    gap: 2px;
  }
  .exam-bar__k {
    font-family: var(--font-ui);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--color-dim);
  }
  .exam-bar__v {
    font-family: var(--font-hud);
    font-size: 1.2rem;
    color: var(--color-bone);
    letter-spacing: 0.1em;
  }
  .exam-bar__v--err { color: var(--color-magenta); text-shadow: 0 0 8px var(--color-magenta); }
  .exam-bar__timer {
    margin-left: auto;
    padding: 4px 16px;
    font-family: var(--font-hud);
    font-size: 1.6rem;
    color: var(--color-yellow);
    border: 1px solid color-mix(in srgb, var(--color-yellow) 50%, transparent);
    background: rgba(252, 238, 10, 0.06);
    text-shadow: 0 0 8px var(--color-yellow);
    letter-spacing: 0.15em;
  }
  .exam-bar--critical .exam-bar__timer {
    color: var(--color-magenta);
    border-color: var(--color-magenta);
    text-shadow: 0 0 10px var(--color-magenta);
  }

  /* ---------- single question ---------- */
  .exam-q {
    /* hud-frame--cyber base provides background + padding + corners + ribs */
  }
  .exam-q__topic {
    font-family: var(--font-ui);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--color-dim);
  }
  .exam-q__img-wrap {
    margin-top: 18px;
    border: 1px solid var(--color-rack);
    background: rgba(5, 5, 8, 0.6);
    overflow: hidden;
  }
  .exam-q__img { display: block; width: 100%; max-width: 640px; height: auto; }
  .exam-q__text {
    margin-top: 22px;
    font-family: var(--font-ui);
    font-weight: 500;
    font-size: 1.18rem;
    line-height: 1.45;
    color: var(--color-bone);
  }
  @media (min-width: 640px) { .exam-q__text { font-size: 1.32rem; } }

  .exam-q__answers {
    list-style: none;
    margin: 22px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .exam-q__a {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid var(--color-rack);
    background: rgba(5, 5, 8, 0.4);
    color: var(--color-haze);
    font-family: var(--font-ui);
    font-size: 0.95rem;
    line-height: 1.5;
    text-align: left;
    cursor: pointer;
    transition: background 0.18s, border-color 0.18s, color 0.18s;
  }
  @media (min-width: 640px) { .exam-q__a { font-size: 1rem; padding: 16px 20px; } }
  .exam-q__a:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--color-cyan) 50%, transparent);
    background: rgba(0, 240, 255, 0.05);
    color: var(--color-bone);
  }
  .exam-q__a:disabled { cursor: default; }
  .exam-q__a-letter {
    font-family: var(--font-hud);
    font-size: 1.05rem;
    color: var(--color-dim);
    min-width: 24px;
  }
  .exam-q__a-text { flex: 1; }
  .exam-q__a-mark {
    margin-left: auto;
    font-family: var(--font-hud);
    font-size: 1.4rem;
    color: var(--color-toxic);
    text-shadow: 0 0 10px var(--color-toxic);
  }
  .exam-q__a-mark--wrong {
    color: var(--color-magenta);
    text-shadow: 0 0 10px var(--color-magenta);
  }
  .exam-q__a--correct {
    border-color: var(--color-toxic);
    background: rgba(0, 255, 156, 0.08);
    color: var(--color-bone);
    box-shadow: 0 0 0 1px var(--color-toxic), 0 0 22px rgba(0, 255, 156, 0.18);
  }
  .exam-q__a--correct .exam-q__a-letter { color: var(--color-toxic); }
  .exam-q__a--wrong {
    border-color: var(--color-magenta);
    background: rgba(255, 43, 214, 0.08);
    color: var(--color-bone);
    box-shadow: 0 0 0 1px var(--color-magenta), 0 0 22px rgba(255, 43, 214, 0.18);
  }
  .exam-q__a--wrong .exam-q__a-letter { color: var(--color-magenta); }
  .exam-q__a--dim { opacity: 0.55; }

  .exam-q__explain {
    margin-top: 18px;
    padding: 14px 18px;
    border-left: 2px solid var(--color-magenta);
    background: rgba(255, 43, 214, 0.06);
  }
  .exam-q__explain-label {
    font-family: var(--font-hud);
    font-size: 1rem;
    color: var(--color-magenta);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin: 0;
  }
  .exam-q__explain-text {
    margin: 8px 0 0;
    font-family: var(--font-ui);
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--color-haze);
  }

  .exam-q__next-row {
    margin-top: 22px;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .exam-q__verdict {
    padding: 6px 14px;
    font-family: "Rajdhani", sans-serif;
    font-weight: 600;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--color-toxic);
    border: 1px solid var(--color-toxic);
    background: rgba(0, 255, 156, 0.08);
  }
  .exam-q__verdict--wrong {
    color: var(--color-magenta);
    border-color: var(--color-magenta);
    background: rgba(255, 43, 214, 0.08);
  }
  .exam-q__next {
    margin-left: auto;
    padding: 12px 22px;
    border: 1px solid var(--color-cyan);
    background: rgba(0, 240, 255, 0.12);
    color: var(--color-bone);
    font-family: "Rajdhani", sans-serif;
    font-weight: 600;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    cursor: pointer;
    transition: background 0.18s, box-shadow 0.18s;
  }
  .exam-q__next:hover {
    background: rgba(0, 240, 255, 0.22);
    box-shadow: 0 0 18px rgba(0, 240, 255, 0.35);
  }

  /* ---------- result screen ---------- */
  .exam-result {
    border: 1px solid var(--color-rack);
    background: var(--color-deck);
    padding: 30px 28px;
  }
  @media (min-width: 640px) { .exam-result { padding: 40px 40px; } }
  .exam-result[data-status="passed"] {
    border-color: color-mix(in srgb, var(--color-toxic) 60%, transparent);
    box-shadow: 0 0 30px rgba(0, 255, 156, 0.18);
  }
  .exam-result[data-status="failed"],
  .exam-result[data-status="timeout"] {
    border-color: color-mix(in srgb, var(--color-magenta) 60%, transparent);
    box-shadow: 0 0 30px rgba(255, 43, 214, 0.18);
  }
  .exam-result__tag {
    font-family: var(--font-hud);
    color: var(--color-yellow);
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  .exam-result__title {
    margin: 6px 0 28px;
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 2rem;
    letter-spacing: 0.05em;
  }
  @media (min-width: 640px) { .exam-result__title { font-size: 2.6rem; } }
  .exam-result__title--ok { color: var(--color-toxic); text-shadow: 0 0 18px var(--color-toxic); }
  .exam-result__title--bad { color: var(--color-magenta); text-shadow: 0 0 18px var(--color-magenta); }
  .exam-result__stats {
    margin: 0 0 28px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px 28px;
  }
  @media (min-width: 640px) {
    .exam-result__stats { grid-template-columns: repeat(4, 1fr); }
  }
  .exam-result__stats div {
    border-left: 2px solid var(--color-cyan);
    padding: 4px 0 4px 14px;
  }
  .exam-result__stats dt {
    font-family: var(--font-ui);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.25em;
    color: var(--color-dim);
  }
  .exam-result__stats dd {
    margin: 4px 0 0;
    font-family: var(--font-hud);
    font-size: 1.6rem;
    color: var(--color-bone);
  }
  .exam-result__actions { display: flex; gap: 14px; flex-wrap: wrap; }
  .exam-result__btn {
    padding: 12px 22px;
    border: 1px solid var(--color-cyan);
    background: rgba(0, 240, 255, 0.12);
    color: var(--color-bone);
    font-family: "Rajdhani", sans-serif;
    font-weight: 600;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    cursor: pointer;
    transition: background 0.18s, box-shadow 0.18s;
  }
  .exam-result__btn:hover {
    background: rgba(0, 240, 255, 0.22);
    box-shadow: 0 0 18px rgba(0, 240, 255, 0.35);
  }
  .exam-result__btn--ghost {
    background: transparent;
    border-color: color-mix(in srgb, var(--color-cyan) 40%, transparent);
    color: var(--color-haze);
  }
  .exam-result__btn--ghost:hover {
    background: rgba(0, 240, 255, 0.08);
    box-shadow: none;
  }
</style>
