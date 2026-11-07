"""Render the OpenInvestorPortal mark (two overlapping rings, sage lens) to favicon files.

Usage: python scripts/make-icons.py
Writes server/public/favicon.svg, favicon.ico, favicon-32.png, apple-touch-icon.png, icon-512.png, site.webmanifest
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "server" / "public"
INK = (11, 18, 32, 255)
SAGE = (156, 175, 136, 255)

SVG = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none">'
    '<path d="M14 7.07A8 8 0 0 1 14 20.93A8 8 0 0 1 14 7.07Z" fill="#9CAF88"/>'
    '<circle cx="10" cy="14" r="8" stroke="#0b1220" stroke-width="2.2"/>'
    '<circle cx="18" cy="14" r="8" stroke="#0b1220" stroke-width="2.2"/>'
    "</svg>"
)


def render(size: int, pad_ratio: float = 0.0, bg=None) -> Image.Image:
    """Draw at 8x supersampling then downscale for clean anti-aliasing."""
    ss = 8
    S = size * ss
    img = Image.new("RGBA", (S, S), bg or (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Geometry in the 28-unit design space, scaled to S with optional padding.
    pad = S * pad_ratio
    unit = (S - 2 * pad) / 28
    cx_l, cx_r, cy, r = 10 * unit + pad, 18 * unit + pad, 14 * unit + pad, 8 * unit
    stroke = 2.2 * unit

    # Lens: intersection of the two discs.
    left = Image.new("L", (S, S), 0)
    ImageDraw.Draw(left).ellipse([cx_l - r, cy - r, cx_l + r, cy + r], fill=255)
    right = Image.new("L", (S, S), 0)
    ImageDraw.Draw(right).ellipse([cx_r - r, cy - r, cx_r + r, cy + r], fill=255)
    lens = ImageChops.darker(left, right)
    img.paste(Image.new("RGBA", (S, S), SAGE), (0, 0), lens)

    # Rings.
    for cx in (cx_l, cx_r):
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=INK, width=round(stroke))
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "favicon.svg").write_text(SVG, encoding="utf-8")
    render(32).save(OUT / "favicon-32.png")
    render(512, pad_ratio=0.06).save(OUT / "icon-512.png")
    # Apple touch icons are shown on a white rounded tile, so give them a white background and padding.
    render(180, pad_ratio=0.14, bg=(255, 255, 255, 255)).save(OUT / "apple-touch-icon.png")
    ico_sizes = [16, 32, 48]
    frames = [render(s) for s in ico_sizes]
    frames[0].save(OUT / "favicon.ico", format="ICO", sizes=[(s, s) for s in ico_sizes], append_images=frames[1:])
    (OUT / "site.webmanifest").write_text(
        '{"name":"OpenInvestorPortal","short_name":"OIP","icons":[{"src":"/icon-512.png","sizes":"512x512","type":"image/png"}],'
        '"theme_color":"#ffffff","background_color":"#ffffff","display":"browser"}\n',
        encoding="utf-8",
    )
    print("wrote", ", ".join(p.name for p in sorted(OUT.iterdir()) if p.name != "index.html"))


if __name__ == "__main__":
    main()
