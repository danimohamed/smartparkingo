from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


def md_line_to_paragraph(line: str, styles):
    text = line.rstrip("\n")
    if not text.strip():
        return Spacer(1, 0.2 * cm)

    if text.startswith("# "):
        return Paragraph(text[2:].strip(), styles["h1"])
    if text.startswith("## "):
        return Paragraph(text[3:].strip(), styles["h2"])
    if text.startswith("### "):
        return Paragraph(text[4:].strip(), styles["h3"])
    if text.startswith("- "):
        return Paragraph(f"- {text[2:].strip()}", styles["bullet"])
    if text.startswith("1. ") or text.startswith("2. ") or text.startswith("3. ") or text.startswith("4. ") or text.startswith("5. ") or text.startswith("6. ") or text.startswith("7. ") or text.startswith("8. ") or text.startswith("9. "):
        return Paragraph(text, styles["bullet"])

    return Paragraph(text, styles["body"])


def build_pdf(md_path: Path, pdf_path: Path) -> None:
    sample = getSampleStyleSheet()
    styles = {
        "h1": ParagraphStyle(
            "h1",
            parent=sample["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            spaceAfter=10,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=sample["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            spaceBefore=8,
            spaceAfter=6,
        ),
        "h3": ParagraphStyle(
            "h3",
            parent=sample["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            spaceBefore=6,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body",
            parent=sample["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=14,
            spaceAfter=2,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=sample["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=14,
            leftIndent=12,
            spaceAfter=2,
        ),
    }

    story = []
    in_code_block = False

    for line in md_path.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("```"):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            story.append(Paragraph(line.replace(" ", "&nbsp;"), styles["body"]))
            continue

        story.append(md_line_to_paragraph(line, styles))

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="Architecture du systeme",
        author="Smart Parking",
    )
    doc.build(story)


if __name__ == "__main__":
    base = Path(__file__).resolve().parent
    md_file = base / "ARCHITECTURE.fr.md"
    pdf_file = base / "Architecture_du_systeme.pdf"
    build_pdf(md_file, pdf_file)

