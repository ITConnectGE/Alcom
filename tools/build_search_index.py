# -*- coding: utf-8 -*-
"""Build the client-side search index from the static pages.

Run from the repo root:  python tools/build_search_index.py
Writes assets/search/index-ka.json and assets/search/index-en.json.
"""
import os, re, io, json, html, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TREES = ("ka", "en")          # the two canonical language trees; "/" duplicates "/ka"
MAX_TEXT = 1400               # characters of body text kept per page
OUT_DIR = os.path.join(ROOT, "assets", "search")
HOME_TITLE = {"ka": "მთავარი", "en": "Home"}

DROP_TAG = re.compile(r"<(script|style)\b.*?</\1>", re.S | re.I)
COMMENT = re.compile(r"<!--.*?-->", re.S)
TAG = re.compile(r"<[^>]+>")
WS = re.compile(r"\s+")
DIV = re.compile(r"<div\b|</div>", re.I)


def text_of(fragment):
    t = DROP_TAG.sub(" ", fragment)
    t = COMMENT.sub(" ", t)
    t = TAG.sub(" ", t)
    t = html.unescape(t).replace("\u00a0", " ")
    return WS.sub(" ", t).strip()


def end_of_div(s, start):
    """Index just past the </div> that closes the <div> opening at `start`."""
    depth = 0
    for m in DIV.finditer(s, start):
        depth += 1 if m.group(0).lower().startswith("<div") else -1
        if depth == 0:
            return m.end()
    return start


def body_fragment(doc):
    """Everything between the header and the footer, minus the address strip
    that every page repeats (otherwise every page matches 'address', 'Tbilisi', ...)."""
    a = doc.find("<!--end header-->")
    a = 0 if a == -1 else a + len("<!--end header-->")
    b = doc.find("<!--start footer-->", a)
    if b == -1:
        b = doc.find('id="footer"', a)
    region = doc[a: b if b != -1 else len(doc)]
    for marker in ('<div class="module_block">', '<div id="jserror"'):
        i = region.find(marker)
        if i != -1:
            return region[end_of_div(region, i):]
    return region


def title_of(doc, url, lang):
    if url == lang + "/":
        return HOME_TITLE[lang]
    m = re.search(r"<title>(.*?)</title>", doc, re.S | re.I)
    t = re.sub(r"^ALCOM\s+", "", text_of(m.group(1))) if m else ""
    if t:
        return t
    m = re.search(r'<div class="page_title">(.*?)</div>', doc, re.S)
    return (text_of(m.group(1)) if m else "") or "ALCOM"


def skip(rel):
    parts = rel.split("/")
    return "@start=" in rel or (len(parts) > 1 and parts[1] == "search")


def collect(lang):
    entries, seen = [], {}
    for r, dirs, fns in os.walk(os.path.join(ROOT, lang)):
        if "index.html" not in fns:
            continue
        rel = os.path.relpath(r, ROOT).replace("\\", "/")
        if skip(rel):
            continue
        doc = io.open(os.path.join(r, "index.html"), encoding="utf-8", errors="replace").read()
        url = rel + "/"
        title = title_of(doc, url, lang)
        body = text_of(body_fragment(doc))
        key = hashlib.md5((title + "\u241f" + body[:600]).encode("utf-8")).hexdigest()
        prev = seen.get(key)
        if prev is not None:                       # same page under two URLs
            if len(url) < len(entries[prev]["u"]):
                entries[prev]["u"] = url
            continue
        seen[key] = len(entries)
        entries.append({"u": url, "t": title, "x": body[:MAX_TEXT]})
    entries.sort(key=lambda e: e["u"])
    return entries


if __name__ == "__main__":
    if not os.path.isdir(OUT_DIR):
        os.makedirs(OUT_DIR)
    for lang in TREES:
        entries = collect(lang)
        p = os.path.join(OUT_DIR, "index-%s.json" % lang)
        with io.open(p, "w", encoding="utf-8", newline="") as f:
            json.dump(entries, f, ensure_ascii=False, separators=(",", ":"))
        thin = sum(1 for e in entries if len(e["x"]) < 20)
        print("%-16s %4d pages, %3d with little text, %7.1f KB"
              % (os.path.basename(p), len(entries), thin, os.path.getsize(p) / 1024.0))
