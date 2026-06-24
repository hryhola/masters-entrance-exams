# Research report: generated-yefvv-it-databases-20260624-001

## Параметри

- Іспит: ЄФВВ з інформаційних технологій.
- Розділ: «Бази та сховища даних».
- Кількість: 20 питань.
- Складність: 15 medium, 5 hard; dominant difficulty у dataset: medium.
- Тип: single choice, чотири варіанти, одна правильна відповідь.
- Мова: українська.
- Дата доступу до web-джерел: 2026-06-24.
- Режим доставки: ready for application.

## Покриття taxonomy

| Question ID | Topic code | Тема | Difficulty | Cognitive level |
| --- | --- | --- | --- | --- |
| `...-001` | 3.1 | 2NF і декомпозиція таблиці зі складеним ключем | medium | B |
| `...-002` | 3.1 | 1NF і повторювані групи | medium | B |
| `...-003` | 3.1 | 3NF і транзитивна залежність | medium | B |
| `...-004` | 3.2 | Durability як ACID-властивість | medium | B |
| `...-005` | 3.2 | Резервне копіювання і журнали транзакцій | medium | B |
| `...-006` | 3.2 | Реплікація і backup | medium | B |
| `...-007` | 3.2 | Індекси і компроміс продуктивності | medium | B |
| `...-008` | 3.3 | Перетворення many-to-many ER-зв’язку | medium | C |
| `...-009` | 3.3 | Концептуальна, логічна і фізична моделі | medium | C |
| `...-010` | 3.3 | Факти і виміри у сховищі даних | medium | C |
| `...-011` | 3.4 | Посилальна цілісність | medium | B |
| `...-012` | 3.4 | Первинний ключ і UNIQUE | medium | B |
| `...-013` | 3.4 | Один-до-багатьох у реляційній моделі | medium | B |
| `...-014` | 3.5 | GROUP BY і HAVING | medium | C |
| `...-015` | 3.5 | SQL set operations: INTERSECT | medium | C |
| `...-016` | 3.1 | Часткова і транзитивна залежності у складному ключі | hard | B |
| `...-017` | 3.2 | Фантомне читання та Serializable | hard | B |
| `...-018` | 3.5 | LEFT JOIN і умови фільтрування | hard | C |
| `...-019` | 3.5 | Recursive CTE для ієрархій | hard | C |
| `...-020` | 3.6 | Реляційне ділення для запитів “усі” | hard | C |

Повний префікс кожного скороченого ідентифікатора: `generated-yefvv-it-databases-20260624-001`.

## Джерела

| Source ID | Документ або сторінка | Організація | Дата / версія | URL | Підтверджувані твердження |
| --- | --- | --- | --- | --- | --- |
| `MON-PROGRAM-2026` | Програма предметного тесту з інформаційних технологій ЄФВВ 2026 | МОН України | наказ від 2025-12-02 № 1578 | https://mon.gov.ua/static-objects/mon/sites/1/vishcha-osvita/vstup-2026/prohramy-jefvv/programa-jefvv-informtexnologiyi-2025.pdf | Охоплення розділу 3: нормалізація, транзакції, індекси, моделювання, SQL та реляційна алгебра. |
| `IBM-NORMALIZATION` | Normalization in database design | IBM Db2 documentation | current web documentation | https://www.ibm.com/docs/en/db2-for-zos/12.0.0?topic=modeling-normalization-in-database-design | Нормалізація як спосіб уникати надлишковості та неузгодженості даних. |
| `MS-NORMALIZATION` | Description of the database normalization basics | Microsoft Learn | last updated 2025-05-26 | https://learn.microsoft.com/en-us/previous-versions/troubleshoot/microsoft-365/microsoft-365-apps/access/database-normalization-description | 1NF, 2NF, 3NF, усунення повторюваних груп, надлишковості та залежностей не від ключа. |
| `PG-TRANSACTIONS` | PostgreSQL Transactions | PostgreSQL Global Development Group | PostgreSQL 18 documentation | https://www.postgresql.org/docs/current/tutorial-transactions.html | Транзакція як all-or-nothing operation; COMMIT, ROLLBACK і SAVEPOINT. |
| `PG-ISOLATION` | PostgreSQL Transaction Isolation | PostgreSQL Global Development Group | PostgreSQL 18 documentation | https://www.postgresql.org/docs/current/transaction-iso.html | Феномени ізоляції: dirty read, nonrepeatable read, phantom read, serialization anomaly. |
| `PG-CONSTRAINTS` | PostgreSQL Constraints | PostgreSQL Global Development Group | PostgreSQL 18 documentation | https://www.postgresql.org/docs/current/ddl-constraints.html | Первинні, зовнішні, унікальні ключі та посилальна цілісність. |
| `PG-BACKUP` | PostgreSQL Backup and Restore / PITR | PostgreSQL Global Development Group | PostgreSQL 18 documentation | https://www.postgresql.org/docs/current/backup.html | Підходи до backup, continuous archiving, WAL і point-in-time recovery. |
| `PG-CREATE-INDEX` | PostgreSQL CREATE INDEX | PostgreSQL Global Development Group | PostgreSQL 18 documentation | https://www.postgresql.org/docs/current/sql-createindex.html | Індекси для підвищення продуктивності пошуку та часткові індекси. |
| `PG-MULTICOLUMN-INDEX` | PostgreSQL Multicolumn Indexes | PostgreSQL Global Development Group | PostgreSQL 18 documentation | https://www.postgresql.org/docs/current/indexes-multicolumn.html | Багатостовпчикові індекси та правило провідних стовпців для B-tree. |
| `ORACLE-DATA-MODELING` | Data Modeler Concepts and Usage | Oracle documentation | Release 2.0 documentation | https://docs.oracle.com/cd/E15276_01/doc.20/e13677/data_modeling.htm | Сутності, зв’язки та рівні моделювання даних. |
| `MS-DESIGN-BASICS` | Database design basics | Microsoft Support | current web documentation | https://support.microsoft.com/en-US/Access/database-design-basics | Сутності, атрибути, ключі й зв’язки в реляційному проєктуванні. |
| `ORACLE-DWH-LOGICAL` | Data Warehousing Logical Design | Oracle Database Data Warehousing Guide | Oracle Database 18 documentation | https://docs.oracle.com/en/database/oracle/oracle-database/18/dwhsg/data-warehouse-logical-design.html | Факти, виміри та зіркова схема сховищ даних. |
| `PG-AGGREGATES` | PostgreSQL Aggregate Functions | PostgreSQL Global Development Group | PostgreSQL 18 documentation | https://www.postgresql.org/docs/current/tutorial-agg.html | GROUP BY, HAVING, агрегатні функції та різниця між WHERE і HAVING. |
| `PG-SELECT` | PostgreSQL SELECT | PostgreSQL Global Development Group | PostgreSQL 18 documentation | https://www.postgresql.org/docs/current/sql-select.html | Логічна обробка SELECT, FROM, WHERE, GROUP BY, HAVING, set operations. |
| `PG-WITH` | PostgreSQL WITH Queries | PostgreSQL Global Development Group | PostgreSQL 18 documentation | https://www.postgresql.org/docs/current/queries-with.html | Common Table Expressions і WITH RECURSIVE для рекурсивних запитів. |
| `WATERLOO-RELALG` | Relational Algebra lecture notes | University of Waterloo | course PDF | https://cs.uwaterloo.ca/~tozsu/courses/CS338/lectures/5%20Rel%20Algebra.pdf | Операції реляційної алгебри, включно з діленням. |
| `DB-BOOK-DIVISION` | Database System Concepts practice exercises | Silberschatz, Korth, Sudarshan | 6th edition exercises PDF | https://www.db-book.com/db6/practice-exer-dir/6s.pdf | Семантика реляційного ділення для запитів типу “для всіх”. |

## Відповідність питань джерелам

| Question ID | Primary source | Corroborating source |
| --- | --- | --- |
| `...-001` | `IBM-NORMALIZATION` | `MS-NORMALIZATION` |
| `...-002` | `MS-NORMALIZATION` | `IBM-NORMALIZATION` |
| `...-003` | `MS-NORMALIZATION` | `IBM-NORMALIZATION` |
| `...-004` | `PG-TRANSACTIONS` | `PG-ISOLATION` |
| `...-005` | `PG-BACKUP` | `PG-TRANSACTIONS` |
| `...-006` | `PG-BACKUP` | `PG-TRANSACTIONS` |
| `...-007` | `PG-CREATE-INDEX` | `PG-MULTICOLUMN-INDEX` |
| `...-008` | `ORACLE-DATA-MODELING` | `MS-DESIGN-BASICS` |
| `...-009` | `ORACLE-DATA-MODELING` | `MS-DESIGN-BASICS` |
| `...-010` | `ORACLE-DWH-LOGICAL` | `PG-AGGREGATES` |
| `...-011` | `PG-CONSTRAINTS` | `MS-DESIGN-BASICS` |
| `...-012` | `PG-CONSTRAINTS` | `MS-DESIGN-BASICS` |
| `...-013` | `PG-CONSTRAINTS` | `MS-DESIGN-BASICS` |
| `...-014` | `PG-AGGREGATES` | `PG-SELECT` |
| `...-015` | `PG-SELECT` | `MON-PROGRAM-2026` |
| `...-016` | `IBM-NORMALIZATION` | `MS-NORMALIZATION` |
| `...-017` | `PG-ISOLATION` | `PG-TRANSACTIONS` |
| `...-018` | `PG-SELECT` | `PG-AGGREGATES` |
| `...-019` | `PG-WITH` | `PG-SELECT` |
| `...-020` | `WATERLOO-RELALG` | `DB-BOOK-DIVISION` |

## Застереження

- Питання не є офіційними матеріалами МОН або УЦОЯО; вони створені як тренувальний generated batch за програмою ЄФВВ.
- Питання уникають перевірки номерів версій, дат релізів і СКБД-специфічних деталей, якщо ці деталі не потрібні для загального принципу.
- SQL-приклади використовуються лише в межах теми 3.5 програми і не є фрагментами загальномовного програмування.
- Повні тексти питань навмисно відсутні у звіті, щоб зберегти режим без спойлерів.
