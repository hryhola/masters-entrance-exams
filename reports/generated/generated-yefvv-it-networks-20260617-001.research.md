# Research report: generated-yefvv-it-networks-20260617-001

## Параметри

- Іспит: ЄФВВ з інформаційних технологій.
- Розділ: «Комп’ютерні мережі та обмін даними».
- Кількість: 15 питань.
- Складність: hard.
- Тип: single choice, чотири варіанти, одна правильна відповідь.
- Мова: українська.
- Дата доступу до web-джерел: 2026-06-17.
- Режим доставки: ready for application.

## Покриття taxonomy

| Question ID | Topic code | Тема                                                 | Cognitive level |
| ----------- | ---------- | ---------------------------------------------------- | --------------- |
| `...-001`   | 7.1        | Інкапсуляція даних у багаторівневій мережевій моделі | B               |
| `...-002`   | 7.1        | Комутація пакетів і маршрут між мережами             | B               |
| `...-003`   | 7.1        | Пропускна здатність, затримка і BDP                  | B               |
| `...-004`   | 7.2        | CIDR і кількість адрес у підмережі                   | B               |
| `...-005`   | 7.2        | Агрегація IPv4-префіксів                             | B               |
| `...-006`   | 7.2        | Private IPv4 адреси                                  | B               |
| `...-007`   | 7.2        | IPv4 fragmentation і MTU                             | B               |
| `...-008`   | 7.2        | IPv6 extension headers і Next Header                 | B               |
| `...-009`   | 7.2        | IPv6 адреси і типи доставки                          | B               |
| `...-010`   | 7.2        | TCP надійність і порядок байтів                      | B               |
| `...-011`   | 7.2        | UDP datagram semantics                               | B               |
| `...-012`   | 7.2        | TLS і захист прикладного протоколу                   | B               |
| `...-013`   | 7.2        | HTTP status-code classes                             | B               |
| `...-014`   | 7.2        | QUIC multiplexing over UDP                           | B               |
| `...-015`   | 7.3        | IoT sensing-computing-communication-actuation loop   | B               |

Повний префікс кожного скороченого ідентифікатора:
`generated-yefvv-it-networks-20260617-001`

## Джерела

| Source ID          | Документ або сторінка                                           | Організація | Дата / версія               | URL                                                                                                                              | Підтверджувані твердження                                                                             |
| ------------------ | --------------------------------------------------------------- | ----------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `MON-PROGRAM-2026` | Програма предметного тесту з інформаційних технологій ЄФВВ 2026 | МОН України | наказ від 2025-12-02 № 1578 | https://mon.gov.ua/static-objects/mon/sites/1/vishcha-osvita/vstup-2026/prohramy-jefvv/programa-jefvv-informtexnologiyi-2025.pdf | Охоплення розділу 7: мережі, обмін даними, OSI/TCP/IP, IPv4/IPv6, маски, префікси, порти та IoT.      |
| `RFC-791`          | Internet Protocol                                               | IETF        | RFC 791                     | https://datatracker.ietf.org/doc/html/rfc791                                                                                     | IPv4 datagram, addressing, fragmentation, TTL and routing semantics.                                  |
| `RFC-768`          | User Datagram Protocol                                          | IETF        | RFC 768                     | https://datatracker.ietf.org/doc/html/rfc768                                                                                     | UDP datagram service over IP, source/destination ports, length and checksum.                          |
| `RFC-9293`         | Transmission Control Protocol                                   | IETF        | RFC 9293                    | https://datatracker.ietf.org/doc/html/rfc9293                                                                                    | TCP reliable ordered byte-stream transport, sequence numbers, acknowledgments and flow control.       |
| `RFC-8200`         | Internet Protocol, Version 6 Specification                      | IETF        | RFC 8200                    | https://datatracker.ietf.org/doc/html/rfc8200                                                                                    | IPv6 base header, extension headers, Next Header, Hop Limit and packet processing.                    |
| `RFC-4291`         | IP Version 6 Addressing Architecture                            | IETF        | RFC 4291                    | https://datatracker.ietf.org/doc/html/rfc4291                                                                                    | IPv6 128-bit addresses, unicast/anycast/multicast and interface identifiers.                          |
| `RFC-4632`         | Classless Inter-domain Routing (CIDR)                           | IETF        | RFC 4632                    | https://datatracker.ietf.org/doc/html/rfc4632                                                                                    | CIDR prefixes, classless addressing and route aggregation.                                            |
| `RFC-1918`         | Address Allocation for Private Internets                        | IETF        | RFC 1918                    | https://datatracker.ietf.org/doc/html/rfc1918                                                                                    | Private IPv4 address spaces and their use inside private internets.                                   |
| `RFC-8446`         | The Transport Layer Security Protocol Version 1.3               | IETF        | RFC 8446                    | https://datatracker.ietf.org/doc/html/rfc8446                                                                                    | TLS protection against eavesdropping, tampering and message forgery.                                  |
| `RFC-9110`         | HTTP Semantics                                                  | IETF        | RFC 9110                    | https://datatracker.ietf.org/doc/html/rfc9110                                                                                    | HTTP method semantics, status-code classes and request/response meaning.                              |
| `RFC-9000`         | QUIC: A UDP-Based Multiplexed and Secure Transport              | IETF        | RFC 9000                    | https://datatracker.ietf.org/doc/rfc9000/                                                                                        | QUIC as secure UDP-based transport with multiplexed streams and low-latency connection establishment. |
| `NIST-NOT`         | SP 800-183: Networks of 'Things'                                | NIST        | 2016                        | https://csrc.nist.gov/pubs/sp/800/183/final                                                                                      | IoT/NoT primitives involving sensing, computing, communication and actuation.                         |

## Відповідність питань джерелам

| Question ID | Primary source     | Corroborating source |
| ----------- | ------------------ | -------------------- |
| `...-001`   | `MON-PROGRAM-2026` | `RFC-8200`           |
| `...-002`   | `RFC-791`          | `RFC-4632`           |
| `...-003`   | `RFC-9293`         | `RFC-9000`           |
| `...-004`   | `RFC-4632`         | `RFC-791`            |
| `...-005`   | `RFC-4632`         | `RFC-791`            |
| `...-006`   | `RFC-1918`         | `RFC-4632`           |
| `...-007`   | `RFC-791`          | `RFC-8200`           |
| `...-008`   | `RFC-8200`         | `RFC-4291`           |
| `...-009`   | `RFC-4291`         | `RFC-8200`           |
| `...-010`   | `RFC-9293`         | `RFC-768`            |
| `...-011`   | `RFC-768`          | `RFC-9293`           |
| `...-012`   | `RFC-8446`         | `RFC-9110`           |
| `...-013`   | `RFC-9110`         | `RFC-8446`           |
| `...-014`   | `RFC-9000`         | `RFC-768`            |
| `...-015`   | `NIST-NOT`         | `RFC-8446`           |

## Застереження

- Питання не є офіційними матеріалами МОН або УЦОЯО; вони створені як тренувальний generated batch за програмою ЄФВВ.
- Питання не перевіряють конкретні налаштування вендорського обладнання, команди CLI або версійно-залежні опції реалізацій.
- Адресні й протокольні приклади використано як математичні та концептуальні задачі розділу 7.
- Повні тексти питань навмисно відсутні у звіті, щоб зберегти режим без спойлерів.
