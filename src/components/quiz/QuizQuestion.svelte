<script lang="ts">
  interface Answer {
    answer_text: string;
    is_correct: boolean;
  }
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
    question: Question;
    index: number;
    total: number;
    showAnswers?: boolean;
    showExplanations?: boolean;
  }

  let {
    question,
    index,
    total,
    showAnswers = false,
    showExplanations = false,
  }: Props = $props();

  let selected: number | null = $state(null);

  function pick(i: number) {
    selected = i;
  }

  function reset() {
    selected = null;
  }

  // Reveal answers if: user picked one OR the "Ответы" toggle is on
  const revealed = $derived(selected !== null || showAnswers);

  const isCorrect = $derived(
    selected !== null && question.answers[selected]?.is_correct === true,
  );
</script>

<article class="qq hud-frame hud-frame--cyber" data-revealed={revealed}>
  <span class="hud-c hud-c-tl" aria-hidden="true"></span>
  <span class="hud-c hud-c-tr" aria-hidden="true"></span>
  <span class="hud-c hud-c-bl" aria-hidden="true"></span>
  <span class="hud-c hud-c-br" aria-hidden="true"></span>
  <span class="hud-ribs" aria-hidden="true">
    <span></span>
    <span></span>
    <span></span>
  </span>
  <span class="hud-notch-tr" aria-hidden="true"></span>

  <header class="qq__head">
    <span class="qq__meta">
      <span class="qq__yellow">Вопрос {index + 1}</span>
      <span class="qq__dim">/ {total}</span>
    </span>
    <span class="qq__topic">{question.topic.join(" · ")}</span>
  </header>

  {#if question.image}
    <div class="qq__img-wrap">
      <img
        src={question.image}
        alt={`Иллюстрация к вопросу ${index + 1}`}
        loading="lazy"
        class="qq__img"
      />
    </div>
  {/if}

  <h2 class="qq__question">{question.question}</h2>

  <ol class="qq__answers">
    {#each question.answers as a, ai}
      {@const isSelected = selected === ai}
      {@const showCorrect = revealed && a.is_correct}
      {@const showWrong = revealed && isSelected && !a.is_correct}
      <li>
        <button
          type="button"
          class="qq__a"
          class:qq__a--correct={showCorrect}
          class:qq__a--wrong={showWrong}
          class:qq__a--dim={revealed && !a.is_correct && !isSelected}
          onclick={() => pick(ai)}
        >
          <span class="qq__a-letter">{String.fromCharCode(65 + ai)}.</span>
          <span class="qq__a-text">{a.answer_text}</span>
          {#if showCorrect}
            <span class="qq__a-mark" aria-label="правильный">✓</span>
          {/if}
          {#if showWrong}
            <span class="qq__a-mark qq__a-mark--wrong" aria-label="неправильно">✗</span>
          {/if}
        </button>
      </li>
    {/each}
  </ol>

  {#if selected !== null}
    <div class="qq__verdict">
      {#if isCorrect}
        <span class="qq__verdict-tag">✓ Верно</span>
      {:else}
        <span class="qq__verdict-tag qq__verdict-tag--wrong">✗ Неверно</span>
      {/if}
      <button type="button" class="qq__retry" onclick={reset}>↻ Сбросить</button>
    </div>
  {/if}

  {#if showExplanations || (selected !== null && !isCorrect)}
    <div class="qq__explain">
      <p class="qq__explain-label">// объяснение</p>
      <p class="qq__explain-text">{question.answer_tip}</p>
    </div>
  {/if}
</article>

<style>
  .qq {
    /* hud-frame base provides background + padding + corners */
    /* additional state styling: */
    transition: box-shadow 0.2s;
  }

  .qq[data-revealed="true"] {
    box-shadow: inset 0 0 24px rgba(0, 240, 255, 0.08);
  }

  .qq__head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .qq__meta {
    font-family: var(--font-hud);
    font-size: 1.15rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .qq__yellow { color: var(--color-yellow); }
  .qq__dim { color: var(--color-dim); margin-left: 4px; }
  .qq__topic {
    font-family: var(--font-ui);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--color-dim);
  }

  .qq__img-wrap {
    margin-top: 20px;
    border: 1px solid var(--color-rack);
    background: rgba(5, 5, 8, 0.6);
    overflow: hidden;
  }
  .qq__img {
    display: block;
    width: 100%;
    height: auto;
    max-width: 640px;
  }

  .qq__question {
    margin-top: 22px;
    font-family: var(--font-ui);
    font-weight: 500;
    font-size: 1.1rem;
    line-height: 1.45;
    color: var(--color-bone);
  }
  @media (min-width: 640px) {
    .qq__question { font-size: 1.25rem; }
  }

  .qq__answers {
    list-style: none;
    margin: 22px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .qq__a {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid var(--color-rack);
    background: rgba(5, 5, 8, 0.4);
    color: var(--color-haze);
    font-family: var(--font-ui);
    font-size: 0.94rem;
    line-height: 1.5;
    text-align: left;
    cursor: pointer;
    transition: background 0.18s, border-color 0.18s, color 0.18s, transform 0.1s;
  }
  @media (min-width: 640px) {
    .qq__a { padding: 16px 20px; font-size: 1rem; }
  }
  .qq__a:hover {
    border-color: color-mix(in srgb, var(--color-cyan) 60%, transparent);
    background: rgba(0, 240, 255, 0.05);
    color: var(--color-bone);
  }
  .qq__a:active { transform: translateY(1px); }

  .qq__a-letter {
    font-family: var(--font-hud);
    font-size: 1.05rem;
    color: var(--color-dim);
    flex-shrink: 0;
    min-width: 24px;
  }
  .qq__a-text { flex: 1; }
  .qq__a-mark {
    margin-left: auto;
    font-family: var(--font-hud);
    font-size: 1.4rem;
    color: var(--color-toxic);
    text-shadow: 0 0 10px var(--color-toxic);
  }
  .qq__a-mark--wrong {
    color: var(--color-magenta);
    text-shadow: 0 0 10px var(--color-magenta);
  }

  .qq__a--correct {
    border-color: var(--color-toxic);
    background: rgba(0, 255, 156, 0.08);
    color: var(--color-bone);
    box-shadow:
      0 0 0 1px var(--color-toxic),
      0 0 22px rgba(0, 255, 156, 0.18);
  }
  .qq__a--correct .qq__a-letter { color: var(--color-toxic); }

  .qq__a--wrong {
    border-color: var(--color-magenta);
    background: rgba(255, 43, 214, 0.08);
    color: var(--color-bone);
    box-shadow:
      0 0 0 1px var(--color-magenta),
      0 0 22px rgba(255, 43, 214, 0.18);
  }
  .qq__a--wrong .qq__a-letter { color: var(--color-magenta); }

  .qq__a--dim { opacity: 0.55; }

  .qq__verdict {
    margin-top: 22px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .qq__verdict-tag {
    padding: 6px 16px;
    font-family: "Rajdhani", sans-serif;
    font-weight: 600;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--color-toxic);
    border: 1px solid var(--color-toxic);
    background: rgba(0, 255, 156, 0.08);
  }
  .qq__verdict-tag--wrong {
    color: var(--color-magenta);
    border-color: var(--color-magenta);
    background: rgba(255, 43, 214, 0.08);
  }
  .qq__retry {
    padding: 6px 14px;
    border: 1px solid color-mix(in srgb, var(--color-cyan) 50%, transparent);
    background: transparent;
    color: var(--color-cyan);
    font-family: "Rajdhani", sans-serif;
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    cursor: pointer;
    transition: background 0.18s, border-color 0.18s;
  }
  .qq__retry:hover {
    background: rgba(0, 240, 255, 0.08);
    border-color: var(--color-cyan);
  }

  .qq__explain {
    margin-top: 18px;
    padding: 14px 18px;
    border-left: 2px solid var(--color-cyan);
    background: rgba(0, 240, 255, 0.05);
  }
  .qq__explain-label {
    font-family: var(--font-hud);
    font-size: 1rem;
    color: var(--color-cyan);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin: 0;
  }
  .qq__explain-text {
    margin: 8px 0 0;
    font-family: var(--font-ui);
    font-size: 0.92rem;
    line-height: 1.55;
    color: var(--color-haze);
  }
  @media (min-width: 640px) {
    .qq__explain-text { font-size: 1rem; }
  }
</style>
