# Research report: generated-yefvv-it-operating-systems-20260617-001

## Параметри

- Іспит: ЄФВВ з інформаційних технологій.
- Розділ: «Операційні системи».
- Кількість: 20 питань.
- Складність: mixed — 5 easy, 5 medium, 10 hard.
- Тип: single choice, чотири варіанти, одна правильна відповідь.
- Мова: українська.
- Дата доступу до web-джерел: 2026-06-17.
- Режим доставки: ready for application.

## Покриття taxonomy

| Question ID | Topic code | Тема                                    | Difficulty |
| ----------- | ---------- | --------------------------------------- | ---------- |
| `...-001`   | 8.1.2      | Основні функції операційних систем      | easy       |
| `...-002`   | 8.1.1      | Типи операційних систем                 | easy       |
| `...-003`   | 8.1.2      | Процеси та потоки                       | easy       |
| `...-004`   | 8.2.1      | Файлові системи                         | easy       |
| `...-005`   | 8.1.3      | Відмовостійкість ОС                     | easy       |
| `...-006`   | 8.1.2      | Витісняльне планування                  | medium     |
| `...-007`   | 8.1.2      | Віртуальна пам’ять та ізоляція процесів | medium     |
| `...-008`   | 8.1.2      | Page fault                              | medium     |
| `...-009`   | 8.2.1      | Права доступу до файлів                 | medium     |
| `...-010`   | 8.2.2      | Логічна й фізична організація файлів    | medium     |
| `...-011`   | 8.1.2      | FCFS scheduling calculation             | hard       |
| `...-012`   | 8.1.2      | Round-robin scheduling reasoning        | hard       |
| `...-013`   | 8.1.2      | Working set and thrashing               | hard       |
| `...-014`   | 8.1.2      | Copy-on-write and process creation      | hard       |
| `...-015`   | 8.2.2      | Inode, dentry and hard links            | hard       |
| `...-016`   | 8.2.1      | Journaling and crash consistency        | hard       |
| `...-017`   | 8.1.1      | Real-time scheduling constraints        | hard       |
| `...-018`   | 8.1.3      | Virtualization and isolation            | hard       |
| `...-019`   | 8.2.1      | ACL mask and effective permissions      | hard       |
| `...-020`   | 8.2.2      | File allocation strategy trade-offs     | hard       |

Повний префікс кожного скороченого ідентифікатора:
`generated-yefvv-it-operating-systems-20260617-001`

## Джерела

| Source ID            | Документ або сторінка                                           | Організація                | Дата / версія                 | URL                                                                                                                                       | Підтверджувані твердження                                                                                         |
| -------------------- | --------------------------------------------------------------- | -------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `MON-PROGRAM-2026`   | Програма предметного тесту з інформаційних технологій ЄФВВ 2026 | МОН України                | наказ від 2025-12-02 № 1578   | https://mon.gov.ua/static-objects/mon/sites/1/vishcha-osvita/vstup-2026/prohramy-jefvv/programa-jefvv-informtexnologiyi-2025.pdf          | Охоплення розділу 8: типи ОС, функції ОС, відмовостійкість, файли, файлові системи та організація файлів.         |
| `MS-PROCESSES`       | About Processes and Threads                                     | Microsoft Learn            | current Windows documentation | https://learn.microsoft.com/en-us/windows/win32/procthread/about-processes-and-threads                                                    | Процеси, потоки, адресний простір процесу, планування потоків і preemptive multitasking.                          |
| `MS-VIRTUAL-ADDRESS` | Virtual Address Space                                           | Microsoft Learn            | current Windows documentation | https://learn.microsoft.com/en-us/windows/win32/memory/virtual-address-space                                                              | Приватний віртуальний адресний простір процесу, таблиці сторінок і трансляція адрес.                              |
| `LINUX-SCHED`        | Scheduler                                                       | Linux Kernel documentation | current kernel documentation  | https://docs.kernel.org/scheduler/index.html                                                                                              | Підсистеми планування Linux, CFS, deadline scheduling, real-time group scheduling and related scheduler concepts. |
| `LINUX-PAGE-TABLES`  | Page Tables                                                     | Linux Kernel documentation | current kernel documentation  | https://docs.kernel.org/mm/page_tables.html                                                                                               | Page faults, page tables, memory presence checks and MMU/cache updates.                                           |
| `LINUX-VFS`          | Overview of the Linux Virtual File System                       | Linux Kernel documentation | current kernel documentation  | https://docs.kernel.org/filesystems/vfs.html                                                                                              | VFS, inode, dentry, file object, file descriptor table and filesystem abstraction.                                |
| `POSIX-ACL`          | POSIX Access Control Lists on Linux                             | USENIX / Gruenbacher       | 2003                          | https://www.usenix.org/legacy/publications/library/proceedings/usenix03/tech/freenix03/full_papers/gruenbacher/gruenbacher_html/main.html | Owner/group/other permission classes, read/write/execute permissions and ACL entries.                             |
| `NIST-VIRT`          | Guide to Security for Full Virtualization Technologies          | NIST SP 800-125            | 2011                          | https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-125.pdf                                                             | Hypervisor, guest OS isolation, virtual hardware and virtualization security considerations.                      |

## Відповідність питань джерелам

| Question ID | Difficulty | Primary source       | Corroborating source |
| ----------- | ---------- | -------------------- | -------------------- |
| `...-001`   | easy       | `MON-PROGRAM-2026`   | `MS-PROCESSES`       |
| `...-002`   | easy       | `MON-PROGRAM-2026`   | `MS-PROCESSES`       |
| `...-003`   | easy       | `MS-PROCESSES`       | `LINUX-SCHED`        |
| `...-004`   | easy       | `LINUX-VFS`          | `MON-PROGRAM-2026`   |
| `...-005`   | easy       | `MON-PROGRAM-2026`   | `NIST-VIRT`          |
| `...-006`   | medium     | `MS-PROCESSES`       | `LINUX-SCHED`        |
| `...-007`   | medium     | `MS-VIRTUAL-ADDRESS` | `LINUX-PAGE-TABLES`  |
| `...-008`   | medium     | `LINUX-PAGE-TABLES`  | `MS-VIRTUAL-ADDRESS` |
| `...-009`   | medium     | `POSIX-ACL`          | `LINUX-VFS`          |
| `...-010`   | medium     | `LINUX-VFS`          | `MON-PROGRAM-2026`   |
| `...-011`   | hard       | `LINUX-SCHED`        | `MS-PROCESSES`       |
| `...-012`   | hard       | `LINUX-SCHED`        | `MS-PROCESSES`       |
| `...-013`   | hard       | `LINUX-PAGE-TABLES`  | `MS-VIRTUAL-ADDRESS` |
| `...-014`   | hard       | `MS-VIRTUAL-ADDRESS` | `LINUX-PAGE-TABLES`  |
| `...-015`   | hard       | `LINUX-VFS`          | `POSIX-ACL`          |
| `...-016`   | hard       | `LINUX-VFS`          | `MON-PROGRAM-2026`   |
| `...-017`   | hard       | `LINUX-SCHED`        | `MON-PROGRAM-2026`   |
| `...-018`   | hard       | `NIST-VIRT`          | `MS-VIRTUAL-ADDRESS` |
| `...-019`   | hard       | `POSIX-ACL`          | `LINUX-VFS`          |
| `...-020`   | hard       | `LINUX-VFS`          | `MON-PROGRAM-2026`   |

## Застереження

- Питання не є офіційними матеріалами МОН або УЦОЯО; вони створені як тренувальний generated batch за програмою ЄФВВ.
- Питання не перевіряють команди конкретних ОС, версії ядер або вендорські CLI-налаштування.
- Формули й числові приклади використано як концептуальні задачі розділу 8, а не як фрагменти програм або псевдокод.
- Повні тексти питань навмисно відсутні у звіті, щоб зберегти режим без спойлерів.
