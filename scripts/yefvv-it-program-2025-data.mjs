export const programSections = [
  {
    code: "1",
    title: "Алгоритми та обчислювальна складність",
    weight_summary: { min: 8, max: 12 },
    weight_detailed: { min: 8, max: 12 },
  },
  {
    code: "2",
    title: "Архітектура комп’ютера",
    weight_summary: { min: 8, max: 10 },
    weight_detailed: { min: 8, max: 10 },
  },
  {
    code: "3",
    title: "Бази та сховища даних",
    weight_summary: { min: 10, max: 14 },
    weight_detailed: { min: 10, max: 14 },
  },
  {
    code: "4",
    title: "Інженерія систем і програмного забезпечення",
    weight_summary: { min: 10, max: 14 },
    weight_detailed: { min: 10, max: 14 },
  },
  {
    code: "5",
    title: "Кібербезпека та захист інформації",
    weight_summary: { min: 8, max: 10 },
    weight_detailed: { min: 8, max: 10 },
  },
  {
    code: "6",
    title: "Прикладна математика",
    weight_summary: { min: 16, max: 18 },
    weight_detailed: { min: 15, max: 19 },
  },
  {
    code: "7",
    title: "Комп’ютерні мережі та обмін даними",
    weight_summary: { min: 5, max: 7 },
    weight_detailed: { min: 5, max: 7 },
  },
  {
    code: "8",
    title: "Операційні системи",
    weight_summary: { min: 8, max: 10 },
    weight_detailed: { min: 8, max: 10 },
  },
  {
    code: "9",
    title: "Основи мов програмування",
    weight_summary: { min: 8, max: 10 },
    weight_detailed: { min: 8, max: 10 },
  },
  {
    code: "10",
    title: "Штучний інтелект",
    weight_summary: { min: 6, max: 8 },
    weight_detailed: { min: 6, max: 8 },
  },
];

const topicRows = `
1.1.1|B|4|Поняття алгоритму, часова та просторова складність
1.1.2|B|4|Абстрактні типи даних: стек, список, вектор, словник, множина, мультимножина, черга та черга з пріоритетами
1.1.3|B|4|Кортежі, множини, словники, одно- та двобічнозв’язні списки і складність операцій
1.1.4|B|4|Базові алгоритми пошуку й сортування та їх складність
1.1.5|B|4|Алгоритми на графах: BFS, DFS, компоненти зв’язності, кістякові дерева та найкоротші шляхи
1.2.1|B|4|Стратегія «розділяй та володарюй»
1.2.2|B|4|Стратегія балансування
1.2.3|B|4|Динамічне програмування
1.2.4|B|4|Складність алгоритмів для стратегій розроблення
1.3.1|B|4|Імперативний та декларативний підходи до програмування
1.3.2|B|4|Розв’язні, напіврозв’язні та нерозв’язні проблеми, проблема зупинки
2.1|B|4|Функції бінарної логіки
2.2.1|B|4|Позиційні системи числення, беззнаковий і доповнювальний коди та арифметичні операції
2.2.2|B|5|Подання й арифметика чисел із плаваючою комою
2.3|A|5|Пристрої введення-виведення та поняття шини комп’ютера
2.4.1|A|5|Структура комп’ютера, архітектури фон Неймана і Гарвардська
2.4.2|A|5|Ієрархія пам’яті та процесор універсального комп’ютера
2.4.3|A|5|Пристрої введення-виведення
3.1|B|5|Ключі та нормалізація даних: 1NF, 2NF, 3NF і BCNF
3.2|B|5|Моделі даних, мови запитів, транзакції, ACID, індекси, резервування, реплікація та безпека
3.3|C|5|Концептуальні, логічні й фізичні моделі даних та ER-моделювання
3.4|B|5|Реляційні бази даних і системи керування базами даних
3.5|C|5|Побудова SQL-запитів, DDL, DML, DCL і TCL
3.6|C|5|Операції реляційної алгебри
4.1.1|B|6|Властивості систем: емерджентність, адитивність та еквіфінальність
4.1.2|B|6|Відкриті й закриті системи
4.1.3|B|6|Спільне та відмінності складних і великих систем
4.2.1|B|6|Склад і структура системи, моделі чорної та білої скриньки
4.2.2|B|6|Концептуальні, математичні й комп’ютерні моделі
4.2.3|B|6|Зв’язок між системою та моделлю, гомоморфізм
4.3.1|B|6|Поняття, цілі та класифікація інформаційних систем
4.3.2|B|6|Види забезпечення інформаційних систем
4.4.1|B|6|Класифікація, джерела та методи збирання вимог
4.4.2|B|6|Вимоги користувача, варіанти використання та історії користувачів
4.4.3|B|6|Функціональні й нефункціональні вимоги та обмеження
4.5.1|B|6|Структурне, об’єктне, функціональне, архітектурне та інтерфейсне проєктування
4.5.2|B|6|Парадигми проєктування програмного забезпечення
4.5.3|C|6|Ідентифікація класів предметної області та UML-діаграми класів
4.5.4|B|7|UML-діаграми послідовностей і комунікації
4.5.5|B|7|Шаблони проєктування MVC, Abstract Factory, Facade, Decorator, Flyweight, Visitor, Observer, Proxy, Strategy та Chain of Responsibility
4.6.1|B|7|Стиль коду, структуровані одиниці та найменування
4.6.2|B|7|Засоби автоматичної генерації програмного коду
4.6.3|B|7|Налагодження та аналіз коду
4.6.4|B|7|Керування конфігурацією та версіями програмного забезпечення
4.6.5|B|7|Постійна інтеграція та постійне впровадження
4.7.1|C|7|Тестування методами білої та чорної скриньки
4.7.2|B|7|Модульне, інтеграційне, системне та валідаційне тестування
4.7.3|B|7|Розробка через тестування
4.7.4|B|7|Інспекція, стандарти, UX, продуктивність і масштабованість
4.8.1|B|7|Каскадна, ітераційна та інкрементна моделі розробки
4.8.2|B|7|RUP, MSF, Agile, Scrum, XP і Kanban
4.8.3|B|7|Ролі, обов’язки та командна робота
4.8.4|B|7|Планування, виконання та життєвий цикл ІТ-проєкту
5.1.1|A|8|Кіберпростір та інформаційний простір
5.1.2|B|8|Інформаційна безпека як складова національної, організаційної та особистої безпеки
5.1.3|B|8|Кібербезпека, захист інформації та кіберзахист
5.1.4|B|8|Технічний, інженерний, криптографічний та організаційний захист інформації
5.1.5|B|8|Конфіденційність, цілісність і доступність інформації
5.1.6|A|8|Принципи кібербезпеки
5.2.1|A|8|Загроза, атака та вразливість
5.2.2|B|8|Класифікація загроз і атак
5.2.3|B|8|Кіберзлочини, кібервійна та кібероборона
5.2.4|B|8|Кібертероризм та кіберрозвідка
5.2.5|B|8|Модель порушника
5.2.6|B|8|Комплексна система захисту інформації
5.3.1|B|8|Шкідливе програмне забезпечення
5.3.2|B|8|Шпигунські програми, фішинг і програми-вимагачі
5.3.3|B|8|DDoS-атаки
6.1.1|B|8|Числові послідовності, границі та нескінченно малі й великі величини
6.1.2|B|8|Похідна та дослідження функцій однієї змінної
6.1.3|B|8|Чисельне інтегрування, похибка та обчислювальна стійкість
6.1.4|B|8|Функції багатьох змінних, частинні похідні та екстремуми
6.1.5|B|8|Лінійна й нелінійна оптимізація та градієнтний спуск
6.1.6|B|9|Апроксимація, метод найменших квадратів, інтерполяція та сплайни
6.1.7|B|9|Числові й степеневі ряди та їх збіжність
6.1.8|B|9|Пряма, площина, гіперплощина та криві й поверхні другого порядку
6.1.9|B|9|Матриці, визначники та обернена матриця
6.1.10|B|9|Власні вектори та власні числа матриці
6.1.11|B|9|Системи лінійних рівнянь і чисельні методи їх розв’язання
6.1.12|B|9|Лінійний векторний простір, розмірність і базис
6.1.13|B|9|Чисельні методи розв’язування нелінійних рівнянь
6.2.1|C|9|Множини та операції над множинами
6.2.2|B|9|Бінарні відношення та їх властивості
6.2.3|B|9|Комбінаторний аналіз, правила суми й добутку та принцип включень-виключень
6.2.4|B|9|Математична логіка, таблиці істинності й булеві функції
6.2.5|B|9|Типи графів, вершини, ребра, ступені, суміжність, ізоморфізм та операції
6.2.6|B|9|Маршрути, ланцюги та цикли у графах
6.2.7|B|9|Зв’язність графа, компоненти та відстані
6.2.8|B|9|Дерева й ліси
6.2.9|B|10|Цілочисельна й дискретна оптимізація, задачі рюкзака і комівояжера
6.3|B|10|Застосування теорії ймовірностей та математичної статистики в ІТ
6.3.1|B|10|Стохастичні експерименти, події, комбінаторна, геометрична й умовна ймовірність
6.3.2|B|10|Повна ймовірність, формула Байєса, схема Бернуллі та закон великих чисел
6.3.3|B|10|Числові характеристики випадкових величин і вибірок
6.3.4|B|10|Розподіли випадкових величин
6.3.5|B|10|Статистичний зв’язок, регресія та кореляція
6.3.6|A|10|Багатовимірні дискретні величини, сумісний розподіл і кореляційна матриця
6.3.7|B|10|Випадкові функції та випадкові процеси
6.3.8|B|10|Первинна обробка даних, емпіричні розподіли та регресійний аналіз
6.3.9|C|10|Візуалізація даних
6.3.10|B|10|Точкові й інтервальні оцінки та довірчі інтервали
6.3.11|B|10|Статистичні гіпотези та рівень значущості
6.3.12|B|10|Системи масового обслуговування
6.4.1|B|10|Основні означення теорії диференціальних рівнянь і задача Коші
6.4.2|B|11|Диференціальні рівняння другого порядку та їх класифікація
6.4.3|B|11|Чисельні методи розв’язання диференціальних рівнянь
7.1|B|11|Класифікація, функції, комутація й топології комп’ютерних мереж
7.2|B|11|Протоколи, інтерфейси, OSI, TCP/IP, IPv4, IPv6, маски, префікси та порти
7.3|B|11|Інтернет речей
8.1.1|B|11|Однокористувацькі, багатокористувацькі та операційні системи реального часу
8.1.2|A|11|Основні функції операційних систем
8.1.3|B|11|Вимоги до операційних систем і відмовостійкість
8.2.1|B|11|Файли та файлові системи
8.2.2|B|11|Логічна й фізична організація файлів
9.1.1|B|11|Клас, об’єкт, конструктор, деструктор, інтерфейс і реалізація
9.1.2|B|11|Абстракція, інкапсуляція, спадкування та поліморфізм
9.1.3|C|11|Асоціація, агрегація, композиція, спадкування, залежність і реалізація
9.1.4|B|11|Порівняння процедурного та об’єктно-орієнтованого програмування
9.2|B|12|Функціональне, логічне, подійно-орієнтоване, реактивне й узагальнене програмування
9.3|B|12|Класифікація паралельних обчислень Флінна
9.4|B|12|Компілятор, інтерпретатор і компонувальник
10.1|B|12|Інтелектуальна система, агент, середовище, задачі та сильний і слабкий ШІ
10.2.1|B|12|Пошук у просторі станів: BFS, DFS, прямий, зворотний і двонаправлений
10.2.2|B|12|Семантичні мережі та продукційні моделі
10.3.1|B|12|Класифікація та навчання з учителем і без учителя
10.3.2|B|12|Тренувальні й валідаційні дані
10.3.3|B|12|Штучний нейрон, нейронна мережа та функції активації
`.trim();

export const programTopics = topicRows.split("\n").map((row) => {
  const [code, cognitiveLevel, sourcePage, title] = row.split("|");
  return {
    code,
    section_code: code.split(".")[0],
    title,
    cognitive_level: cognitiveLevel,
    source_page: Number(sourcePage),
  };
});

const classificationRows = `
1|8.1.1||aligned|B||operating-systems,real-time-systems|Прямо перевіряє вибір і властивості операційної системи реального часу.
2|9.1.4||legacy|B|concrete_programming_language|programming-paradigms,procedural-programming,object-oriented-programming|Тема відповідає порівнянню парадигм, але завдання спирається на назви конкретних мов програмування.
3|8.1.2||partial|B||operating-systems,processes,signals|Перевіряє конкретний механізм керування процесами Linux, який не деталізовано в програмі.
4|9.1.2||aligned|A||object-oriented-programming,abstraction|Прямо перевіряє базову концепцію абстракції.
5|4.5.3||aligned|B||uml,class-diagram,software-design|Перевіряє читання нотації UML-діаграми класів.
6|4.5.1|4.8.4|aligned|B||software-design,sdlc,decomposition|Перевіряє етап проєктування та декомпозицію системи.
7|8.2.1||aligned|A||files,file-systems,metadata|Перевіряє основні поняття про файли.
8|7.1||partial|B||computer-networks,power-line-communication|PLC є мережною технологією, але прямо не названа у програмі.
9|3.3||aligned|C||databases,er-modeling,data-modeling|Вимагає застосувати ER-моделювання до предметної області.
10|5.3.1||partial|B||cybersecurity,malware,ips|Засоби виявлення malware суміжні з темою, але IPS прямо не зазначено.
11|8.2.1||partial|B||file-systems,paths,windows|Перевіряє платформозалежний синтаксис шляху, якого програма не деталізує.
12|2.4.3|8.1.2|partial|B||device-drivers,input-output,operating-systems|Функція драйвера суміжна з пристроями введення-виведення та функціями ОС.
13|6.1.1||aligned|C||calculus,limits,sequences|Вимагає обчислити границю числової послідовності.
14|8.2.2||aligned|A||file-systems,physical-organization,blocks|Прямо перевіряє фізичну організацію файлів.
15|2.2.2||aligned|C||computer-architecture,floating-point,binary-numbers|Застосовує принципи нормалізації числа для формату з плаваючою комою.
16|10.3.3||aligned|B||artificial-intelligence,neural-networks,activation-functions|Прямо перевіряє сигмоїдну функцію активації.
17|10.3.1||aligned|B||machine-learning,supervised-learning,knn|Класифікує метод машинного навчання за типом навчання.
18|6.2.6||partial|B||discrete-mathematics,graphs,routes|Маршрутна матриця суміжна з маршрутами у графах, але прямо не названа.
19|6.2.3||aligned|C||combinatorics,permutations|Застосовує правило перестановок без повторень.
20|6.3.1||aligned|C||probability,random-event|Вимагає обчислити ймовірність елементарної події.
21|4.1.1||aligned|A||systems-engineering,equifinality|Прямо перевіряє визначення еквіфінальності.
22|9.4||aligned|B||compilers,interpreters,program-execution|Порівнює компіляцію та інтерпретацію.
23|3.6||aligned|C||databases,relational-algebra,difference,projection|Застосовує операції реляційної алгебри.
24|4.2.2||partial|C||systems-engineering,mathematical-models,dynamic-systems|Конкретна класифікація динамічних моделей ширша за формулювання програми.
25|7.2||aligned|B||computer-networks,osi,interfaces|Прямо розрізняє протокол та інтерфейс у моделі OSI.
26|5.2.2||aligned|B||cybersecurity,threat-classification|Прямо перевіряє класифікацію загроз.
27|7.2||aligned|C||computer-networks,ipv4,routing,default-gateway|Застосовує принципи IP-адресації та міжмережної передачі.
28|1.1.2||aligned|A||data-structures,stack,lifo|Прямо перевіряє властивість абстрактного типу даних «стек».
29|8.1.3||partial|B||operating-systems,clusters,fault-tolerance|Кластеризація суміжна з відмовостійкістю ОС, але прямо не названа.
30|10.2.1||aligned|B||artificial-intelligence,state-space-search,bfs|Розпізнає прямий пошук у ширину в просторі станів.
31|10.3.3||aligned|B||artificial-intelligence,neural-networks,activation-functions|Порівнює основні функції активації нейрона.
32|2.4.3||partial|A||input-output,peripherals,plug-and-play|Plug and Play є деталлю роботи периферії, не названою окремо.
33|3.1||aligned|B||databases,normalization,first-normal-form|Перевіряє атомарність значень як вимогу нормальної форми.
34|4.8.2||aligned|B||software-engineering,kanban,agile|Прямо перевіряє принципи Kanban.
35|7.3||aligned|B||internet-of-things,network-protocols|Перевіряє технології обміну даними в IoT.
36|4.5.5||partial|A||software-design,design-patterns,bridge|Bridge належить до патернів, але не входить до переліку програми.
37|3.1||aligned|C||databases,normalization,third-normal-form|Застосовує правила приведення відношення до 3NF.
38|6.1.2||aligned|C||calculus,derivative,limit-definition|Обчислює похідну через границю.
39|10.2.2||aligned|B||artificial-intelligence,knowledge-representation,production-model|Розпізнає продукційну модель подання знань.
40|2.2.1||aligned|C||computer-architecture,twos-complement,binary-arithmetic|Виконує арифметичну операцію в доповнювальному коді.
41|3.2||aligned|C||databases,indexes,query-optimization|Застосовує індексування для оптимізації запиту.
42|5.2.4||partial|B||cybersecurity,cyber-intelligence,legal-aspects|Кіберрозвідка входить до програми, але юридична деталізація не визначена.
43|7.2||aligned|A||computer-networks,tcp-ip,tcp|Перевіряє базову властивість транспортного протоколу TCP.
44|4.8.1||aligned|B||software-engineering,waterfall,sdlc|Прямо перевіряє каскадну модель життєвого циклу.
45|10.3.2||aligned|A||machine-learning,training-data,datasets|Прямо перевіряє поняття навчальної вибірки.
46|10.2.1||aligned|B||artificial-intelligence,state-space-search|Перевіряє сутність пошуку рішень у просторі станів.
47|1.2.1||aligned|B||algorithms,divide-and-conquer,decomposition|Прямо перевіряє рекурсивну декомпозицію у стратегії «розділяй та володарюй».
48|5.1.1||aligned|A||cybersecurity,cyberspace,legal-definition|Прямо перевіряє поняття кіберпростору.
49|5.3.3|5.1.5|aligned|B||cybersecurity,ddos,availability|Пов’язує DDoS-атаку з порушенням доступності.
50|3.5||aligned|B||databases,sql,data-manipulation|Перевіряє призначення операторів SQL.
51|9.1.1||legacy|C|concrete_programming_language,program_fragment|object-oriented-programming,destructor,cpp|Тема деструктора є чинною, але відповідь визначається за фрагментами C++.
52|9.1.2||aligned|B||object-oriented-programming,encapsulation|Прямо перевіряє інкапсуляцію та її наслідки.
53|1.1.3||aligned|B||data-structures,linked-lists,doubly-linked-list|Порівнює одно- і двобічнозв’язні списки.
54|||unmapped|A||information-protection,state-secrecy|Строк дії грифа державної таємниці не входить до програми 2025 року.
55|1.2.2||aligned|B||algorithms,balanced-trees,avl-tree|Перевіряє приклад балансованого дерева.
56|6.2.5||partial|C||discrete-mathematics,graphs,planarity|Планарність графів не зазначена у деталізованій програмі.
57|6.1.2||aligned|C||calculus,derivative,trigonometric-functions|Вимагає обчислити похідну функції однієї змінної.
58|2.4.1||aligned|B||computer-architecture,harvard-architecture|Прямо порівнює Гарвардську архітектуру.
59|9.4||legacy|C|pseudocode,program_fragment|program-translation,macros,pseudocode|Макровизначення не назване в програмі й подане як фрагмент псевдокоду.
60|3.5|3.6|aligned|A||databases,sql,union|Перевіряє оператор SQL для операції об’єднання.
61|6.2.1||aligned|C||discrete-mathematics,sets,set-difference|Застосовує властивості різниці множин.
62|2.2.1||aligned|A||number-systems,positional-notation,radix|Прямо перевіряє базис позиційної системи числення.
63|8.1.3||aligned|B||operating-systems,fault-tolerance|Прямо перевіряє поняття відмовостійкості.
64|9.1.2||aligned|B||object-oriented-programming,polymorphism,virtual-methods|Перевіряє механізм реалізації поліморфізму.
65|7.1||aligned|C||computer-networks,circuit-switching,latency|Застосовує властивості мережі з комутацією каналів.
66|1.1.4||aligned|B||algorithms,sorting,merge-sort,complexity|Порівнює асимптотичну складність алгоритмів сортування.
67|2.2.1||aligned|C||number-systems,binary-conversion|Перетворює десяткове число у двійкову систему.
68|4.2.2||partial|A||mathematical-models,epidemic-models,malware-propagation|Модель SI є конкретною математичною моделлю, якої програма не називає.
69|4.7.3||aligned|B||software-testing,tdd,test-first|Перевіряє принцип розробки через тестування.
70|4.8.1||aligned|B||software-engineering,waterfall,v-model|Розпізнає різновид каскадної моделі.
71|4.4.2||aligned|B||requirements,use-case,uml|Розпізнає UML-діаграму варіантів використання.
72|3.5||partial|A||databases,sql,enum|ENUM є конкретним типом SQL, не деталізованим у програмі.
73|9.2||aligned|B||programming-paradigms,functional-programming|Прямо перевіряє властивості функціонального програмування.
74|1.1.1||aligned|B||algorithms,complexity,big-o|Прямо перевіряє сталу часову складність.
75|6.2.5||aligned|C||discrete-mathematics,directed-graphs,vertex-degree|Обчислює вхідний степінь вершини орграфа.
76|6.1.4||aligned|C||calculus,multivariable-functions,stationary-points|Застосовує частинні похідні для пошуку стаціонарних точок.
77|7.1||aligned|B||computer-networks,circuit-switching|Прямо перевіряє принцип комутації каналів.
78|7.1||partial|A||computer-networks,switching,backbone|Комутація комірок є спеціалізованою технологією, не названою в програмі.
79|3.5|3.6|aligned|C||databases,sql,intersection|Порівнює SQL-запити та результат операції INTERSECT.
80|9.4||aligned|B||compilers,interpreters,machine-code|Пояснює загальний процес виконання скомпільованого й інтерпретованого коду.
81|4.1.3||partial|B||systems-engineering,complex-systems,problem-definition|Поняття проблеми у складній системі суміжне з розділом, але прямо не визначене.
82|1.3.2||aligned|B||computability,semidecidable-problems|Прямо перевіряє поняття напіврозв’язної задачі.
83|3.5||aligned|C||databases,sql,like|Будує умову SQL для пошуку за шаблоном.
84|3.2||aligned|C||databases,indexes,query-optimization|Обирає поле індексу на основі структури запиту.
85|10.3.1||aligned|B||machine-learning,classification|Розпізнає приклад задачі класифікації.
86|3.5||aligned|C||databases,sql,query-evaluation|Обчислює результат виконання SQL-запиту над таблицею.
87|5.1.4||partial|A||information-protection,steganography|Стеганографія суміжна із захистом інформації, але прямо не названа.
88|||unmapped|B||algorithms,greedy-strategy|Жадібна стратегія відсутня серед стратегій, перелічених у програмі 2025 року.
89|4.1.3||partial|B||systems-engineering,system-classification|Класифікація систем за походженням не деталізована в програмі.
90|8.2.1||partial|A||file-systems,linux,root-directory|Перевіряє платформозалежну деталь файлової системи Linux.
91|1.1.2||legacy|C|pseudocode,program_fragment|data-structures,stack,pseudocode|Тема стека чинна, але завдання використовує послідовність команд у формі псевдокоду.
92|2.4.2||aligned|B||computer-architecture,memory-hierarchy,ram|Порівнює розташування рівнів ієрархії пам’яті.
93|10.3.1||aligned|B||machine-learning,classification,image-recognition|Розпізнає приклад задачі класифікації.
94|7.2||aligned|C||computer-networks,ipv4,subnet-mask|Застосовує поняття маски підмережі.
95|7.2||partial|B||computer-networks,routing,static-routes|Плаваючі статичні маршрути є спеціалізацією маршрутизації, не названою прямо.
96|||unmapped|B||machine-learning,image-segmentation,metrics|Сегментація зображень та її метрики відсутні в програмі 2025 року.
97|6.1.2||aligned|C||calculus,derivative,exponential-function|Обчислює похідну експоненційної функції.
98|10.1||aligned|B||artificial-intelligence,strong-ai|Прямо перевіряє поняття сильного штучного інтелекту.
99|4.2.3||aligned|B||systems-engineering,isomorphism,models|Перевіряє перенесення знань через ізоморфізм систем.
100|5.2.2|7.2|aligned|B||cybersecurity,arp-spoofing,network-attack|Розпізнає мережеву атаку за її механізмом.
101|3.5||aligned|C||databases,sql,group-by,having|Будує групування та умову відбору груп у SQL.
102|3.1||aligned|B||databases,primary-key,relational-model|Перевіряє функцію первинного ключа.
103|6.1.9||aligned|C||linear-algebra,matrices,outer-product|Визначає форму результату множення векторів.
104|1.1.4||aligned|B||algorithms,sorting,quick-sort|Перевіряє принцип розбиття у швидкому сортуванні.
105|10.1||aligned|B||artificial-intelligence,weak-ai|Прямо перевіряє поняття слабкого штучного інтелекту.
106|2.4.3||partial|B||computer-architecture,input-output,interfaces|Функції інтерфейсної схеми деталізують тему пристроїв введення-виведення.
107|2.4.2||partial|B||computer-architecture,cpu,thermal-limits|Теплове обмеження частоти процесора суміжне з темою CPU, але не назване.
108|8.1.1||partial|B||operating-systems,real-time-systems,responsiveness|Реактивність RTOS відповідає темі, але конкретна техніка не деталізована.
109|5.1.4||partial|A||cybersecurity,cryptography,hash-functions|Криптографічний захист є в програмі, але конкретні стандарти не перелічені.
110|3.5||aligned|A||databases,sql,dcl,grant|Прямо перевіряє оператор DCL для надання прав.
111|6.1.8|10.3.1|aligned|B||linear-algebra,hyperplane,svm,classification|Застосування гіперплощини прямо спирається на відповідну математичну тему.
112|3.3|3.1|aligned|B||databases,data-modeling,logical-model,normalization|Пов’язує логічну модель даних із нормалізацією.
113|7.1||aligned|B||computer-networks,topology,star|Розпізнає топологію локальної мережі.
114|2.4.3||partial|A||input-output,printer,laser-printer|Механіка лазерного принтера є деталлю пристроїв введення-виведення.
115|9.4||aligned|A||linker,program-translation,object-modules|Прямо перевіряє призначення компонувальника.
116|6.2.3||aligned|C||combinatorics,sum-rule|Застосовує комбінаторне правило суми.
117|7.2||aligned|C||computer-networks,ipv4,prefix|Визначає адресу мережі за IPv4-адресою та префіксом.
118|9.1.4||aligned|B||programming-paradigms,procedural-programming|Прямо перевіряє основу процедурного програмування.
119|6.2.5||aligned|C||discrete-mathematics,directed-graphs,vertex-degree|Обчислює вихідний степінь вершини орграфа.
120|6.2.1||aligned|C||discrete-mathematics,sets,symmetric-difference|Визначає операцію над множинами за результатом.
121|2.4.1||aligned|A||computer-architecture,von-neumann-architecture|Прямо перевіряє склад класичної архітектури фон Неймана.
122|6.3.8||aligned|B||statistics,data-preprocessing,data-cleaning|Прямо перевіряє початковий етап первинної обробки даних.
123|1.1.1||aligned|B||algorithms,complexity,input-size|Перевіряє зміст параметра n в асимптотичній складності.
124|5.1.4||partial|A||information-protection,engineering-protection,security-principles|Конкретний принцип інженерно-технічного захисту не деталізовано.
125|2.4.2||aligned|A||computer-architecture,registers,memory-hierarchy|Прямо перевіряє призначення регістрів.
126|1.1.2||legacy|C|pseudocode,program_fragment|data-structures,queue,pseudocode|Тема черги чинна, але завдання подано як фрагмент псевдокоду.
127|7.3|5.2.2|aligned|B||internet-of-things,cybersecurity,cyberattacks|Оцінює ключову інформаційну проблему IoT.
128|9.3||aligned|B||parallel-computing,flynn-classification,clusters|Прямо застосовує класифікацію Флінна.
129|10.3.3||aligned|B||artificial-intelligence,neural-networks,training|Перевіряє сутність навчання нейронної мережі.
130|8.1.1||aligned|B||operating-systems,multiuser-systems|Прямо перевіряє перевагу багатокористувацької ОС.
131|2.1|2.2.1|aligned|C||binary-logic,xor,binary-numbers|Виконує додавання за модулем два над двійковими числами.
132|5.3.1|5.3.2|aligned|B||cybersecurity,malware,trojan,spyware|Розпізнає різновид шкідливого програмного забезпечення за описом.
133|3.2||aligned|B||databases,data-integrity|Перевіряє властивість цілісності даних.
134|1.1.5||aligned|B||algorithms,graphs,bfs|Прямо перевіряє порядок обходу графа в ширину.
135|8.2.2||partial|B||file-systems,records,physical-blocks|Кластер записів суміжний із логічною та фізичною організацією файлів.
136|9.1.3||aligned|B||object-oriented-programming,class-relations,realization|Розпізнає зв’язок реалізації між класами.
137|5.1.5|5.1.6|aligned|B||cybersecurity,integrity,cia-triad|Прямо перевіряє принцип цілісності інформації.
138|5.1.5||partial|B||cybersecurity,cia-triad,dad-model|Модель DAD є похідним поняттям від CIA, але прямо не названа.
139|8.2.2||aligned|B||file-systems,logical-organization|Прямо перевіряє логічну організацію файлів.
140|1.1.5||aligned|C||algorithms,graphs,dfs,tree-traversal|Виконує обхід графа в глибину.
`.trim();

export const questionClassifications = classificationRows
  .split("\n")
  .map((row) => {
    const [
      number,
      primaryTopicCode,
      secondaryTopicCodes,
      alignment,
      cognitiveLevel,
      violations,
      tags,
      rationale,
    ] = row.split("|");

    return {
      number: Number(number),
      primary_topic_code: primaryTopicCode || null,
      secondary_topic_codes: secondaryTopicCodes
        ? secondaryTopicCodes.split(",")
        : [],
      alignment,
      cognitive_level: cognitiveLevel,
      violations: violations ? violations.split(",") : [],
      tags: tags ? tags.split(",") : [],
      rationale,
    };
  });
