# Архітектура навчального сайту

## Базовий стек

- React із TypeScript;
- Vite для локальної розробки й production-збірки;
- React Router;
- CSS Modules або звичайні CSS-файли з дизайн-токенами;
- Vitest і React Testing Library;
- Playwright для основних браузерних сценаріїв;
- GitHub Actions і GitHub Pages.

Конкретні версії залежностей фіксуються під час Етапу 1, а не в цьому
документі.

## Принцип модульності

Тестовий рушій не повинен знати про конкретний ЄФВВ 2024. Він працює з
уніфікованими сутностями:

```text
ExamDefinition
Dataset
Question
ContentBlock
Option
Session
Attempt
QuestionProgress
ReviewSchedule
```

Особливості іспиту описує `ExamDefinition`: доступні режими, типи
питань, правила таймера, спосіб оцінювання та тематична таксономія.

## Орієнтовна структура застосунку

```text
app/
  src/
    app/
    components/
    content/
    exams/
    features/
      practice/
      results/
      review/
      progress/
    storage/
    styles/
    test/
  public/
    content/
  scripts/
```

Файли з `data/` та `assets/` не копіюються вручну. Build-скрипт формує
`app/public/content/` із канонічного JSON і потрібних медіаресурсів.

## Завантаження контенту

1. Реєстр іспитів містить метадані й URL набору.
2. Loader завантажує JSON відносно `import.meta.env.BASE_URL`.
3. Дані проходять легку runtime-перевірку.
4. Adapter перетворює версію набору на внутрішню модель застосунку.
5. Компоненти отримують тільки нормалізовану модель.

Це дозволяє змінювати формат джерела або додавати ЄВІ без дублювання UI.

## Рендеринг контенту

Один `ContentRenderer` обробляє:

- `markdown`;
- `math`;
- `code`;
- `table`;
- `image`.

Кожен тип реалізується окремим компонентом. Невідомий тип не ламає всю
сторінку, а показує діагностичний placeholder.

## Стан застосунку

- URL: вибраний іспит, сторінка та ідентифікатор сесії;
- React state: поточна взаємодія з питанням;
- `localStorage`: профіль, сесії, спроби, прогрес і налаштування;
- статичний JSON: офіційні та затверджені згенеровані питання.

Окрема state-бібліотека не додається на старті. Спочатку використовуються
React hooks, context і доменні reducer-функції. Потребу в іншому рішенні
оцінюємо після реалізації тестового рушія.

## Модель `localStorage`

Усі записи зберігаються під одним namespace:

```text
masters-exams:v1:profile
masters-exams:v1:sessions
masters-exams:v1:attempts
masters-exams:v1:question-progress
masters-exams:v1:settings
```

Доступ здійснюється лише через `StorageRepository`. Репозиторій:

- перевіряє структуру даних;
- має номер версії;
- виконує міграції;
- відновлюється після пошкодженого JSON;
- підтримує експорт, імпорт і повне очищення.

Жоден UI-компонент не звертається до `localStorage` напряму.

## Маршрутизація й GitHub Pages

Для першої версії використовується hash router. GitHub Pages не потребує
правил перенаправлення, а оновлення вкладеної сторінки не повертає 404.
Vite `base` налаштовується відповідно до імені GitHub-репозиторію.

Деплой виконує GitHub Actions:

1. встановлення залежностей;
2. перевірка форматування, типів і тестів;
3. підготовка статичного контенту;
4. production-збірка;
5. публікація build-артефакту в GitHub Pages.

## Якість і доступність

- семантичні заголовки, кнопки та форми;
- повна клавіатурна навігація;
- видимий focus state;
- текстові позначення правильності;
- достатній контраст;
- alt-текст для медіа;
- адаптивне відображення таблиць і коду;
- unit-тести для чистої доменної логіки;
- інтеграційні тести для сесії;
- browser-тести для проходження й відновлення тесту.

## Довідкові матеріали

- [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy)
- [GitHub Pages: Custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [React Router: createHashRouter](https://reactrouter.com/api/data-routers/createHashRouter)

