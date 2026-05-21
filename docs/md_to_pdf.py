"""
EAC System — Architecture Document PDF Generator
Produces a professional multi-section PDF:
  • Cover page (dark branded)
  • Full-page landscape architecture diagram
  • Full written document (portrait, all 7 required areas)

Usage:  python3 docs/md_to_pdf.py
Output: docs/EAC_Architecture_Document.pdf
"""
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import LETTER, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    Image,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

# ── Paths ─────────────────────────────────────────────────────────────────────
DIR    = Path(__file__).parent
INPUT  = DIR / "architecture_document.md"
DIAG   = DIR / "EAC_Azure_Architecture.png"
OUTPUT = DIR / "EAC_Architecture_Document.pdf"

# ── Palette ───────────────────────────────────────────────────────────────────
NAVY    = colors.HexColor("#0d1b2e")
AZURE   = colors.HexColor("#0078d4")
AZURE_L = colors.HexColor("#388bfd")
DARK    = colors.HexColor("#1a2a3a")
BODY_C  = colors.HexColor("#1a1a1a")
GRAY    = colors.HexColor("#6b7280")
LGRAY   = colors.HexColor("#f3f4f6")
ACCENT  = colors.HexColor("#0f3460")
WHITE   = colors.white

F_REG  = "Helvetica"
F_BOLD = "Helvetica-Bold"
F_MONO = "Courier"

# ── Page sizes ────────────────────────────────────────────────────────────────
PORT = LETTER                               # 8.5 × 11  in
LAND = landscape(LETTER)                    # 11  × 8.5 in


# ══════════════════════════════════════════════════════════════════════════════
# Page callbacks
# ══════════════════════════════════════════════════════════════════════════════

def _cover_page(canvas, doc):
    """Clean white cover page with Azure blue header band."""
    w, h = PORT
    canvas.saveState()

    # White background
    canvas.setFillColor(colors.white)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)

    # Top header band — Azure blue, full width
    canvas.setFillColor(AZURE)
    canvas.rect(0, h - 1.9*inch, w, 1.9*inch, fill=1, stroke=0)

    # Title text inside the band
    canvas.setFont(F_BOLD, 22)
    canvas.setFillColor(colors.white)
    canvas.drawString(0.75*inch, h - 0.95*inch, "Employee Activity Classification")
    canvas.drawString(0.75*inch, h - 1.30*inch, "System")
    canvas.setFont(F_REG, 12)
    canvas.setFillColor(colors.HexColor("#bfdbfe"))
    canvas.drawString(0.75*inch, h - 1.62*inch,
                      "Azure Cloud Architecture & Design Document")

    # Thin rule under band
    canvas.setStrokeColor(AZURE)
    canvas.setLineWidth(0.5)
    canvas.line(0.75*inch, h - 2.1*inch, w - 0.75*inch, h - 2.1*inch)

    # Footer band
    canvas.setFillColor(AZURE)
    canvas.rect(0, 0, w, 0.4*inch, fill=1, stroke=0)
    canvas.setFont(F_REG, 8)
    canvas.setFillColor(colors.white)
    canvas.drawString(0.75*inch, 0.14*inch,
                      "UC-1  Network Annual Capital Labor Survey,  Confidential")
    canvas.drawRightString(w - 0.75*inch, 0.14*inch, "May 21, 2026")

    canvas.restoreState()


def _diag_page(canvas, doc):
    """Landscape diagram page — light footer only."""
    w, h = LAND
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#0d1117"))
    canvas.rect(0, 0, w, h, fill=1, stroke=0)
    canvas.setFont(F_REG, 7)
    canvas.setFillColor(colors.HexColor("#8b949e"))
    canvas.drawString(0.4*inch, 0.22*inch,
                      "Employee Activity Classification System, Azure Cloud Architecture")
    canvas.drawRightString(w - 0.4*inch, 0.22*inch, f"Page {doc.page}")
    canvas.restoreState()


def _text_page(canvas, doc):
    """Portrait text pages — header rule + footer."""
    w, h = PORT
    canvas.saveState()
    # Thin top rule
    canvas.setStrokeColor(AZURE)
    canvas.setLineWidth(1.2)
    canvas.line(0.75*inch, h - 0.55*inch, w - 0.75*inch, h - 0.55*inch)
    # Header text
    canvas.setFont(F_REG, 7.5)
    canvas.setFillColor(GRAY)
    canvas.drawString(0.75*inch, h - 0.46*inch,
                      "Employee Activity Classification System, Azure Cloud Architecture")
    canvas.drawRightString(w - 0.75*inch, h - 0.46*inch, "Architecture & Design Document")
    # Footer
    canvas.setLineWidth(0.4)
    canvas.setStrokeColor(colors.HexColor("#dddddd"))
    canvas.line(0.75*inch, 0.55*inch, w - 0.75*inch, 0.55*inch)
    canvas.setFont(F_REG, 7.5)
    canvas.setFillColor(GRAY)
    canvas.drawString(0.75*inch, 0.37*inch, "UC-1 · Network Annual Capital Labor Survey")
    canvas.drawRightString(w - 0.75*inch, 0.37*inch, f"Page {doc.page}")
    canvas.restoreState()


# ══════════════════════════════════════════════════════════════════════════════
# Styles
# ══════════════════════════════════════════════════════════════════════════════

def _styles():
    ss = getSampleStyleSheet()
    add = ss.add

    add(ParagraphStyle("CoverTitle",
        fontName=F_BOLD, fontSize=28, leading=34,
        textColor=WHITE, alignment=TA_LEFT, spaceAfter=10))
    add(ParagraphStyle("CoverSub",
        fontName=F_REG, fontSize=13, leading=18,
        textColor=colors.HexColor("#93c5fd"), alignment=TA_LEFT, spaceAfter=6))
    add(ParagraphStyle("CoverMeta",
        fontName=F_REG, fontSize=10, leading=14,
        textColor=colors.HexColor("#9ca3af"), alignment=TA_LEFT, spaceAfter=4))
    add(ParagraphStyle("CoverLabel",
        fontName=F_BOLD, fontSize=8.5, leading=12,
        textColor=AZURE_L, alignment=TA_LEFT, spaceAfter=2))

    add(ParagraphStyle("DocH1",
        fontName=F_BOLD, fontSize=17, leading=22,
        textColor=AZURE, spaceBefore=22, spaceAfter=8,
        borderPad=0))
    add(ParagraphStyle("DocH2",
        fontName=F_BOLD, fontSize=13, leading=17,
        textColor=DARK, spaceBefore=14, spaceAfter=5))
    add(ParagraphStyle("DocH3",
        fontName=F_BOLD, fontSize=11, leading=15,
        textColor=DARK, spaceBefore=10, spaceAfter=3))
    add(ParagraphStyle("DocH4",
        fontName=F_BOLD, fontSize=10, leading=14,
        textColor=ACCENT, spaceBefore=8, spaceAfter=2))
    add(ParagraphStyle("DocBody",
        fontName=F_REG, fontSize=10, leading=15.5,
        textColor=BODY_C, alignment=TA_JUSTIFY, spaceAfter=6))
    add(ParagraphStyle("DocBullet",
        fontName=F_REG, fontSize=10, leading=14,
        textColor=BODY_C, leftIndent=20, spaceAfter=3))
    add(ParagraphStyle("DocCode",
        fontName=F_MONO, fontSize=8.2, leading=12,
        textColor=colors.HexColor("#1f2937"),
        backColor=LGRAY, leftIndent=14, rightIndent=14,
        spaceAfter=6, spaceBefore=4))
    add(ParagraphStyle("DocMeta",
        fontName=F_REG, fontSize=10, leading=14,
        textColor=GRAY, alignment=TA_CENTER, spaceAfter=3))
    add(ParagraphStyle("FigCaption",
        fontName=F_REG, fontSize=8, leading=11,
        textColor=GRAY, alignment=TA_CENTER, spaceAfter=10, spaceBefore=4))
    return ss


# ══════════════════════════════════════════════════════════════════════════════
# Inline markdown → reportlab markup
# ══════════════════════════════════════════════════════════════════════════════

def _esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def _inline(t):
    t = _esc(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"\*(.+?)\*",     r"<i>\1</i>", t)
    t = re.sub(r"`(.+?)`",       r'<font name="Courier">\1</font>', t)
    return t


# ══════════════════════════════════════════════════════════════════════════════
# Cover page story
# ══════════════════════════════════════════════════════════════════════════════

def _cover_story(styles):
    s = []
    # Space below the header band (1.9" band + 0.2" gap)
    s.append(Spacer(1, 1.85*inch))

    # Meta block
    meta_style = ParagraphStyle("CMeta", fontName=F_REG, fontSize=10,
                                textColor=BODY_C, leading=16, spaceAfter=3)
    label_style = ParagraphStyle("CLabel", fontName=F_BOLD, fontSize=8,
                                 textColor=AZURE, leading=12, spaceAfter=1,
                                 spaceBefore=5)

    meta_fields = [
        ("SUBMISSION",  "UC-1  Network Annual Capital Labor Survey"),
        ("AUTHOR",      "Ajith Jalagam"),
        ("DATE",        "May 21, 2026"),
        ("VERSION",     "2.0, Azure Production Architecture"),
        ("STACK",       "FastAPI  ·  LangGraph  ·  Azure Container Apps  ·  Azure OpenAI  ·  gpt-5.5"),
    ]
    for lbl, val in meta_fields:
        s.append(Paragraph(lbl, label_style))
        s.append(Paragraph(val, meta_style))

    s.append(Spacer(1, 0.35*inch))
    s.append(HRFlowable(width="100%", thickness=0.6,
                        color=colors.HexColor("#e5e7eb"), spaceAfter=14))

    # Table of contents header
    s.append(Paragraph(
        "CONTENTS",
        ParagraphStyle("TOCHead", fontName=F_BOLD, fontSize=8,
                       textColor=AZURE, leading=12, spaceAfter=8)))

    toc_items = [
        ("1",  "Problem Statement Analysis"),
        ("2",  "Azure Architecture Strategy: service selection, cloud portability"),
        ("3",  "System Architecture Overview: 8 layers, data flow"),
        ("4",  "Container Architecture: Azure Container Apps, KEDA auto-scale"),
        ("5",  "Pluggable Connector Framework: contract, active connectors, future stubs"),
        ("6",  "Data Enrichment Pipeline: 7 stages, 100k-record throughput"),
        ("7",  "LangGraph Agentic Pipeline: 6-node, multi-model routing, pre-fetch"),
        ("8",  "CapEx / OpEx Classification Logic: GAAP ASC 350-40, IAS 16, 14 signals"),
        ("9",  "Audit Trail Design: Cosmos DB append-only, override chain, WORM"),
        ("10", "Form Parsing Pipeline: 3-layer extraction, Document Intelligence scale path"),
        ("11", "Security Architecture: VNet, Key Vault, Entra ID, RBAC"),
        ("12", "Observability: Application Insights, Log Analytics, KQL alerts"),
        ("13", "Stubs Inventory: 13 components, Azure production replacements"),
        ("14", "Key Design Decisions: 7 explicit trade-offs"),
        ("15", "Continual Learning Roadmap: RAG, weight learning, fine-tuning"),
    ]

    toc_num  = ParagraphStyle("TOCNum",  fontName=F_BOLD, fontSize=9,
                               textColor=AZURE, leading=14)
    toc_text = ParagraphStyle("TOCText", fontName=F_REG,  fontSize=9,
                               textColor=colors.HexColor("#374151"), leading=14)

    toc_rows = [[
        Paragraph(n, toc_num),
        Paragraph(t, toc_text),
    ] for n, t in toc_items]

    tbl = Table(toc_rows, colWidths=[0.3*inch, 5.9*inch], spaceBefore=0)
    tbl.setStyle(TableStyle([
        ("VALIGN",       (0,0),(-1,-1), "TOP"),
        ("TOPPADDING",   (0,0),(-1,-1), 1),
        ("BOTTOMPADDING",(0,0),(-1,-1), 1),
        ("LEFTPADDING",  (0,0),(-1,-1), 0),
        ("RIGHTPADDING", (0,0),(-1,-1), 0),
        # Alternate row tint
        *[("ROWBACKGROUNDS", (0,i),(1,i), [colors.HexColor("#f9fafb")])
          for i in range(0, len(toc_rows), 2)],
    ]))
    s.append(tbl)
    return s


# ══════════════════════════════════════════════════════════════════════════════
# Diagram page story
# ══════════════════════════════════════════════════════════════════════════════

def _diag_story(styles):
    s = []
    if not DIAG.exists():
        s.append(Paragraph("[Diagram not found]", styles["DocBody"]))
        return s

    # Fit within the landscape frame (10.0 × 7.4 in usable)
    dw = 10.0 * inch
    dh = dw * (18 / 28)          # keep original 28:18 aspect ratio
    s.append(Image(str(DIAG), width=dw, height=dh))
    s.append(Spacer(1, 0.08*inch))
    s.append(Paragraph(
        "Figure 1 — EAC System  Azure Cloud Architecture · "
        "Azure Container Apps (KEDA) · Azure OpenAI Service · "
        "PostgreSQL + pgvector · Azure Service Bus · Key Vault · Entra ID · "
        "Application Insights · Azure Front Door",
        styles["FigCaption"]))
    return s


# ══════════════════════════════════════════════════════════════════════════════
# Markdown → Platypus story
# ══════════════════════════════════════════════════════════════════════════════

def _parse_md(md, styles):
    story = []
    lines = md.splitlines()
    i = 0
    in_code = False
    code_buf = []
    in_table = False
    table_rows = []
    title_done = False

    def flush_code():
        nonlocal code_buf
        if code_buf:
            story.append(Paragraph(
                "<br/>".join(_esc(l) for l in code_buf),
                styles["DocCode"]))
            story.append(Spacer(1, 4))
            code_buf.clear()

    def flush_table():
        nonlocal table_rows, in_table
        if not table_rows:
            in_table = False
            return
        ncols = max(len(r) for r in table_rows)
        rows = [r + [""] * (ncols - len(r)) for r in table_rows]
        pw = PORT[0] - 1.7 * inch
        cw = pw / ncols
        tbl = Table(rows, colWidths=[cw] * ncols, repeatRows=1)
        tbl.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, 0), AZURE),
            ("TEXTCOLOR",    (0, 0), (-1, 0), WHITE),
            ("FONTNAME",     (0, 0), (-1, 0), F_BOLD),
            ("FONTSIZE",     (0, 0), (-1, -1), 8.2),
            ("ROWBACKGROUNDS",(0,1),(-1,-1), [WHITE, LGRAY]),
            ("GRID",         (0, 0), (-1, -1), 0.3, colors.HexColor("#d1d5db")),
            ("VALIGN",       (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING",   (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
            ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ]))
        story.append(tbl)
        story.append(Spacer(1, 8))
        table_rows.clear()
        in_table = False

    while i < len(lines):
        line = lines[i]

        # ── code fence ─────────────────────────────────────────────────────
        if line.strip().startswith("```"):
            in_code = not in_code
            if not in_code:
                flush_code()
            i += 1
            continue
        if in_code:
            code_buf.append(line)
            i += 1
            continue

        # ── table row ──────────────────────────────────────────────────────
        if line.strip().startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if all(re.match(r"^-+$", c.replace(":", "")) for c in cells if c):
                i += 1
                continue
            in_table = True
            table_rows.append([Paragraph(_inline(c), styles["DocBody"])
                                for c in cells])
            i += 1
            continue
        elif in_table:
            flush_table()

        stripped = line.strip()

        # ── blank ──────────────────────────────────────────────────────────
        if not stripped:
            story.append(Spacer(1, 4))
            i += 1
            continue

        # ── hr ─────────────────────────────────────────────────────────────
        if re.match(r"^-{3,}$", stripped):
            story.append(HRFlowable(width="100%", thickness=0.5,
                                    color=colors.HexColor("#d1d5db"), spaceAfter=8))
            i += 1
            continue

        # ── headings ───────────────────────────────────────────────────────
        hm = re.match(r"^(#{1,4})\s+(.*)", stripped)
        if hm:
            lvl  = len(hm.group(1))
            text = _inline(hm.group(2))
            if lvl == 1 and not title_done:
                # skip the first H1 — we have a cover page already
                title_done = True
            elif lvl == 1:
                story.append(Paragraph(text, styles["DocH1"]))
            elif lvl == 2:
                story.append(Paragraph(text, styles["DocH2"]))
            elif lvl == 3:
                story.append(Paragraph(text, styles["DocH3"]))
            else:
                story.append(Paragraph(f"<b>{text}</b>", styles["DocBody"]))
            i += 1
            continue

        # ── bold-prefix meta line ──────────────────────────────────────────
        if stripped.startswith("**") and "**" in stripped[2:]:
            story.append(Paragraph(_inline(stripped), styles["DocMeta"]))
            i += 1
            continue

        # ── bullet ─────────────────────────────────────────────────────────
        bm = re.match(r"^(\s*)([-*+]|\d+\.)\s+(.*)", line)
        if bm:
            indent = len(bm.group(1))
            text   = _inline(bm.group(3))
            extra  = (indent // 2) * 14
            story.append(Paragraph(
                f"<bullet>&bull;</bullet>{text}",
                ParagraphStyle("_Bul", parent=styles["DocBullet"],
                               leftIndent=20 + extra,
                               bulletIndent=8 + extra)))
            i += 1
            continue

        # ── normal paragraph ───────────────────────────────────────────────
        story.append(Paragraph(_inline(stripped), styles["DocBody"]))
        i += 1

    if in_code:
        flush_code()
    if in_table:
        flush_table()

    return story


# ══════════════════════════════════════════════════════════════════════════════
# Section-number H1 callout boxes
# ══════════════════════════════════════════════════════════════════════════════

def _upgrade_h1s(story, styles):
    """Replace H1 paragraphs with a full-width coloured header box."""
    out = []
    for item in story:
        if getattr(item, "style", None) and item.style.name == "DocH1":
            raw = re.sub(r"<[^>]+>", "", item.text)   # strip any markup
            box_row = Table(
                [[Paragraph(f"<b>{_inline(raw)}</b>",
                            ParagraphStyle("H1Box", parent=styles["DocH1"],
                                           textColor=WHITE, spaceBefore=0, spaceAfter=0))]],
                colWidths=[PORT[0] - 1.7*inch],
            )
            box_row.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), AZURE),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("ROUNDEDCORNERS", [4, 4, 4, 4]),
            ]))
            out.append(Spacer(1, 14))
            out.append(box_row)
            out.append(Spacer(1, 6))
        else:
            out.append(item)
    return out


# ══════════════════════════════════════════════════════════════════════════════
# Build
# ══════════════════════════════════════════════════════════════════════════════

def main():
    styles = _styles()

    # ── page templates ───────────────────────────────────────────────────────
    # Cover: portrait, no margins (drawn by callback)
    cover_frame = Frame(0.75*inch, 0.75*inch,
                        PORT[0]-1.5*inch, PORT[1]-1.5*inch,
                        id="cover")
    cover_tmpl = PageTemplate(id="Cover", frames=[cover_frame],
                              pagesize=PORT, onPage=_cover_page)

    # Diagram: landscape, minimal margins
    diag_frame = Frame(0.35*inch, 0.35*inch,
                       LAND[0]-0.7*inch, LAND[1]-0.7*inch,
                       id="diag")
    diag_tmpl = PageTemplate(id="Diagram", frames=[diag_frame],
                             pagesize=LAND, onPage=_diag_page)

    # Text: portrait, tighter margins to reduce page count
    text_frame = Frame(0.75*inch, 0.70*inch,
                       PORT[0]-1.5*inch, PORT[1]-1.55*inch,
                       id="text")
    text_tmpl = PageTemplate(id="Text", frames=[text_frame],
                             pagesize=PORT, onPage=_text_page)

    doc = BaseDocTemplate(
        str(OUTPUT),
        pageTemplates=[cover_tmpl, diag_tmpl, text_tmpl],
        title="EAC System — Azure Cloud Architecture & Design Document",
        author="Ajith Jalagam",
        subject="UC-1 Network Annual Capital Labor Survey",
    )

    # ── story ────────────────────────────────────────────────────────────────
    story = []

    # 1. Cover page
    story += _cover_story(styles)
    story.append(NextPageTemplate("Diagram"))
    story.append(PageBreak())

    # 2. Diagram page (landscape)
    story += _diag_story(styles)
    story.append(NextPageTemplate("Text"))
    story.append(PageBreak())

    # 3. Written document (portrait)
    md = INPUT.read_text(encoding="utf-8")
    md_story = _parse_md(md, styles)
    md_story = _upgrade_h1s(md_story, styles)
    story += md_story

    doc.build(story)
    print(f"PDF written to: {OUTPUT}  ({OUTPUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
