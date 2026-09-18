# DostiKube — GitOps in the Real World

Static presenter portal, interactive conference presentation, and browser-only enterprise lab for **“GitOps in the Real World: Lessons from Operating Kubernetes with Argo CD.”**

## Access model

The root page is a minimal presenter gate. The temporary code is `Dosti123`. A successful entry stores `dostikube-access=granted` in `sessionStorage`; protected routes redirect to `/` when that value is absent. Logout removes the value.

This is intentionally a client-side presentation gate. It is not secure authentication: the code and content are public in the delivered source. There are no user accounts, audience sessions, backend, database, or external identity provider.

## Routes

- `/` — presenter access gate.
- `/portal/` — presenter command center.
- `/presentation/` — six-screen talk covering Git → Argo CD, the Application manifest, reconciliation, drift, and enterprise architecture.
- `/demo/` — interactive desired-versus-actual state and reconciliation simulation.
- `/lab/` — drift, bad-image, manual-change, and expired-secret simulations.
- `/architecture/` — enterprise delivery path and surrounding controls.

## Architecture

The site uses plain HTML, CSS, and JavaScript without a build dependency. `data/talk.js` holds the structured talk, architecture, demo, and incident content. `assets/core.js` implements the access flow, presentation, demo, architecture, and deterministic lab state. `assets/guard.js` performs the synchronous client-side route check.

## Run locally

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/` and enter `Dosti123`.

Run validation:

```sh
python3 -m unittest discover -s tests -v
node --check assets/core.js
node --check assets/guard.js
node --check data/talk.js
```

## Deployment

The canonical repository is `dostikube/dostikube.github.io`, published at `https://dostikube.github.io/`. The Pages workflow validates and deploys the repository root from `main`.

## Real and simulated boundaries

Real in this static prototype:

- client-side access gate and session-scoped persistence;
- logout and protected-route redirects;
- keyboard and button presentation controls;
- responsive architecture diagrams and YAML views;
- deterministic demo and incident transitions.

Simulated:

- Git changes, pull requests, validation, and merges;
- Argo CD sync, health, drift, and reconciliation;
- Kubernetes rollouts, replicas, and audit events;
- identity, secrets, policy, monitoring, and network controls.

No cluster, Git provider, Argo CD API, identity provider, or backend is contacted.
