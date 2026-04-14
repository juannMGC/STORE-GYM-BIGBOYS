"""One-off: generate favicons from public/brand/logo-bigboys.jpg (requires Pillow)."""
from __future__ import annotations

import base64
import io
import sys
from pathlib import Path

from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / "public"


def main() -> None:
    src = PUBLIC / "brand" / "logo-bigboys.jpg"
    if not src.exists():
        print("Missing", src, file=sys.stderr)
        sys.exit(1)

    im = Image.open(src).convert("RGBA")
    w, h = im.size
    m = min(w, h)
    left = (w - m) // 2
    top = (h - m) // 2
    sq = im.crop((left, top, left + m, top + m))

    for size, name in [
        (16, "favicon-16x16.png"),
        (32, "favicon-32x32.png"),
        (180, "apple-touch-icon.png"),
    ]:
        sq.resize((size, size), Image.Resampling.LANCZOS).save(PUBLIC / name, "PNG")

    im16 = sq.resize((16, 16), Image.Resampling.LANCZOS)
    im32 = sq.resize((32, 32), Image.Resampling.LANCZOS)
    im16.save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32)],
        append_images=[im32],
    )

    buf = io.BytesIO()
    im32_for_svg = sq.resize((32, 32), Image.Resampling.LANCZOS)
    im32_for_svg.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
        f'<image href="data:image/png;base64,{b64}" width="32" height="32"/>'
        "</svg>"
    )
    (PUBLIC / "favicon.svg").write_text(svg, encoding="utf-8")
    print("Wrote favicons to", PUBLIC)


if __name__ == "__main__":
    main()
