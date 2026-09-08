# -*- coding: utf-8 -*-
"""Put the header search box back on every page, pointing at the static search
page for that page's language. Run from the repo root."""
import os, io, re, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BEFORE = "86c6311"                      # last commit that still had the CMS search block
BLOCK = re.compile(r'<div class="search">.*?<div class="search-tring-left"></div>\s*</div>', re.S)
CTX = 80

PLACEHOLDER = {"ka": "ძიება...", "en": "Search..."}

TEMPLATE = """<div class="search">
                                <div class="search_in"></div>
                                <form action="%(action)s" method="get" id="search_form">
  <div class="search_area">
    <div class="search_input">
      <input name="q" id="mod_search_searchword" maxlength="60" class="kbd inputbox mod_search_searchword" title="%(ph)s" placeholder="%(ph)s" type="text" value="" />
    </div>
    <div class="search_but">
      <input type="submit" value="" class="search_button" />
    </div>
    <div class="cls"></div>
  </div>
</form>
                                <div class="search-tring-right"></div>
                                <div class="search-tring-left"></div>
                            </div>"""


def git_show(rev, path):
    r = subprocess.run(["git", "show", "%s:%s" % (rev, path)], capture_output=True, cwd=ROOT)
    return r.stdout.decode("utf-8") if r.returncode == 0 else None


def target(rel):
    parts = rel.split("/")
    depth = len(parts) - 1
    prefix = "../" * depth
    lang = parts[0] if parts[0] in ("ka", "en") else ""
    tree = (lang + "/") if lang else ""
    return prefix + tree + "search/", ("en" if lang == "en" else "ka")


def context_for(rel):
    """The 80 characters that preceded the search block, taken from the pre-removal commit."""
    old = git_show(BEFORE, rel)
    if old is None:
        return None
    m = BLOCK.search(old)
    if not m or m.start() < CTX:
        return None
    return old[m.start() - CTX:m.start()]


# the search pages were cloned from these, so they share the same header markup
CLONES = {
    "search/index.html": "chven-shesakheb/index.html",
    "ka/search/index.html": "ka/chven-shesakheb/index.html",
    "en/search/index.html": "en/about-us/index.html",
}

added = skipped = failed = 0
problems = []
for r, dirs, fns in os.walk(ROOT):
    if ".git" in r.split(os.sep):
        continue
    for fn in fns:
        if fn != "index.html" and not fn.endswith(".html"):
            continue
        p = os.path.join(r, fn)
        rel = os.path.relpath(p, ROOT).replace("\\", "/")
        t = io.open(p, encoding="utf-8", errors="replace").read()
        if 'id="search_form"' in t:
            skipped += 1
            continue
        ctx = context_for(rel) or context_for(CLONES.get(rel, ""))
        if ctx is None or t.count(ctx) != 1:
            failed += 1
            problems.append((rel, "no anchor" if ctx is None else "anchor x%d" % t.count(ctx)))
            continue
        action, lang = target(rel)
        block = TEMPLATE % {"action": action, "ph": PLACEHOLDER[lang]}
        t = t.replace(ctx, ctx + block, 1)
        io.open(p, "w", encoding="utf-8", newline="").write(t)
        added += 1

print("search box added to %d pages, already present on %d, failed on %d" % (added, skipped, failed))
for pr in problems[:10]:
    print("   !", pr)
