# Archive: Phase 0 — 1.7 (DONE)

История развития проекта `vvadimkuznetsovv.github.io` / traffic-laws.
Каждая фаза = блок коммитов с одной целью.

## Phase 0 — Очистка репо

**Commit cluster:** `7d02fe2`
- Удалена старая Capacitor‑игра (`game.html` ~260 KB, `android/`, `www/`, `assets/`, `capacitor.config.json`, `package*.json`)
- Освобождено ~165 MB
- Этого требовал заказчик: «старая игра не остаётся, её надо стереть»

## Phase 1.1 — Скаффолд Astro

**Commit:** `7d02fe2`
- Astro 5.18 + Svelte 5 + TailwindCSS 4 + MDX
- `astro.config.mjs`: `site: https://vvadimkuznetsovv.github.io`, без `base` (user site)
- GH Actions deploy.yml: push в main → build → deploy
- Решена проблема ICU: `apk-persist icu-data-full` (Alpine только small‑ICU)
- Хостинг user-site, кнопка Phase 0 заменена на полноценный Astro

## Phase 1.2 — Design system (киберпанк)

**Commit cluster:** `dc8dc82` → `da4e49d` (многие итерации)

Финальный стек:
- **Шрифты:** Rajdhani 600 (hero), Chakra Petch 500 (UI), Geist Mono (body), VT323 (HUD), Major Mono Display (display)
- **Неон:** `.neon-text` — RGB‑split chromatic aberration (-3px красный/+3px циан) + 3 слоя цветного halo + `neon-flicker` 6s (классический «broken tube» рецепт)
- **Фон:** cyan grid 44×44 px (0.085 opacity) + cyber‑bg div с 3 radial gradient + animated drift layer + horizontal scan beam (9s loop)
- **Цвета:** cyan #00f0ff (primary), magenta #ff2bd6 (accent), yellow #fcee0a (label), toxic green #00ff9c (success), magenta/pink (danger)

Уроки итераций сохранены в `~/.claude/projects/.../memory/feedback_design_iteration.md`.

## Phase 1.3 — Импорт open dataset ПДД

**Commit:** `d07a6da`
- Источник: `etspring/pdd_russia` (открытые официальные билеты ГИБДД РФ)
- 40 билетов × 20 вопросов = **800 вопросов** категории AB
- **277 SVG знаков** + полные описания (включая штрафы КоАП)
- 541 иллюстрация (jpg) → `public/images/pdd/questions/`
- Знаки → `public/images/pdd/signs/`
- JSON → `src/data/pdd/{tickets/*.json, signs.json}`
- Image paths переписаны с `./images/A_B/*` → `/images/pdd/questions/*`
- TS типы в `src/data/pdd/types.ts`
- Loader в `src/data/pdd/index.ts`

## Phase 1.4 — Quiz UX (интерактивные билеты + объяснения)

**Commits:** `c5576c7` → `ff3da65`

Финальная логика:
- `QuizQuestion.svelte` — клик по ответу подсвечивает выбранный + правильный, ✓/✗ marks, verdict tag, retry
- `QuizSession.svelte` — sticky control bar с 3 тогглами (Ответы / Объяснения / Таймер) + live mm:ss
- **Все 3 тоггла по умолчанию OFF**, состояние в `localStorage` (`quiz.showAnswers`, `quiz.showExplanations`, `quiz.timerEnabled`)
- Объяснения автоматически появляются **при неправильном ответе** даже когда тоггл OFF — учиться на ошибках
- 40 страниц билетов: `/traffic-laws/practice/[N]/`

## Phase 1.5 — Экзамен на время

**Commit:** `6c39fa4`

`Exam.svelte` — 3 состояния (idle/in-progress/result):
- **Idle:** правила ГИБДД, кнопка «Начать»
- **Run:** случайный билет (20 вопросов), 20 мин countdown, ≤2 ошибки, +5 доп. вопросов из той же темы за ошибку, +5 мин таймера, 3‑я ошибка = провал
- **Result:** verdict (passed/failed/timeout), статистика, retry

Sticky‑бар: билет, прогресс, ошибки (краснеет при 1‑й), таймер (вспыхивает magenta при < 2 мин).

## Phase 1.6 — Справочник знаков

**Commit:** `de088bd`

- `/traffic-laws/signs/` — каталог 277 знаков по 8 категориям, аспект‑квадрат tile, hover → cyan
- `/traffic-laws/signs/[id]/` — детальная страница с SVG, описанием, штрафами КоАП, prev/next по категории
- Slug: `1.1` → `1-1` (URL‑safe)
- Helpers в `data/pdd/index.ts`: `getSignsByCategory`, `getAllSignsFlat`, `getSignByNumber`, `signSlug`/`signFromSlug`

## Phase 1.7 — Изучение по темам

**Commit:** `f7e7a3b`

- `/traffic-laws/learn/` — каталог 26 тем (alphabetic, ru‑collation), счётчики вопросов/билетов
- `/traffic-laws/learn/[topic]/` — переиспользует `QuizSession` (те же тоггл)
- Slug: кириллица → латиница транслитом (e.g. «Дорожные знаки» → `dorozhnye-znaki`)
- Helpers: `getAllTopics`, `getTopicQuestions`, `topicSlug`/`getTopicBySlug`
- Build‑time memoization (`_topicMap`)
- Prev/next навигация по темам

## Структура UI/UX (общая, итог)

- **Главная страница лендинга** (`/`): Hero (PhotoFrame + большой Rajdhani neon‑name VADIM KUZNETSOV cyan+magenta) + projects‑секция
- **/traffic-laws/**: Hero (SVG светофор слева + TRAFFIC LAWS текст) + modes‑grid (4 LIVE + 1 QUEUED = роман)
- **Sticky status‑bar** сверху каждой страницы с timestamp + SYS_ONLINE dot
- **Mobile‑first**: bottom‑nav на mobile, side‑rack на desktop
- **A11y:** `prefers-reduced-motion` отключает все анимации

## Что НЕ делалось (откладывается)

- PWA / офлайн
- Giscus (комментарии к главам романа)
- Кастом‑домен
- Skill‑прогресс пользователя в `/progress`
- `/settings` страница

Эти задачи поедут в Phase 1.9 (polish).

## Известные деграды

- GH Actions использует Node 20 actions (warning в deploy — будут deprecated в июне 2026)
- Tilt Neon / Mr Dafoe / Monoton / Permanent Marker фонты подключались и удалялись итерациями — финал Rajdhani
- Klaxons.otf остался в `public/fonts/` (не используется) — можно удалить

## Источники

- ПДД dataset: https://github.com/etspring/pdd_russia (без явной лицензии, но основан на официальных билетах ГИБДД РФ — нормативные акты)
- Шрифт Rajdhani: Google Fonts, OFL
- Дизайн‑референс: https://cyberpunkredone.webflow.io/radio (frames + tabs), https://neon-text-web.webflow.io (рецепт неона)
