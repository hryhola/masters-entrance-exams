# Модель згенерованого контенту

## Принцип

Згенеровані питання створює coding agent безпосередньо в репозиторії та
публікує як статичні JSON-набори. Для цього не потрібні окремий
CLI-генератор, model API або локальний LLM runtime.

Ручний перегляд питань користувачем не потрібний: агент не показує їх у
чаті, тому користувач уперше бачить завдання під час проходження тесту.

Це не робить generated контент офіційним або редакторськи перевіреним.
Сайт завжди показує його походження та повідомляє, що перевірку виконав
агент.

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
  "agent": "codex",
  "model": "gpt-5",
  "instructions": {
    "id": "yefvv-it-agent-question-generation",
    "version": "1.0.0",
    "sha256": "..."
  },
  "generated_at": "2026-06-15T10:00:00.000Z",
  "workflow_version": "1.0.0",
  "research_report": "reports/generated/generated-yefvv-it-os-medium-001.research.md",
  "parameters": {
    "topic": "Операційні системи",
    "difficulty": "medium",
    "task_type": "single_choice"
  }
}
```

Інструкція фіксується ідентифікатором, версією та SHA-256. Назва моделі
записується, якщо середовище її повідомляє. `research_report` зберігає
авторитетні джерела та прив'язку предметних тверджень до них.

## Agent publication gate

Generated dataset дозволено завантажувати як production-контент лише з:

```json
{
  "method": "agent_validation",
  "status": "passed",
  "workflow_version": "1.0.0",
  "validated_at": "2026-06-15T10:01:00.000Z",
  "report": "reports/generated/generated-yefvv-it-os-medium-001.validation.json",
  "checks": [
    "schema",
    "source_grounding",
    "answer_integrity",
    "explanation_integrity",
    "duplicate_detection",
    "official_similarity",
    "exam_style"
  ],
  "similarity": {
    "maximum_score": 0.31,
    "threshold": 0.35
  }
}
```

Усі сім перевірок обов'язкові. `maximum_score` не може перевищувати
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

Інтерфейс показує окремі мітки «Згенероване» та «Перевірено агентом».
Офіційні dataset без нових полів отримують `official_source` під час
адаптації.
