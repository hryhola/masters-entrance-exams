# Research report: generated-yefvv-it-databases-20260617-001

## Параметри

- Іспит: ЄФВВ з інформаційних технологій.
- Розділ: «Бази та сховища даних».
- Кількість: 20 питань.
- Складність: hard.
- Тип: single choice, чотири варіанти, одна правильна відповідь.
- Мова: українська.
- Дата доступу до web-джерел: 2026-06-17.
- Режим доставки: ready for application.

## Покриття taxonomy

| Question ID | Topic code | Тема                                         | Cognitive level |
| ----------- | ---------- | -------------------------------------------- | --------------- |
| `...-001`   | 3.1        | Ключі та нормалізація даних                  | B               |
| `...-002`   | 3.1        | BCNF і функціональні залежності              | B               |
| `...-003`   | 3.1        | 2NF і часткові залежності                    | B               |
| `...-004`   | 3.1        | Транзитивні залежності та 3NF                | B               |
| `...-005`   | 3.2        | ACID-властивості транзакцій                  | B               |
| `...-006`   | 3.2        | Рівні ізоляції транзакцій                    | B               |
| `...-007`   | 3.2        | Багатостовпчикові індекси                    | B               |
| `...-008`   | 3.2        | Часткові індекси                             | B               |
| `...-009`   | 3.3        | Слабкі сутності в ER-моделюванні             | C               |
| `...-010`   | 3.3        | Логічне моделювання сховищ даних             | C               |
| `...-011`   | 3.3        | Концептуальна, логічна і фізична моделі      | C               |
| `...-012`   | 3.4        | Посилальна цілісність у реляційних БД        | B               |
| `...-013`   | 3.4        | Обмеження UNIQUE та зовнішні ключі           | B               |
| `...-014`   | 3.4        | Правила видалення у зовнішніх ключах         | B               |
| `...-015`   | 3.5        | GROUP BY та HAVING у SQL                     | C               |
| `...-016`   | 3.5        | Коректне використання LEFT JOIN              | C               |
| `...-017`   | 3.5        | TCL і SAVEPOINT                              | C               |
| `...-018`   | 3.5        | DML, DDL, DCL та TCL                         | C               |
| `...-019`   | 3.6        | Реляційне ділення                            | C               |
| `...-020`   | 3.6        | Еквівалентні перетворення реляційної алгебри | C               |

Повний префікс кожного скороченого ідентифікатора:
`generated-yefvv-it-databases-20260617-001`.

## Джерела

| Source ID              | Документ або сторінка                                           | Організація                            | Дата / версія                     | URL                                                                                                                              | Підтверджувані твердження                                                                      |
| ---------------------- | --------------------------------------------------------------- | -------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `MON-PROGRAM-2026`     | Програма предметного тесту з інформаційних технологій ЄФВВ 2026 | МОН України                            | наказ від 2025-12-02 № 1578       | https://mon.gov.ua/static-objects/mon/sites/1/vishcha-osvita/vstup-2026/prohramy-jefvv/programa-jefvv-informtexnologiyi-2025.pdf | Охоплення розділу 3: нормалізація, транзакції, індекси, моделювання, SQL та реляційна алгебра. |
| `IBM-NORMALIZATION`    | Normalization in database design                                | IBM Db2 documentation                  | current web documentation         | https://www.ibm.com/docs/en/db2-for-zos/12.0.0?topic=modeling-normalization-in-database-design                                   | Нормалізація як метод зменшення надлишковості й аномалій у реляційній моделі.                  |
| `MS-NORMALIZATION`     | Database normalization description                              | Microsoft Learn                        | current web documentation         | https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/access/database-normalization-description                      | Перші нормальні форми, залежності між атрибутами і декомпозиція таблиць.                       |
| `PG-CONSTRAINTS`       | PostgreSQL Constraints                                          | PostgreSQL Global Development Group    | PostgreSQL 18 documentation       | https://www.postgresql.org/docs/current/ddl-constraints.html                                                                     | Первинні, зовнішні, унікальні ключі та правила посилальної цілісності.                         |
| `PG-TRANSACTIONS`      | PostgreSQL Transactions                                         | PostgreSQL Global Development Group    | PostgreSQL 18 documentation       | https://www.postgresql.org/docs/current/tutorial-transactions.html                                                               | Транзакції як одиниці роботи, що виконуються повністю або скасовуються.                        |
| `PG-ISOLATION`         | PostgreSQL Transaction Isolation                                | PostgreSQL Global Development Group    | PostgreSQL 18 documentation       | https://www.postgresql.org/docs/current/transaction-iso.html                                                                     | Рівні ізоляції та наслідки паралельного виконання транзакцій.                                  |
| `PG-MULTICOLUMN-INDEX` | PostgreSQL Multicolumn Indexes                                  | PostgreSQL Global Development Group    | PostgreSQL 18 documentation       | https://www.postgresql.org/docs/current/indexes-multicolumn.html                                                                 | Ефективність багатостовпчикових B-tree індексів залежить від лівого префікса.                  |
| `PG-PARTIAL-INDEX`     | PostgreSQL Partial Indexes                                      | PostgreSQL Global Development Group    | PostgreSQL 18 documentation       | https://www.postgresql.org/docs/current/indexes-partial.html                                                                     | Частковий індекс містить тільки рядки, що задовольняють предикат.                              |
| `PG-AGGREGATES`        | PostgreSQL Aggregate Functions                                  | PostgreSQL Global Development Group    | PostgreSQL 18 documentation       | https://www.postgresql.org/docs/current/tutorial-agg.html                                                                        | Агрегація, GROUP BY та фільтрування груп умовою HAVING.                                        |
| `PG-SELECT`            | PostgreSQL SELECT                                               | PostgreSQL Global Development Group    | PostgreSQL 18 documentation       | https://www.postgresql.org/docs/current/sql-select.html                                                                          | Порядок логічної обробки SELECT, JOIN, WHERE, GROUP BY, HAVING, ORDER BY.                      |
| `ORACLE-DATA-MODELING` | Data Modeler Concepts and Usage                                 | Oracle documentation                   | Release 2.0 documentation         | https://docs.oracle.com/cd/E15276_01/doc.20/e13677/data_modeling.htm                                                             | Розмежування логічного та реляційного/фізичного моделювання, сутності та зв’язки.              |
| `MS-DESIGN-BASICS`     | Database design basics                                          | Microsoft Support                      | current web documentation         | https://support.microsoft.com/en-US/Access/database-design-basics                                                                | Практики виділення сутностей, атрибутів, ключів і зв’язків у проєктуванні БД.                  |
| `ORACLE-DWH-LOGICAL`   | Data Warehouse Logical Design                                   | Oracle Database Data Warehousing Guide | Oracle Database 19c documentation | https://docs.oracle.com/en/database/oracle/oracle-database/19/dwhsg/data-warehouse-logical-design.html                           | Факти, виміри та логічне проєктування сховищ даних.                                            |
| `WATERLOO-RELALG`      | Relational Algebra lecture notes                                | University of Waterloo                 | course PDF                        | https://cs.uwaterloo.ca/~tozsu/courses/CS338/lectures/5%20Rel%20Algebra.pdf                                                      | Основні операції реляційної алгебри: відбір, проєкція, з’єднання, різниця, ділення.            |
| `DB-BOOK-DIVISION`     | Database System Concepts practice exercises                     | Silberschatz, Korth, Sudarshan         | 6th edition exercises PDF         | https://www.db-book.com/db6/practice-exer-dir/6s.pdf                                                                             | Семантика реляційного ділення у запитах типу “для всіх”.                                       |

## Відповідність питань джерелам

| Question ID | Primary source         | Corroborating source |
| ----------- | ---------------------- | -------------------- |
| `...-001`   | `IBM-NORMALIZATION`    | `MS-NORMALIZATION`   |
| `...-002`   | `IBM-NORMALIZATION`    | `MS-NORMALIZATION`   |
| `...-003`   | `IBM-NORMALIZATION`    | `MS-NORMALIZATION`   |
| `...-004`   | `IBM-NORMALIZATION`    | `MS-NORMALIZATION`   |
| `...-005`   | `PG-TRANSACTIONS`      | `PG-ISOLATION`       |
| `...-006`   | `PG-ISOLATION`         | `PG-TRANSACTIONS`    |
| `...-007`   | `PG-MULTICOLUMN-INDEX` | `PG-SELECT`          |
| `...-008`   | `PG-PARTIAL-INDEX`     | `PG-SELECT`          |
| `...-009`   | `ORACLE-DATA-MODELING` | `MS-DESIGN-BASICS`   |
| `...-010`   | `ORACLE-DWH-LOGICAL`   | `MS-DESIGN-BASICS`   |
| `...-011`   | `ORACLE-DATA-MODELING` | `MS-DESIGN-BASICS`   |
| `...-012`   | `PG-CONSTRAINTS`       | `MS-DESIGN-BASICS`   |
| `...-013`   | `PG-CONSTRAINTS`       | `MS-DESIGN-BASICS`   |
| `...-014`   | `PG-CONSTRAINTS`       | `MS-DESIGN-BASICS`   |
| `...-015`   | `PG-AGGREGATES`        | `PG-SELECT`          |
| `...-016`   | `PG-SELECT`            | `PG-CONSTRAINTS`     |
| `...-017`   | `PG-TRANSACTIONS`      | `PG-SELECT`          |
| `...-018`   | `PG-SELECT`            | `PG-CONSTRAINTS`     |
| `...-019`   | `DB-BOOK-DIVISION`     | `WATERLOO-RELALG`    |
| `...-020`   | `WATERLOO-RELALG`      | `PG-SELECT`          |

## Застереження

- Питання не є офіційними матеріалами МОН або УЦОЯО; вони створені як тренувальний generated batch за програмою ЄФВВ.
- Питання уникають перевірки номерів версій, дат релізів і СКБД-специфічних деталей, якщо ці деталі не потрібні для загального принципу.
- SQL-приклади використовуються лише в межах теми 3.5 програми і не є фрагментами загальномовного програмування.
- Повні тексти питань навмисно відсутні у звіті, щоб зберегти режим без спойлерів.
