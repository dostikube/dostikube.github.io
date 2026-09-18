# DostiKube — GitOps in the Real World

Static interactive conference presentation and browser-only enterprise lab for the talk **“GitOps in the Real World: Lessons from Operating Kubernetes with Argo CD.”**

## Routes

- `/` — session gate and QR entry. Static code: `GITOPS26`.
- `/presentation/` — five-screen interactive talk.
- `/lab/` — drift, bad image, expired secret, and manual-change simulations.
- `/live/` — audience topic, diagrams, YAML, and device-local poll.
- `/presenter/` — current/next slide, speaker notes, timer, and navigation.

The session code is navigation, not authentication. Direct URLs remain public.

## Architecture

The application uses plain HTML, CSS, and JavaScript with no build dependency. `data/talk.js` is the content model for slides, speaker notes, YAML, and scenario descriptions. `assets/core.js` renders presentation views and deterministic lab state. Route HTML files provide accessible page shells. A vendored MIT-licensed QRCode.js copy generates the audience QR locally.

The generated hero illustration is an original AI-assisted project asset. Diagrams and product concepts are implemented as HTML/CSS rather than copied brand artwork.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`. Run validation with:

```sh
python3 tests/test_site.py
node --check assets/core.js
node --check data/talk.js
```

## Deployment

The Pages workflow validates and deploys the repository root on pushes to `main`. GitHub Pages must be configured to use **GitHub Actions** as its source.

The requested hostname `https://dostikube.github.io/` requires this Pages repository to be owned by the GitHub user or organization named `dostikube` and normally be named `dostikube.github.io`. Under the currently connected repository `ddugi/dostikube`, GitHub's standard project URL is `https://ddugi.github.io/dostikube/`. All application navigation is relative, so the same files work at either location. Canonical and QR URLs currently describe the requested final hostname.

## Real and simulated boundaries

Real in this prototype:

- keyboard and button presentation controls;
- session-code routing;
- generated QR code;
- responsive diagrams and YAML views;
- presenter timer and notes;
- local poll selection;
- deterministic scenario transitions.

Simulated:

- Git changes and pull requests;
- Argo CD sync, health, drift, and reconciliation;
- Kubernetes rollouts and replicas;
- identity, secrets, policy, audit, monitoring, and network controls.

No cluster, Git provider, Argo CD API, identity provider, or backend is contacted.

## Later backend requirements

Cross-device presenter synchronization, aggregate polls, session lifecycle, access control, durable audience state, real cluster telemetry, and live Argo CD actions would require a backend or managed realtime service. Any connection to production infrastructure would also require authentication, authorization, audit logging, rate limits, and a safe demonstration environment.
