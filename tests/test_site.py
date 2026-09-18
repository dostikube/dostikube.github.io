#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
ROUTES = [
    "index.html",
    "portal/index.html",
    "presentation/index.html",
    "demo/index.html",
    "lab/index.html",
    "architecture/index.html",
    "explorer/index.html",
    "diff/index.html",
]
PROTECTED = ROUTES[1:]

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.ids=[]; self.scripts=[]
    def handle_starttag(self, tag, attrs):
        values=dict(attrs)
        if "id" in values: self.ids.append(values["id"])
        if tag in ("a", "link", "script", "img"):
            value=values.get("href",values.get("src",""))
            if value: self.links.append(value)
        if tag == "script" and values.get("src"): self.scripts.append(values["src"])

class SiteTests(unittest.TestCase):
    def test_required_routes_exist(self):
        for route in ROUTES: self.assertTrue((ROOT/route).is_file(), route)

    def test_removed_audience_routes_and_qr_runtime(self):
        self.assertFalse((ROOT/"live/index.html").exists())
        self.assertFalse((ROOT/"presenter/index.html").exists())
        self.assertFalse((ROOT/"assets/qrcode.min.js").exists())

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

    def test_every_protected_route_loads_guard_first(self):
        for route in PROTECTED:
            page=Page(); page.feed((ROOT/route).read_text())
            self.assertTrue(page.scripts, route)
            self.assertEqual(page.scripts[0], "../assets/guard.js", route)

    def test_access_model_is_session_scoped_and_disclosed(self):
        core=(ROOT/"assets/core.js").read_text()
        guard=(ROOT/"assets/guard.js").read_text()
        home=(ROOT/"index.html").read_text()
        self.assertIn('ACCESS_CODE = "Dosti123"',core)
        self.assertIn("sessionStorage.setItem",core)
        self.assertIn("sessionStorage.removeItem",core)
        self.assertIn("sessionStorage.getItem",guard)
        self.assertIn("not secure authentication",home)
        self.assertNotIn("localStorage",core+guard)

    def test_content_model_has_required_flows_and_scenarios(self):
        text=(ROOT/"data/talk.js").read_text()
        for value in ["Developer","Git repository","GitOps manifests","Argo CD Application","Kubernetes cluster","Pull Request","Branch Protection","CI / Security / Policy","GitOps Repository","Argo CD","GitHub Enterprise","DEV","TEST","PROD","Entra ID","Key Vault / secrets","Configuration drift","Bad image release","Manual production change","Expired secret"]:
            self.assertIn(value,text)
        self.assertEqual(len(re.findall(r'id:"(?:drift|image|manual|secret)",label:',text)),4)
        slides=text.split("  scenarios:",1)[0]
        self.assertEqual(len(re.findall(r'id:"(?:opening|why|source|git-to-argo|application|sync|drift|boundaries|enterprise)"',slides)),9)

    def test_application_manifest_explains_required_fields(self):
        text=(ROOT/"data/talk.js").read_text()
        for value in ["apiVersion: argoproj.io/v1alpha1","kind: Application","repoURL:","targetRevision:","path:","destination:","namespace:","syncPolicy:"]:
            self.assertIn(value,text)

    def test_reconcile_demo_has_manual_change_and_reconcile_actions(self):
        source=(ROOT/"demo/index.html").read_text()
        core=(ROOT/"assets/core.js").read_text()
        for value in ["manual-change","reconcile","replicas: 3","clusterReplicas = 1","OutOfSync","Synced / Healthy"]:
            self.assertIn(value,source+core)

    def test_visual_model_uses_documented_argo_concepts(self):
        core=(ROOT/"assets/core.js").read_text()
        data=(ROOT/"data/talk.js").read_text()
        presentation=(ROOT/"presentation/index.html").read_text()
        for value in ["github-window","argo-window","resource-tree","+ New App","ApplicationSet","Synced","OutOfSync","Healthy","Degraded","View YAML"]:
            self.assertIn(value,core+data)
        self.assertIn("01 / 09",presentation)
        official_sources=data.count("https://argo-cd.readthedocs.io/")+data.count("https://argo-rollouts.readthedocs.io/")
        self.assertGreaterEqual(official_sources,8)

    def test_gitops_boundaries_are_explicit(self):
        data=(ROOT/"data/talk.js").read_text()
        core=(ROOT/"assets/core.js").read_text()
        for value in ["What GitOps does NOT solve","Secrets lifecycle","Identity design","Network architecture","Bad application logic","Observability","Human approval boundaries","Disaster recovery","owner, control, evidence, and recovery path"]:
            self.assertIn(value,data+core)

    def test_progressive_delivery_teaches_failure_and_recovery(self):
        data=(ROOT/"data/talk.js").read_text()
        core=(ROOT/"assets/core.js").read_text()
        for value in ["kind: Rollout","setWeight: 20","CI tests · policy · security","Canary 20%","Health checks · metrics · approval","Promote or abort","Argo CD can faithfully deploy the wrong thing.","Reconcile","Rollback / revert","STAGE","app-stage","4 generated Applications","Rollback strategy"]:
            self.assertIn(value,data+core)

    def test_training_platform_content_is_structured(self):
        platform=(ROOT/"data/platform.js").read_text()
        core=(ROOT/"assets/core.js").read_text()
        for value in ["apps/payments/base/deployment.yaml","environments/{env}/payments/patch.yaml","ApplicationSet","policies/require-resources.yaml","Git desired state","CLUSTER · ACTUAL","Symptom","Evidence","Root cause","Decision","Fix","Prevention","Bad ingress","Dependency outage","initExplorer","initDiff"]:
            self.assertIn(value,platform+core)
        self.assertEqual(platform.count('title:'),12)

    def test_interactive_architecture_has_component_detail(self):
        page=(ROOT/"architecture/index.html").read_text()
        platform=(ROOT/"data/platform.js").read_text()
        self.assertIn('id="component-detail"',page)
        for value in ["Pull Request","Argo CD","DEV","PROD","Key Vault / secrets","RBAC","Network controls","Observability"]:
            self.assertIn(value,platform)

    def test_simulation_boundary_is_visible(self):
        for route in ("demo/index.html","lab/index.html","explorer/index.html","diff/index.html"):
            source=(ROOT/route).read_text()
            self.assertIn("Simulation boundary",source)
            if route.startswith("lab"): self.assertIn("No Kubernetes cluster",source)

    def test_no_remote_runtime_dependencies(self):
        for route in ROUTES:
            page=Page(); page.feed((ROOT/route).read_text())
            remote=[link for link in page.links if urlsplit(link).scheme in ("http","https") and link != "https://dostikube.github.io/"]
            self.assertEqual(remote,[],(route,remote))

if __name__ == "__main__": unittest.main()
