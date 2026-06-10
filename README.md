# Вступ 2026

Статичний React-застосунок для підготовки до вступних іспитів у
магістратуру. Перший набір даних містить ЄФВВ з інформаційних технологій
2024 року; архітектура передбачає подальше додавання ЄВІ.

## Локальний запуск

Потрібен Node.js 24 або новіший.

```bash
cd app
npm install
npm run dev
```

## Перевірки

```bash
cd app
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Команда `npm run check` запускає форматування, lint, перевірку типів і
unit-тести разом.

## Деплой

Workflow `.github/workflows/deploy-pages.yml` перевіряє застосунок,
збирає його з base path поточного репозиторію та публікує на GitHub
Pages після push у `main`.

## Документація

- [План сайту](docs/site/README.md)
- [Вимоги до продукту](docs/site/PRODUCT_REQUIREMENTS.md)
- [Архітектура](docs/site/ARCHITECTURE.md)
- [Етап 1](docs/site/stages/01_FOUNDATION_AND_DEPLOYMENT.md)
