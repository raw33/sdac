# Aberdeen Questers Coloring Book (Flipbook)

This is a small, static web page that presents the coloring book as an online “flipbook”, with:
- Page-flip navigation (Prev/Next)
- A page number jump box
- An “All pages” thumbnail view to jump directly to any page
- A per-page coloring mode (“Open page to color”)
- A direct link to open the original PDF

## Open it

You can open `index.html` directly (double-click) and it will work.

If you prefer, you can also run it from a simple local web server.

Any simple local web server works. For example:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Files

- `index.html` – UI and layout
- `styles.css` – styling
- `modern.html` – “Modern AI edition” experience (AI images)
- `modern.css` – styling for the modern AI edition
- `assets/book.pdf` – original PDF
- `assets/pages/` – PNG pages (front cover, pages 1–19, back cover)
- `assets/modern/pages/` – 2026 AI single-page images (inside pages)
- `assets/modern/book.pdf` – modern book PDF (generated from images)

Note: the flip animation uses a small library loaded from a public CDN. If the viewer can’t load it (for example, no internet access), the site will automatically fall back to a simple page-by-page viewer.

## Coloring export note

The “Open page to color” feature can *color* pages even when opened as a local file, but browser security may block **Download/Print** from `file://` pages. For best results, open the site from a local server (localhost) or host it online.
