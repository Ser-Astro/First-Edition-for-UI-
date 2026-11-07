# Open Snap AAC

A free, TD Snap style communication board that runs in any browser. No build step and no dependencies: plain HTML, CSS and JavaScript. All 3,436 symbols, 117 categories and the English and French labels come from `data/symbol-info.csv`.

## Features
- Tap symbols to build a message; **Speak**, **Delete** and **Clear** buttons (browser text to speech, English or French)
- Folder navigation: Home, then group, then category (for example Food, then Fruit), plus a Back button
- Search across names and tags in both languages
- Colour-coded borders (Modified Fitzgerald Key): verbs green, nouns orange, descriptors blue, social and feelings pink, questions purple, letters and numbers grey
- **Core word bar** (I, want, go, more, yes, no, what...) always visible, with Fitzgerald colours and symbols matched from the CSV
- **On-screen keyboard** (QWERTY, or AZERTY with accents in French) that also accepts your physical keyboard; typed words join the message and show a symbol when one matches
- **Word prediction** from the CSV vocabulary and core words, ranked by what you use most (learned locally in your browser)
- Adjustable symbol size, label toggle, speak-on-tap; settings are remembered

## Run locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
Opening `index.html` directly will not work because the browser blocks loading the CSV from `file://`.

## Add the symbol images
The CSV has names only, not pictures. The names match the open **Mulberry Symbols** set (https://mulberrysymbols.org, CC BY-SA 2.0 UK). Download the SVGs and copy them into `symbols/` so that `symbol-en` matches the file name, e.g. `apple.svg`. Then check coverage:
```bash
python3 scripts/check_symbols.py
```
Symbols without an image still work and show a coloured tile with a letter. If you use Mulberry Symbols, keep their attribution and licence.

## Publish on GitHub
1. Create a repository and push this folder to the `main` branch.
2. Go to Settings, then Pages, and set the source to **GitHub Actions**. The included workflow deploys the site on each push.

## Files
| File | Purpose |
|---|---|
| `index.html`, `style.css`, `app.js` | The app |
| `data/symbol-info.csv` | Your symbol list |
| `symbols/` | Symbol SVGs (you add these) |
| `scripts/check_symbols.py` | Reports symbols missing an image |

## Ideas for next steps
Editable core words and user pages, next-word prediction, and offline support with a service worker. The core word list is the `CORE` array in `app.js`.
