# -*- coding: utf-8 -*-
"""Generate the three search result pages from existing pages of the same depth,
so every relative asset path in the template stays valid.

Run from the repo root:  python tools/build_search_pages.py
"""
import os, io, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIV = re.compile(r"<div\b|</div>", re.I)

PAGES = [
    # output,                 template,                      prefix,  lang, doc-lang
    ("search/index.html",     "chven-shesakheb/index.html",  "../",    "ka", "ka"),
    ("ka/search/index.html",  "ka/chven-shesakheb/index.html", "../../", "ka", "ka"),
    ("en/search/index.html",  "en/about-us/index.html",      "../../", "en", "en"),
]

STRINGS = {
    "ka": {
        "heading": "ძებნა",
        "title": "ALCOM ძებნა",
        "placeholder": "ძიება საიტში…",
        "button": "ძებნა",
        "noscript": "ძებნისთვის საჭიროა JavaScript.",
        "loading": "იტვირთება…",
        "error": "ძებნის ინდექსი ვერ ჩაიტვირთა.",
        "tooShort": "შეიყვანეთ მინიმუმ 2 სიმბოლო.",
        "none": "„%s“ — ვერაფერი მოიძებნა.",
        "found": "„%s“ — ნაპოვნია %d გვერდი.",
    },
    "en": {
        "heading": "Search",
        "title": "ALCOM Search",
        "placeholder": "Search the site…",
        "button": "Search",
        "noscript": "Search needs JavaScript.",
        "loading": "Loading…",
        "error": "Could not load the search index.",
        "tooShort": "Type at least 2 characters.",
        "none": "Nothing found for “%s”.",
        "found": "%d pages found for “%s”.",
    },
}

CSS = """<style>
.alcom-search{display:flex;gap:8px;margin:0 0 22px}
.alcom-search input{flex:1 1 auto;min-width:0;padding:10px 12px;border:1px solid #d3d3d3;background:#fff;color:#1b1b1b;font:inherit}
.alcom-search input:focus{outline:none;border-color:#021b27}
.alcom-search button{padding:10px 22px;border:0;background:#021b27;color:#fff;font:inherit;cursor:pointer}
.alcom-search button:hover{background:#0a3348}
.alcom-status{margin:0 0 18px;color:#777}
.alcom-results{list-style:none;margin:0;padding:0}
.alcom-hit{padding:14px 0;border-top:1px solid #d3d3d3}
.alcom-hit:first-child{border-top:0}
.alcom-hit-title{display:inline-block;font-size:17px;text-decoration:none}
.alcom-hit-title:hover{text-decoration:underline}
.alcom-hit-text{margin:6px 0 4px;line-height:1.55}
.alcom-hit-text mark{background:#ffe9a8;color:inherit;padding:0 1px}
.alcom-hit-url{color:#999;font-size:12px;word-break:break-all}
</style>
"""

BODY = """<div id="maincontent">
                <div class="container">
                    <div class="page_title"><span><h1>%(heading)s</h1></span></div>
                    <div class="page_body">
                        <div class="article-content">
                            <form id="alcom-form" class="alcom-search" action="" method="get">
                                <input id="alcom-q" name="q" type="search" autocomplete="off"
                                       placeholder="%(placeholder)s" aria-label="%(heading)s" />
                                <button type="submit">%(button)s</button>
                            </form>
                            <noscript><p class="alcom-status">%(noscript)s</p></noscript>
                            <p id="alcom-status" class="alcom-status"></p>
                            <ul id="alcom-results" class="alcom-results"></ul>
                        </div>
                    </div>
                </div>
                <div class="clr"></div>
            </div>
            <script type="text/javascript">
              window.ALCOM_SEARCH = {
                index: '%(prefix)sassets/search/index-%(lang)s.json',
                base: '%(prefix)s',
                strings: %(json)s
              };
            </script>
            <script src="%(prefix)sassets/search/search.js"></script>"""


def end_of_div(s, start):
    depth = 0
    for m in DIV.finditer(s, start):
        depth += 1 if m.group(0).lower().startswith("<div") else -1
        if depth == 0:
            return m.end()
    raise AssertionError("unbalanced <div> from %d" % start)


def js_strings(st):
    import json
    keys = ("loading", "error", "tooShort", "none", "found")
    return json.dumps({k: st[k] for k in keys}, ensure_ascii=False)


for out, template, prefix, lang, doclang in PAGES:
    st = STRINGS[lang]
    doc = io.open(os.path.join(ROOT, template), encoding="utf-8").read()

    i = doc.find('<div id="maincontent">')
    assert i != -1, template
    j = end_of_div(doc, i)
    body = BODY % {"heading": st["heading"], "placeholder": st["placeholder"],
                   "button": st["button"], "noscript": st["noscript"],
                   "prefix": prefix, "lang": lang, "json": js_strings(st)}
    doc = doc[:i] + body + doc[j:]

    doc = re.sub(r"<title>.*?</title>", "<title>%s</title>" % st["title"], doc, count=1, flags=re.S | re.I)
    doc = doc.replace("</head>", CSS + "</head>", 1)

    d = os.path.join(ROOT, os.path.dirname(out))
    if not os.path.isdir(d):
        os.makedirs(d)
    io.open(os.path.join(ROOT, out), "w", encoding="utf-8", newline="").write(doc)
    print("wrote %-24s from %s" % (out, template))
