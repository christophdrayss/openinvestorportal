"""Render the Open Graph / social share image, 1200x630.

Usage: python scripts/make-og.py
Writes server/public/og.png. Needs Pillow and the Segoe UI fonts (Windows); falls back to DejaVu Sans.
The mark copies the geometry of LOGO_SVG in server/site/layout.mjs (28-unit design space).
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "server" / "public" / "og.png"

W, H = 1200, 630
SS = 2  # supersampling factor, downscaled at the end for clean edges

INK = (11, 18, 32)
INK2 = (51, 65, 85)
MUTED = (100, 116, 139)
LINE = (229, 231, 235)
SAGE = (94, 116, 97)  # accent, #5E7461
SAGE_SOFT = (156, 175, 136)  # lens fill, #9CAF88
WHITE = (255, 255, 255)

FONT_DIRS = [Path("C:/Windows/Fonts"), Path("/usr/share/fonts/truetype/dejavu"), Path("/Library/Fonts")]
FONTS = {
    "regular": ["segoeui.ttf", "DejaVuSans.ttf"],
    "semibold": ["seguisb.ttf", "DejaVuSans-Bold.ttf"],
    "bold": ["segoeuib.ttf", "DejaVuSans-Bold.ttf"],
}


def font(weight: str, px: int) -> ImageFont.FreeTypeFont:
    for name in FONTS[weight]:
        for d in FONT_DIRS:
            if (d / name).exists():
                return ImageFont.truetype(str(d / name), px * SS)
    return ImageFont.load_default()


def s(v: float) -> int:
    return round(v * SS)


def draw_mark(img: Image.Image, x: float, y: float, size: float, ink=INK, lens=SAGE_SOFT, stroke=2.2) -> None:
    """Two ink rings with a sage lens where they overlap. (x, y) is the top-left of the 28-unit box."""
    k = size / 28 * SS
    ox, oy = x * SS, y * SS

    def disc(cx, cy, r):
        m = Image.new("L", img.size, 0)
        ImageDraw.Draw(m).ellipse([ox + (cx - r) * k, oy + (cy - r) * k, ox + (cx + r) * k, oy + (cy + r) * k], fill=255)
        return m

    lens_mask = ImageChops.multiply(disc(10, 14, 8), disc(18, 14, 8))
    img.paste(lens, (0, 0), lens_mask)
    d = ImageDraw.Draw(img)
    ro = 8 + stroke / 2
    for cx in (10, 18):
        d.ellipse([ox + (cx - ro) * k, oy + (14 - ro) * k, ox + (cx + ro) * k, oy + (14 + ro) * k], outline=ink, width=max(1, round(stroke * k)))


def text(d: ImageDraw.ImageDraw, xy, txt: str, f, fill, anchor="ls", spacing=0.0) -> float:
    """Draw text with optional letter spacing (in px at 1x). Returns the end x at 1x."""
    x, y = s(xy[0]), s(xy[1])
    if not spacing:
        d.text((x, y), txt, font=f, fill=fill, anchor=anchor)
        return xy[0] + d.textlength(txt, font=f) / SS
    for ch in txt:
        d.text((x, y), ch, font=f, fill=fill, anchor=anchor)
        x += d.textlength(ch, font=f) + spacing * SS
    return x / SS


def main() -> None:
    img = Image.new("RGB", (W * SS, H * SS), WHITE)
    d = ImageDraw.Draw(img)

    # Very faint oversized mark, cropped at the right edge, as a quiet background element.
    ghost = Image.new("RGB", img.size, WHITE)
    draw_mark(ghost, 880, 180, 440, ink=(240, 242, 244), lens=(246, 248, 244), stroke=0.9)
    img.paste(ghost, (0, 0))
    d = ImageDraw.Draw(img)

    left = 96

    # Brand row: mark and wordmark.
    draw_mark(img, left, 84, 52)
    d = ImageDraw.Draw(img)
    text(d, (left + 66, 122), "OpenInvestorPortal", font("semibold", 32), INK, spacing=-0.3)

    # Sage accent rule.
    d.rectangle([s(left), s(212), s(left + 56), s(216)], fill=SAGE)

    # Headline, matching the site hero: second line in the sage accent.
    hf = font("bold", 74)
    text(d, (left, 312), "The Unified Interface for", hf, INK, spacing=-1.6)
    text(d, (left, 398), "Every Investor Portal.", hf, SAGE, spacing=-1.6)

    # Supporting line.
    text(d, (left, 462), "Open registry and peer-to-peer protocol for investor portal access.", font("regular", 26), INK2)

    # Footer band.
    d.line([s(left), s(536), s(W - left), s(536)], fill=LINE, width=s(1.5))
    small = font("regular", 21)
    text(d, (left, 576), "openinvestorportal.org", small, MUTED)
    label = "Registry  ·  Protocol  ·  Open data, CC0"
    lw = d.textlength(label, font=small) / SS
    text(d, (W - left - lw, 576), label, small, MUTED)

    out = img.resize((W, H), Image.LANCZOS)
    out.save(OUT, optimize=True)
    print(f"wrote {OUT.relative_to(ROOT)} {out.size[0]}x{out.size[1]}")


if __name__ == "__main__":
    main()
