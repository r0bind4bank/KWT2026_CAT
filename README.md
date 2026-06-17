<div align="center">

# ◭ LINGUA — KWT2026 CAT

**Własna platforma do komputerowego wspomagania tłumaczenia (CAT)**

Minimalistyczne, futurystyczne narzędzie webowe · EN → PL · 100% w przeglądarce

</div>

---

## ✨ Co to jest

LINGUA to lekka platforma **CAT** (*Computer-Assisted Translation*) zbudowana w całości
po stronie przeglądarki — bez backendu, bez logowania, bez instalacji. Wystarczy otworzyć
stronę. Wszystkie dane (segmenty, pamięć tłumaczeń, słownik) zapisywane są lokalnie
w `localStorage`, więc praca nie ginie po odświeżeniu.

Projekt powstał na zajęcia **Komputerowe Wspomaganie Tłumaczenia (KWT 2026)**.

## 🎯 Wymagane funkcjonalności

| Wymaganie | Realizacja |
|---|---|
| **Webowy frontend** | Jednostronicowa aplikacja (HTML + CSS + vanilla JS, moduły ES). Brak frameworków i kroku budowania. |
| **Pamięć tłumaczeń (TM)** | Każde zatwierdzone zdanie trafia do pamięci. Dla nowego segmentu pokazywane są dopasowania **dokładne i rozmyte** (*fuzzy*) z procentem podobieństwa (odległość Levenshteina). Klik wstawia tłumaczenie. Import/eksport do JSON. |
| **Słownik kontekstowy** | Baza terminologiczna EN→PL. Terminy występujące w bieżącym segmencie są **podkreślane w tekście źródłowym** i proponowane w panelu — klik wstawia zatwierdzone tłumaczenie w miejscu kursora. Terminy można dodawać i usuwać. |
| **Sprawdzanie pisowni (strona docelowa)** | Prawdziwy słownik **Hunspell języka polskiego** (`dictionary-pl`) uruchamiany przez `nspell`. Błędne słowa są **podkreślane falką** bezpośrednio w polu tłumaczenia, a panel proponuje poprawki. |

## 🚀 Jak uruchomić

### Online
Najprościej — wejdź na opublikowaną wersję (GitHub Pages):
**https://r0bind4bank.github.io/KWT2026_CAT/**

### Lokalnie
Ponieważ aplikacja korzysta z modułów ES, otwórz ją przez lokalny serwer:

```bash
git clone https://github.com/r0bind4bank/KWT2026_CAT.git
cd KWT2026_CAT
python3 -m http.server 8000
# otwórz http://localhost:8000
```

> Działa w pełni **offline** — słownik polski i silnik sprawdzania pisowni są
> dołączone do repozytorium (`assets/dict`, `assets/js/vendor`). Nie ma żadnych
> zależności sieciowych. Status pokazuje plakietka „Spell-check” w prawym górnym rogu.

## 🧭 Jak używać

1. Kliknij **Load sample** albo **Import text**, żeby wczytać tekst `.txt`.
2. Tekst zostaje podzielony na **segmenty** (mniej więcej jedno zdanie = jeden wiersz).
3. Tłumacz w prawej kolumnie. Po prawej stronie zobaczysz:
   - **Memory** — dopasowania z pamięci tłumaczeń,
   - **Glossary** — terminy wykryte w zdaniu,
   - **Spelling** — błędy pisowni z podpowiedziami.
4. Naciśnij **Ctrl/Cmd + Enter**, aby **zatwierdzić** segment — zapisuje się on do pamięci
   tłumaczeń, a kursor przeskakuje do kolejnego zdania.
5. Postęp widać w pierścieniu na górnym pasku. Gotowe tłumaczenie wyeksportujesz przez
   **Data → Export translation**.

## ⌨️ Skróty

| Skrót | Działanie |
|---|---|
| `Ctrl` / `Cmd` + `Enter` | Zatwierdź segment i przejdź dalej |

## 🛠️ Architektura

```
KWT2026_CAT/
├── index.html              # struktura interfejsu
├── assets/
│   ├── css/style.css       # motyw (glassmorphism + aurora)
│   ├── dict/               # słownik Hunspell PL (offline): pl.aff, pl.dic
│   └── js/
│       ├── app.js          # kontroler aplikacji, wiązanie zdarzeń
│       ├── segmenter.js    # podział tekstu na segmenty
│       ├── tm.js           # pamięć tłumaczeń + dopasowania rozmyte
│       ├── glossary.js     # słownik kontekstowy / baza terminologiczna
│       ├── spellcheck.js   # sprawdzanie pisowni PL (nspell + Hunspell)
│       ├── store.js        # warstwa localStorage
│       ├── data.js         # dane startowe (TM, słownik, przykład)
│       └── vendor/         # dołączony silnik nspell (offline)
└── README.md
```

**Stos:** czysty HTML/CSS/JS (moduły ES) · [`nspell`](https://github.com/wooorm/nspell) ·
[`dictionary-pl`](https://github.com/wooorm/dictionaries) — oba **dołączone lokalnie** do repo.
Brak frameworków, brak bundlera, brak backendu, brak zależności sieciowych.

## 🔒 Prywatność

Cała praca odbywa się lokalnie w przeglądarce. Żaden tekst nie jest wysyłany na serwer,
aplikacja nie wykonuje żadnych zapytań sieciowych — działa w 100% offline.

---

<div align="center">
<sub>Zbudowane na KWT 2026 · UAM</sub>
</div>
