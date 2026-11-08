# Open Snap AAC

A free, TD Snap style communication board that runs in any browser. No build step and no dependencies: plain HTML, CSS and JavaScript. All 3,436 symbols, 117 categories and the English and French labels come from `data/symbol-info.csv`.

Live board: https://ser-astro.github.io/First-Edition-for-UI-/

## Features
- Tap symbols to build a message; **Speak**, **Delete** and **Clear** buttons (browser text to speech, English or French)
- Folder navigation: Home, then group, then category (for example Food, then Fruit), plus a Back button
- Search across names and tags in both languages
- Colour-coded borders (Modified Fitzgerald Key): verbs green, nouns orange, descriptors blue, social and feelings pink, questions purple, letters and numbers grey
- **Core word bar** (I, want, go, more, yes, no, what...) always visible, with symbols matched from the CSV
- **On-screen keyboard** (QWERTY, or AZERTY with accents in French) that also accepts a physical keyboard
- **Word prediction** from the CSV vocabulary and core words, ranked by what you use most (learned locally in your browser)
- Adjustable symbol size, label toggle, speak-on-tap; settings are remembered

## Run it on your computer
Open a terminal in the project folder (the one containing `index.html`) and run:

    python3 -m http.server 8000

On Windows, use `python -m http.server 8000`. Then open http://localhost:8000 in your browser. Opening `index.html` directly will not work, because the browser blocks loading the CSV from a local file.

## Symbol images
The CSV contains names only. The pictures are the open **Mulberry Symbols** SVG files from https://mulberrysymbols.org, stored in the `symbols/` folder and named after the `symbol-en` column (for example `apple.svg`). Symbols without a picture still work and show a coloured tile with a letter.

To see how many symbols have pictures, run this from the project folder:

    python3 check_symbols.py

## Licence and credit
The symbols are Mulberry Symbols. Their licence terms are in `symbols/LICENSE.txt`. Keep that file and credit Mulberry Symbols (mulberrysymbols.org) if you share or reuse the pictures.

## Publish your own copy on GitHub Pages
1. Make the repository **public** (free accounts only get Pages on public repositories).
2. Go to Settings, then Pages.
3. Set Source to **Deploy from a branch**, Branch to **main** and the folder to **/ (root)**, then Save.
4. After a minute or two, your site appears at `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

## Files
| File | Purpose |
|---|---|
| `index.html`, `style.css`, `app.js` | The app |
| `data/symbol-info.csv` | The symbol list |
| `symbols/` | Symbol SVG pictures and their licence |
| `check_symbols.py` | Reports symbols missing a picture |

## Ideas for next steps
Editable core words and user pages, next-word prediction, and offline support. The core word list is the `CORE` array in `app.js`.
