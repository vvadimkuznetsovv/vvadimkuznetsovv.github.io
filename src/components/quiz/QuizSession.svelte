<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import QuizQuestion from "./QuizQuestion.svelte";

  interface Question {
    id: string;
    title: string;
    ticket_number: string;
    image: string | null;
    question: string;
    answers: { answer_text: string; is_correct: boolean }[];
    correct_answer: string;
    answer_tip: string;
    topic: string[];
  }

  interface Props { questions: Question[]; }

  let { questions }: Props = $props();

  let showExplanations = $state(true);
  let timerEnabled = $state(false);
  let elapsed = $state(0);

  let timerHandle: ReturnType<typeof setInterval> | null = null;

  function loadBool(key: string, def: boolean): boolean {
    if (typeof localStorage === "undefined") return def;
    const v = localStorage.getItem(key);
    if (v === null) return def;
    return v === "true";
  }

  function saveBool(key: string, val: boolean) {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, String(val));
  }

  onMount(() => {
    showExplanations = loadBool("quiz.showExplanations", true);
    timerEnabled = loadBool("quiz.timerEnabled", false);
  });

  onDestroy(() => {
    if (timerHandle) clearInterval(timerHandle);
  });

  $effect(() => {
    saveBool("quiz.showExplanations", showExplanations);
  });

  $effect(() => {
    saveBool("quiz.timerEnabled", timerEnabled);
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
    if (timerEnabled) {
      elapsed = 0;
      timerHandle = setInterval(() => {
        elapsed += 1;
      }, 1000);
    } else {
      elapsed = 0;
    }
  });

  const timerDisplay = $derived(
    `${Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0")}:${(elapsed % 60).toString().padStart(2, "0")}`,
  );
</script>

<div class="qs">
  <div class="qs__bar">
    <label class="qs__toggle">
      <input type="checkbox" bind:checked={showExplanations} />
      <span class="qs__toggle-track">
        <span class="qs__toggle-thumb"></span>
      </span>
      <span class="qs__toggle-label">Объяснения</span>
    </label>

    <label class="qs__toggle">
      <input type="checkbox" bind:checked={timerEnabled} />
      <span class="qs__toggle-track">
        <span class="qs__toggle-thumb"></span>
      </span>
      <span class="qs__toggle-label">Таймер</span>
    </label>

    {#if timerEnabled}
      <span class="qs__timer">⏱ {timerDisplay}</span>
    {/if}
  </div>

  <div class="qs__list">
    {#each questions as q, i (q.id)}
      <QuizQuestion question={q} index={i} total={questions.length} {showExplanations} />
    {/each}
  </div>
</div>

<style>
  .qs { display: flex; flex-direction: column; gap: 28px; }

  .qs__bar {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 18px;
    padding: 14px 18px;
    border: 1px solid color-mix(in srgb, var(--color-cyan) 35%, transparent);
    background: rgba(8, 8, 18, 0.92);
    backdrop-filter: blur(10px);
  }

  .qs__toggle {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
  }
  .qs__toggle input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }
  .qs__toggle-track {
    position: relative;
    width: 38px;
    height: 20px;
    background: rgba(0, 240, 255, 0.08);
    border: 1px solid color-mix(in srgb, var(--color-cyan) 40%, transparent);
    transition: background 0.2s, border-color 0.2s;
  }
  .qs__toggle-thumb {
    position: absolute;
    top: 1px;
    left: 1px;
    width: 16px;
    height: 16px;
    background: var(--color-dim);
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4);
    transition: transform 0.2s ease, background 0.2s, box-shadow 0.2s;
  }
  .qs__toggle input:checked + .qs__toggle-track {
    background: rgba(0, 240, 255, 0.22);
    border-color: var(--color-cyan);
  }
  .qs__toggle input:checked + .qs__toggle-track .qs__toggle-thumb {
    transform: translateX(18px);
    background: var(--color-cyan);
    box-shadow: 0 0 12px var(--color-cyan);
  }
  .qs__toggle-label {
    font-family: "Rajdhani", sans-serif;
    font-weight: 600;
    font-size: 0.92rem;
    color: var(--color-haze);
    text-transform: uppercase;
    letter-spacing: 0.18em;
  }
  .qs__toggle:hover .qs__toggle-label { color: var(--color-bone); }

  .qs__timer {
    margin-left: auto;
    padding: 4px 14px;
    font-family: var(--font-hud);
    font-size: 1.4rem;
    color: var(--color-yellow);
    border: 1px solid color-mix(in srgb, var(--color-yellow) 50%, transparent);
    background: rgba(252, 238, 10, 0.06);
    text-shadow: 0 0 8px var(--color-yellow);
    letter-spacing: 0.15em;
  }

  .qs__list { display: flex; flex-direction: column; gap: 24px; }
</style>
