# vvadimkuznetsovv.github.io

Личный сайт Вадима Кузнецова + проект `/traffic-laws` (изучение ПДД).

Astro 6 + Svelte 5 islands + TailwindCSS 4 + MDX. Static, деплой на GitHub Pages
через GitHub Actions.

## Локально

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run preview  # превью прод-сборки
```

## Структура

```
src/
  layouts/Shell.astro       глобальный layout
  pages/index.astro         лендинг vvadimkuznetsovv.github.io/
  pages/traffic-laws/       секция ПДД (vvadimkuznetsovv.github.io/traffic-laws/)
  styles/global.css         дизайн-токены, шрифты, фон
```

## Деплой

Push в `main` → GitHub Actions собирает Astro и публикует на GitHub Pages.
Один раз в Settings → Pages → Source = GitHub Actions.

## План

`/root/.claude/plans/bright-sauteeing-moler.md` (приватно у автора).
