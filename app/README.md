# React-застосунок

Клієнтська частина проєкту «Вступ 2026».

Основні команди:

```bash
npm run content:prepare
npm run dev
npm run check
npm run build
npm run preview
```

Значення `VITE_BASE_PATH` задає base path production-збірки. GitHub
Actions автоматично встановлює його відповідно до назви репозиторію.

`content:prepare` перевіряє SHA-256 фінального набору та 9 вебресурсів,
після чого створює `public/content/`. Команди `dev`, `check` і `build`
запускають цю підготовку автоматично.

Тестовий рушій розміщено в `src/features/practice`. Маршрути
`#/practice/setup`, `#/practice/:sessionId` і `#/results/:sessionId`
завантажуються окремим lazy chunk. До реалізації Етапу 4 активні сесії
існують лише в пам'яті поточної вкладки.
