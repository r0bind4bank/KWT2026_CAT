// Curated seed content for the demo — hand-checked EN→PL pairs and a small term base.
// All of this lives only in the browser (localStorage) and can be wiped from the UI.

export const SEED_TM = [
  ["The translator must convey the meaning of the source text.", "Tłumacz musi oddać sens tekstu źródłowego."],
  ["The translator should convey the meaning of the source text.", "Tłumacz powinien oddać znaczenie tekstu źródłowego."],
  ["A translation memory stores previously translated segments.", "Pamięć tłumaczeń przechowuje wcześniej przetłumaczone segmenty."],
  ["Computer-assisted translation increases consistency and speed.", "Tłumaczenie wspomagane komputerowo zwiększa spójność i szybkość pracy."],
  ["Please confirm the segment before moving on.", "Proszę zatwierdzić segment przed przejściem dalej."],
  ["The source language is English and the target language is Polish.", "Językiem źródłowym jest angielski, a językiem docelowym polski."],
  ["A glossary ensures that key terms are translated consistently.", "Słownik zapewnia spójne tłumaczenie kluczowych terminów."],
  ["The quality of a translation depends on context.", "Jakość tłumaczenia zależy od kontekstu."],
  ["The deadline for the project is the end of the week.", "Termin oddania projektu przypada na koniec tygodnia."],
  ["Open the file and import the text you want to translate.", "Otwórz plik i zaimportuj tekst, który chcesz przetłumaczyć."],
  ["Each sentence is treated as a separate segment.", "Każde zdanie traktowane jest jako osobny segment."],
  ["The spell checker highlights misspelled words in the target.", "Sprawdzanie pisowni podkreśla błędnie zapisane słowa w tekście docelowym."],
  ["Machine translation is not a substitute for a human translator.", "Tłumaczenie maszynowe nie zastępuje tłumacza."],
  ["Fuzzy matches are suggestions that are not identical.", "Dopasowania rozmyte to podpowiedzi, które nie są identyczne."],
  ["Save your work regularly to avoid losing progress.", "Regularnie zapisuj pracę, aby nie utracić postępów."],
  ["The document contains technical terminology.", "Dokument zawiera terminologię techniczną."],
  ["Thank you for using our translation platform.", "Dziękujemy za korzystanie z naszej platformy tłumaczeniowej."],
  ["This term should always be translated the same way.", "Ten termin powinien być zawsze tłumaczony w ten sam sposób."],
  ["The target text must read naturally in Polish.", "Tekst docelowy musi brzmieć naturalnie po polsku."],
  ["Review the translation before delivering it to the client.", "Sprawdź tłumaczenie przed przekazaniem go klientowi."]
];

export const SEED_GLOSSARY = [
  ["source text", "tekst źródłowy", "The original text being translated."],
  ["target text", "tekst docelowy", "The resulting translated text."],
  ["translation memory", "pamięć tłumaczeń", "Database of previously translated segments."],
  ["segment", "segment", "A unit of text, usually a sentence."],
  ["glossary", "słownik", "A list of terms with approved translations."],
  ["term base", "baza terminologiczna", "A structured collection of approved terms."],
  ["fuzzy match", "dopasowanie rozmyte", "A non-exact TM suggestion."],
  ["source language", "język źródłowy", "The language of the original text."],
  ["target language", "język docelowy", "The language of the translation."],
  ["spell checker", "sprawdzanie pisowni", "Tool that detects misspelled words."],
  ["deadline", "termin", "The date by which work must be delivered."],
  ["proofreading", "korekta", "Final review of a translated text."],
  ["consistency", "spójność", "Uniform use of terms and style."],
  ["machine translation", "tłumaczenie maszynowe", "Automatic translation by software."],
  ["translator", "tłumacz", "The person performing the translation."]
];

export const SAMPLE_SOURCE = `Welcome to your own computer-assisted translation platform.
This tool helps you translate text faster and more consistently.
Each sentence becomes a separate segment that you translate on the right.
The translation memory suggests matches from texts you translated before.
The glossary highlights key terms and proposes approved translations.
The spell checker underlines misspelled words in the Polish target text.
Confirm a segment to save it into the translation memory.
Have fun translating!`;
