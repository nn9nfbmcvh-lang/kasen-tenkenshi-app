"""Extract the official MLIT example photographs used by the quiz.

Source PDF:
https://www.mlit.go.jp/river/shishin_guideline/kasen/pdf/08_teiboukadou_tenkenkekka_sankou.pdf

The PDF page index is zero based here.  The printed page number in the
document is two less than the one-based PDF page number.
"""

from __future__ import annotations

import io
from pathlib import Path

from PIL import Image, ImageOps
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PDF = ROOT / "sources" / "mlit-river-inspection-photo-examples.pdf"
OUTPUT_DIR = ROOT / "assets" / "questions"

# Two example pages are omitted because the PDF contains no extractable
# photograph on those pages.  The last quiz image uses the second, more
# severe crack example from the first page instead of repeating the very
# small sediment photograph on the final page.
PHOTO_SOURCES: list[tuple[int, int | None]] = [
    (index, None) for index in range(68, 108) if index != 100
]
PHOTO_SOURCES.append((68, 1))

# A few pages reuse a previous photograph as their largest embedded image.
# Select another photograph from those pages so the quiz remains visually
# useful and does not show accidental duplicates.
PHOTO_SOURCES[25] = (93, 0)
PHOTO_SOURCES[27] = (95, 2)
PHOTO_SOURCES[32] = (101, 1)
PHOTO_SOURCES[38] = (107, 0)
PHOTO_SOURCES[8] = (76, 0)


def choose_photo(page, preferred_index: int | None = None) -> Image.Image:
    candidates: list[Image.Image] = []
    for embedded in page.images:
        try:
            image = Image.open(io.BytesIO(embedded.data))
            image.load()
        except Exception:
            continue
        if image.width < 100 or image.height < 100:
            continue
        candidates.append(ImageOps.exif_transpose(image).convert("RGB"))

    if not candidates:
        raise RuntimeError("No usable photograph was found on the source page")

    if preferred_index is not None:
        if preferred_index >= len(candidates):
            raise RuntimeError(
                f"Requested embedded photograph {preferred_index}, "
                f"but only {len(candidates)} are available"
            )
        return candidates[preferred_index]

    return max(candidates, key=lambda image: image.width * image.height)


def main() -> None:
    reader = PdfReader(SOURCE_PDF)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if len(PHOTO_SOURCES) != 40:
        raise RuntimeError(f"Expected 40 source photographs, got {len(PHOTO_SOURCES)}")

    for number, (page_index, image_index) in enumerate(PHOTO_SOURCES, start=1):
        photo = choose_photo(reader.pages[page_index], image_index)
        photo.thumbnail((1280, 960), Image.Resampling.LANCZOS)
        destination = OUTPUT_DIR / f"Q{number:03d}.jpg"
        photo.save(destination, "JPEG", quality=86, optimize=True, progressive=True)
        printed_page = page_index - 1
        print(
            f"{destination.relative_to(ROOT)} <- "
            f"PDF page {page_index + 1} / printed page {printed_page} "
            f"({photo.width}x{photo.height})"
        )

    thumbnails: list[Image.Image] = []
    for number in range(1, 41):
        photo = Image.open(OUTPUT_DIR / f"Q{number:03d}.jpg").convert("RGB")
        photo.thumbnail((220, 150), Image.Resampling.LANCZOS)
        tile = Image.new("RGB", (240, 185), "white")
        tile.paste(photo, ((240 - photo.width) // 2, 24 + (150 - photo.height) // 2))
        thumbnails.append(tile)

    sheet = Image.new("RGB", (240 * 5, 185 * 8), "#d9dfdc")
    from PIL import ImageDraw

    draw = ImageDraw.Draw(sheet)
    for index, tile in enumerate(thumbnails):
        x = (index % 5) * 240
        y = (index // 5) * 185
        sheet.paste(tile, (x, y))
        draw.text((x + 8, y + 6), f"Q{index + 1:03d}", fill="#102f2b")
    sheet.save(ROOT / "sources" / "photo-contact-sheet.jpg", "JPEG", quality=86)


if __name__ == "__main__":
    main()
