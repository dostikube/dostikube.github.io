#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
ROUTES = ["index.html", "presentation/index.html", "lab/index.html", "live/index.html", "presenter/index.html"]

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.h1=0; self.ids=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag == "h1": self.h1 += 1
        if "id" in a: self.ids.append(a["id"])
        if tag in ("a", "link", "script", "img"):
            value=a.get("href",a.get("src",""))
            if value: self.links.append(value)

class SiteTests(unittest.TestCase):
    def test_required_routes_exist(self):
        for route in ROUTES: self.assertTrue((ROOT/route).is_file(), route)

    def test_local_assets_resolve_and_ids_are_unique(self):
        for route in ROUTES:
            path=ROOT/route; page=Page(); page.feed(path.read_text())
            self.assertEqual(len(page.ids),len(set(page.ids)),route)
            for link in page.links:
                url=urlsplit(link)
                if url.scheme or url.netloc or link.startswith("#"): continue
                target=(path.parent/unquote(url.path)).resolve()
                if not url.path or url.path.endswith("/"): target/= "index.html"
                self.assertTrue(target.exists(),(route,link))

    def test_content_model_has_required_talk_and_scenarios(self):
        text=(ROOT/"data/talk.js").read_text()
        for value in ["GITOPS26", "Before GitOps", "Operating model", "Enterprise architecture", "Configuration drift", "Bad image deployment", "Expired secret", "Manual production change"]:
            self.assertIn(value,text)
        self.assertEqual(len(re.findall(r'id: "(?:opening|before|model|enterprise|lab)"',text)),5)

    def test_simulation_boundary_is_visible(self):
        lab=(ROOT/"lab/index.html").read_text()
        self.assertIn("No Kubernetes cluster",lab)
        self.assertIn("deterministic browser state",lab)
        self.assertIn("No response is transmitted",(ROOT/"live/index.html").read_text())

    def test_no_remote_runtime_dependencies(self):
        for route in ROUTES:
            page=Page(); page.feed((ROOT/route).read_text())
            remote=[x for x in page.links if urlsplit(x).scheme in ("http","https") and x != "https://dostikube.github.io/"]
            self.assertEqual(remote,[],(route,remote))

if __name__ == "__main__": unittest.main()
