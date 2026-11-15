"""Crop the Chapter 12 shell-and-tube charts used by the site.

Source: Coulson & Richardson, Chemical Engineering, Volume 6, 4th edition.
PDF page 651 is the first page of Chapter 12 (book page 634).
"""

from pathlib import Path

import pymupdf

PDF = Path(
    r"C:\Users\aishn\Downloads\chemical_engineering_design__fourth_edition__chemical_engineering_volume_6__coulson__amp__richardson__039_s_chemical_engineering_.pdf"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "book-assets"

# 1-based PDF page, clip in PDF points, output name.
JOBS = [
    (656, pymupdf.Rect(40, 70, 660, 500), "fig-12-1-overall-coefficient.png"),
    (674, pymupdf.Rect(50, 100, 500, 400), "fig-12-19-ft-one-shell.png"),
    (675, pymupdf.Rect(40, 40, 500, 650), "fig-12-20-ft-two-shell.png"),
    (682, pymupdf.Rect(30, 40, 670, 490), "fig-12-23-tube-jh.png"),
    (685, pymupdf.Rect(30, 40, 670, 490), "fig-12-24-tube-jf.png"),
    (690, pymupdf.Rect(30, 40, 670, 490), "fig-12-29-shell-jh.png"),
    (691, pymupdf.Rect(30, 40, 670, 490), "fig-12-30-shell-jf.png"),
    (653, pymupdf.Rect(40, 40, 500, 680), "table-12-1-typical-u.png"),
    (657, pymupdf.Rect(40, 40, 500, 650), "table-12-2-fouling.png"),
    (679, pymupdf.Rect(40, 40, 500, 430), "table-12-6-conductivity.png"),
    (701, pymupdf.Rect(30, 40, 670, 500), "figure-a-design-algorithm.png"),
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    document = pymupdf.open(PDF)
    for page_number, clip, name in JOBS:
        page = document[page_number - 1]
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(2.4, 2.4), clip=clip, alpha=False)
        pixmap.save(OUT / name)
        print(f"{name} {pixmap.width}x{pixmap.height}")


if __name__ == "__main__":
    main()
