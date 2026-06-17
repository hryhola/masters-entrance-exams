# Research report: generated-yefvv-it-computer-architecture-20260617-001

## Параметри

- Іспит: ЄФВВ з інформаційних технологій.
- Розділ: «Архітектура комп’ютера».
- Кількість: 20 питань.
- Складність: hard.
- Тип: single choice, чотири варіанти, одна правильна відповідь.
- Мова: українська.
- Дата доступу до web-джерел: 2026-06-17.
- Режим доставки: ready for application.

## Покриття taxonomy

| Question ID | Topic code | Тема                                         | Cognitive level |
| ----------- | ---------- | -------------------------------------------- | --------------- |
| `...-001`   | 2.1        | Комбінування логічних функцій                | B               |
| `...-002`   | 2.1        | XOR та парність бітів                        | B               |
| `...-003`   | 2.1        | Універсальність NAND                         | B               |
| `...-004`   | 2.2.1      | Переповнення у беззнаковій арифметиці        | B               |
| `...-005`   | 2.2.1      | Доповнювальний код і діапазон значень        | B               |
| `...-006`   | 2.2.1      | Арифметичний та логічний зсув                | B               |
| `...-007`   | 2.2.1      | Endianness і порядок байтів                  | B               |
| `...-008`   | 2.2.1      | Знакове переповнення у two’s complement      | B               |
| `...-009`   | 2.2.2      | Неточність двійкового floating point         | B               |
| `...-010`   | 2.2.2      | Нормалізоване подання і значущість           | B               |
| `...-011`   | 2.2.2      | Порівняння floating point після округлення   | B               |
| `...-012`   | 2.2.2      | Торгівля між діапазоном і точністю           | B               |
| `...-013`   | 2.3        | Memory-mapped I/O і портовий I/O             | A               |
| `...-014`   | 2.3        | Шина і арбітраж доступу                      | A               |
| `...-015`   | 2.4.1      | Фон Нейман проти Гарвардської архітектури    | A               |
| `...-016`   | 2.4.1      | Вузьке місце спільної пам’яті команд і даних | A               |
| `...-017`   | 2.4.2      | Локальність і кешування                      | A               |
| `...-018`   | 2.4.2      | Середній час доступу до пам’яті              | A               |
| `...-019`   | 2.4.2      | Load-store модель процесора                  | A               |
| `...-020`   | 2.4.3      | DMA, CPU та пристрої введення-виведення      | A               |

Повний префікс кожного скороченого ідентифікатора:
`generated-yefvv-it-computer-architecture-20260617-001`.

## Джерела

| Source ID             | Документ або сторінка                                                  | Організація                | Дата / версія                      | URL                                                                                                                                                                   | Підтверджувані твердження                                                                                                    |
| --------------------- | ---------------------------------------------------------------------- | -------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `MON-PROGRAM-2026`    | Програма предметного тесту з інформаційних технологій ЄФВВ 2026        | МОН України                | наказ від 2025-12-02 № 1578        | https://mon.gov.ua/static-objects/mon/sites/1/vishcha-osvita/vstup-2026/prohramy-jefvv/programa-jefvv-informtexnologiyi-2025.pdf                                      | Охоплення розділу 2: бінарна логіка, подання даних, I/O, шини, фон Нейман, Гарвардська архітектура, ієрархія пам’яті та CPU. |
| `PY-BITWISE`          | Built-in Types: Bitwise Operations on Integer Types                    | Python Software Foundation | Python 3.14 documentation          | https://docs.python.org/3/library/stdtypes.html#bitwise-operations-on-integer-types                                                                                   | Бітові операції, зсуви та інтерпретація від’ємних чисел через доповнювальний код.                                            |
| `MS-BITWISE`          | Bitwise and shift operators                                            | Microsoft Learn            | current C# reference               | https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/bitwise-and-shift-operators                                                              | Семантика AND, OR, XOR, NOT і зсувів для інтегральних типів.                                                                 |
| `INTEL-SDM-V1`        | Intel 64 and IA-32 Architectures Software Developer’s Manual, Volume 1 | Intel                      | basic architecture manual          | https://www.intel.com/content/dam/www/public/us/en/documents/manuals/64-ia-32-architectures-software-developer-vol-1-manual.pdf                                       | Типи даних, unsigned і signed two’s complement integers, basic execution environment, I/O ports.                             |
| `PY-FLOATING`         | Floating-Point Arithmetic: Issues and Limitations                      | Python Software Foundation | Python 3.14 documentation          | https://docs.python.org/3/tutorial/floatingpoint.html                                                                                                                 | Двійкове подання дробів з плаваючою комою, помилки округлення і неможливість точного подання деяких десяткових дробів.       |
| `PY-STRUCT`           | struct: Interpret bytes as packed binary data                          | Python Software Foundation | Python 3.14 documentation          | https://docs.python.org/3/library/struct.html                                                                                                                         | IEEE 754 binary32 і binary64 як компактні бінарні формати для чисел з плаваючою комою.                                       |
| `RISC-V-RV32I`        | RV32I Base Integer Instruction Set                                     | RISC-V International       | Unprivileged ISA v20260120         | https://docs.riscv.org/reference/isa/v20260120/unpriv/rv32.html                                                                                                       | Load-store модель, регістри, PC, байтова адресація, little-endian і memory-mapped I/O.                                       |
| `ARM-CACHE-HIERARCHY` | Caches and memory hierarchy                                            | Arm Developer              | Arm architecture documentation     | https://developer.arm.com/documentation/107565/0101/Memory-system/Caches-and-memory-hierarchy                                                                         | Роль кешів та ієрархії пам’яті у зменшенні середнього часу доступу.                                                          |
| `ARM-SYSTEM-ARCH`     | Learn the Architecture: System and Component Architectures             | Arm                        | current architecture guide index   | https://www.arm.com/architecture/learn-the-architecture/system-architecture                                                                                           | Системні архітектури, AMBA, GIC та взаємодія процесора з компонентами системи.                                               |
| `ARM-MEMORY-ATTR`     | Memory types and attributes and the memory order model                 | Arm Developer              | Arm architecture reference         | https://developer.arm.com/documentation/ddi0419/c/Application-Level-Architecture/ARM-Architecture-Memory-Model/Memory-types-and-attributes-and-the-memory-order-model | Типи пам’яті, атрибути пам’яті та відмінність device memory від normal memory.                                               |
| `ARM-ACP`             | Accelerator Coherency Port                                             | Arm Developer              | Cortex-A Series Programmer’s Guide | https://developer.arm.com/documentation/den0013/0400/Multi-core-processors/Cache-coherency/Accelerator-Coherency-Port--ACP-                                           | Когерентний доступ зовнішніх пристроїв до даних у кешованій ієрархії пам’яті.                                                |

## Відповідність питань джерелам

| Question ID | Primary source        | Corroborating source  |
| ----------- | --------------------- | --------------------- |
| `...-001`   | `PY-BITWISE`          | `MS-BITWISE`          |
| `...-002`   | `MS-BITWISE`          | `PY-BITWISE`          |
| `...-003`   | `MS-BITWISE`          | `PY-BITWISE`          |
| `...-004`   | `INTEL-SDM-V1`        | `RISC-V-RV32I`        |
| `...-005`   | `INTEL-SDM-V1`        | `PY-BITWISE`          |
| `...-006`   | `PY-BITWISE`          | `RISC-V-RV32I`        |
| `...-007`   | `RISC-V-RV32I`        | `INTEL-SDM-V1`        |
| `...-008`   | `INTEL-SDM-V1`        | `PY-BITWISE`          |
| `...-009`   | `PY-FLOATING`         | `PY-STRUCT`           |
| `...-010`   | `PY-STRUCT`           | `PY-FLOATING`         |
| `...-011`   | `PY-FLOATING`         | `PY-STRUCT`           |
| `...-012`   | `PY-FLOATING`         | `PY-STRUCT`           |
| `...-013`   | `INTEL-SDM-V1`        | `RISC-V-RV32I`        |
| `...-014`   | `ARM-SYSTEM-ARCH`     | `INTEL-SDM-V1`        |
| `...-015`   | `RISC-V-RV32I`        | `ARM-SYSTEM-ARCH`     |
| `...-016`   | `RISC-V-RV32I`        | `ARM-CACHE-HIERARCHY` |
| `...-017`   | `ARM-CACHE-HIERARCHY` | `INTEL-SDM-V1`        |
| `...-018`   | `ARM-CACHE-HIERARCHY` | `INTEL-SDM-V1`        |
| `...-019`   | `RISC-V-RV32I`        | `INTEL-SDM-V1`        |
| `...-020`   | `ARM-ACP`             | `ARM-MEMORY-ATTR`     |

## Застереження

- Питання не є офіційними матеріалами МОН або УЦОЯО; вони створені як тренувальний generated batch за програмою ЄФВВ.
- Питання не перевіряють конкретні версії процесорів, номери інструкцій або виробничі параметри окремих мікроархітектур.
- Бітові шаблони, арифметичні приклади та формули використано як математичні задачі теми 2, а не як фрагменти програм або псевдокоду.
- Повні тексти питань навмисно відсутні у звіті, щоб зберегти режим без спойлерів.
