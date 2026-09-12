from pathlib import Path

from PIL import Image


ART_DIR = Path(__file__).resolve().parents[1] / "public" / "art"
PREFIXES = ("ursa-minor-", "ursa-major-", "cassiopeia-", "cepheus-", "draco-")


for path in sorted(ART_DIR.glob("*.png")):
    if not path.name.startswith(PREFIXES):
        continue

    with Image.open(path) as source:
        image = source.convert("RGB")
        optimized = image.quantize(
            colors=256,
            method=Image.Quantize.MEDIANCUT,
            dither=Image.Dither.NONE,
        )

        temporary = path.with_suffix(".optimized.png")
        optimized.save(temporary, format="PNG", optimize=True, compress_level=9)
        temporary.replace(path)

