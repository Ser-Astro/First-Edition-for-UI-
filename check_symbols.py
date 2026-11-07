"""List CSV symbols that have no matching SVG in symbols/. Usage: python3 scripts/check_symbols.py"""
import csv, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
names = [r["symbol-en"] for r in csv.DictReader(open(root / "data/symbol-info.csv", encoding="utf-8"))]
missing = [n for n in names if not (root / "symbols" / f"{n}.svg").exists()]
print(f"{len(names) - len(missing)}/{len(names)} symbols have images")
for n in missing[:50]: print("  missing:", n)
