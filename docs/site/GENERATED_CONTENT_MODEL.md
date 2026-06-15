# Модель згенерованого контенту

## Принцип

Згенеровані питання готуються офлайн і публікуються як статичні JSON-набори.
Ручний редакторський перегляд не є обов'язковим: користувач уперше бачить
питання під час проходження тесту.

Це не робить generated контент офіційним. Сайт завжди показує його
походження та повідомляє, що перевірка була автоматичною.

## Походження

Schema v2 підтримує два значення `dataset.origin`:

- `official` — матеріал з офіційного джерела;
- `generated` — новий тренувальний матеріал.

Відсутнє поле `origin` означає `official`, тому наявні dataset залишаються
backward-compatible.

## Метадані генерації

Для `origin: generated` обов'язковий об'єкт `dataset.generation`:

```json
{
  "batch_id": "generated-yefvv-it-os-medium-001",
  "model": "generation-model",
  "prompt": {
    "id": "yefvv-it-single-choice",
    "version": "1.0.0",
    "sha256": "..."
  },
  "generated_at": "2026-06-15T10:00:00.000Z",
  "generator_version": "1.0.0",
  "parameters": {
    "topic": "Операційні системи",
    "difficulty": "medium",
    "task_type": "single_choice"
  }
}
```

Prompt фіксується ідентифікатором, версією та SHA-256. Це дозволяє
відтворити генерацію, не дублюючи великий текст prompt у кожному dataset.

## Автоматичний publication gate

Generated dataset дозволено завантажувати як production-контент лише з:

```json
{
  "method": "automated_validation",
  "status": "passed",
  "validator_version": "1.0.0",
  "validated_at": "2026-06-15T10:01:00.000Z",
  "checks": [
    "schema",
    "answer_integrity",
    "explanation_integrity",
    "duplicate_detection",
    "official_similarity"
  ],
  "similarity": {
    "maximum_score": 0.41,
    "threshold": 0.72
  }
}
```

Усі п'ять перевірок обов'язкові. `maximum_score` не може перевищувати
`threshold`.

Кожне питання generated batch додатково повинно:

- мати `answer.source: generated_key`;
- мати непорожнє пояснення зі статусом `generated`;
- посилатися на `generation_batch_id`, який збігається з dataset.

## Рівень довіри в застосунку

Runtime-модель зберігає:

- `origin`;
- `verification`;
- `generation`;
- тип джерела кожного питання.

Інтерфейс показує окремі мітки «Згенероване» та «Автоматично перевірено».
Офіційні dataset без нових полів отримують `official_source` під час
адаптації.
