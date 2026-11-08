"""Lists symbols in data/symbol-info.csv that have no matching SVG in symbols/.
Run it from the project folder:  python3 check_symbols.py"""
import csv, pathlib

root = pathlib.Path(__file__).resolve().parent
with open(root / "data" / "symbol-info.csv", encoding="utf-8") as f:
    names = [r["symbol-en"] for r in csv.DictReader(f)]
missing = [n for n in names if not (root / "symbols" / f"{n}.svg").exists()]
print(f"{len(names) - len(missing)}/{len(names)} symbols have images")
for n in missing[:50]:
    print("  missing:", n)
