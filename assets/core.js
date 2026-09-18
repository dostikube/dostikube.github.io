(function () {
  "use strict";

  const TALK = window.DOSTI_TALK;
  const ACCESS_CODE = "Dosti123";
  const ACCESS_KEY = "dostikube-access";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));

  function initAccess() {
    if (sessionStorage.getItem(ACCESS_KEY) === "granted") {
      location.replace("portal/");
      return;
    }
    const form = $("#access-form");
    const input = $("#access-code");
    const error = $("#access-error");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (input.value === ACCESS_CODE) {
        sessionStorage.setItem(ACCESS_KEY, "granted");
        location.href = "portal/";
        return;
      }
      error.textContent = "Incorrect access code";
      input.select();
    });
  }

  function initProtected() {
    $$('[data-logout]').forEach((button) => button.addEventListener("click", () => {
      sessionStorage.removeItem(ACCESS_KEY);
      location.replace(new URL("../", location.href));
    }));
  }

  function node(text) {
    return `<div class="node">${escape(text)}</div>`;
  }

  function flowMarkup(items) {
    return `<div class="flow">${items.map(node).join("")}</div>`;
  }

  function yamlPanel(yaml, highlighted = []) {
    const lines = String(yaml).split("\n").map((line) => {
      const active = highlighted.some((key) => line.trimStart().startsWith(`${key}:`));
      return `<span class="yaml-line${active ? " highlighted" : ""}">${escape(line) || " "}</span>`;
    }).join("");
    return `<pre class="terminal application-yaml">${lines}</pre>`;
  }

  function inspectYaml(yaml, label = "View YAML") {
    return `<details class="inspect-panel"><summary>${label}</summary><pre class="terminal">${escape(yaml)}</pre></details>`;
  }

  function argoDashboard(status, health, replicas) {
    const drifted = status === "OutOfSync";
    return `<div class="mock-window argo-window"><div class="mock-bar"><span class="mock-logo">ARGO CD</span><span>Applications / payments</span><span class="mock-user">platform-admin</span></div><div class="argo-summary"><div><small>APPLICATION</small><strong>payments</strong></div><span class="ui-badge ${drifted ? "warn" : "ok"}">${status}</span><span class="ui-badge ${health === "Degraded" ? "error" : "ok"}">${health}</span></div><div class="resource-tree"><div class="resource git-resource">Git<br><b>replicas: 3</b></div><span>→</span><div class="resource">Application<br><b>payments</b></div><span>→</span><div class="resource ${drifted ? "drifted" : ""}">Deployment<br><b>replicas: ${replicas}</b></div><span>→</span><div class="resource">Pods<br><b>${replicas}/${replicas} ready</b></div></div><div class="mock-footer"><span>Revision main@a81f2c7</span><span>Destination in-cluster / payments</span></div></div>`;
  }

  function visual(slide) {
    if (slide.kind === "why") return `<div class="why-grid"><div class="why-panel before"><p class="eyebrow">Competing write paths</p><div class="command-list"><code>kubectl edit deployment</code><code>pipeline deploy --prod</code><code>manual hotfix</code></div><span class="ui-badge error">DRIFT UNKNOWN</span></div><div class="why-arrow">→</div><div class="why-panel after"><p class="eyebrow">Reviewed operating path</p>${flowMarkup(["Pull Request","Protected main","Argo CD","Kubernetes"])}<span class="ui-badge ok">CHANGE TRACEABLE</span></div></div>${inspectYaml(slide.yaml, "Inspect flow")}`;
    if (slide.kind === "github") return `<div class="mock-window github-window"><div class="mock-bar"><span class="mock-logo">GitHub Enterprise</span><span>platform / gitops-config</span><span class="mock-user">main</span></div><div class="repo-tabs"><b>Code</b><span>Pull requests <i>1</i></span><span>Actions</span><span>Security</span></div><div class="repo-commit"><span class="avatar">DS</span><div><b>Update payments replicas to 3</b><small>approved and validated · a81f2c7</small></div><span class="ui-badge ok">CHECKS PASSING</span></div><div class="file-list"><div><span>▾</span><b>environments/prod/payments</b><small>3 files</small></div><div><span>◇</span>application.yaml<small>Argo CD Application</small></div><div><span>◇</span>deployment.yaml<small>replicas: 3</small></div><div><span>◇</span>service.yaml<small>ClusterIP</small></div></div></div>${inspectYaml(TALK.deploymentManifest)}`;
    if (slide.kind === "flow" || slide.kind === "primary-flow") return `<div class="diagram">${flowMarkup(slide.flow)}<div class="split-mocks"><div class="mini-repo"><span class="mock-logo">GIT</span><b>gitops-config</b><code>environments/prod/payments</code><span class="ui-badge ok">main · reviewed</span></div><div class="mini-argo"><span class="mock-logo">ARGO CD</span><b>payments</b><code>main / environments/prod/payments</code><span class="ui-badge ok">Synced</span></div></div><div class="legend"><div><b>Git</b>desired state</div><div><b>Kubernetes</b>actual state</div><div><b>Argo CD</b>continuous comparison</div></div></div>${inspectYaml(TALK.deploymentManifest)}`;
    if (slide.kind === "application") return `<div class="application-layout"><div>${yamlPanel(TALK.applicationManifest,["repoURL","targetRevision","path","destination","namespace","syncPolicy"])}</div><div class="mock-window create-app"><div class="mock-bar"><span class="mock-logo">ARGO CD</span><span>+ New App</span></div><div class="create-fields"><label>Application name<strong>payments</strong></label><label>Repository URL<strong>github.example.com/platform/gitops-config.git</strong><small>Repository Argo CD reads</small></label><label>Revision<strong>main</strong><small>Git ref to compare</small></label><label>Path<strong>environments/prod/payments</strong><small>Manifest directory</small></label><label>Destination cluster<strong>https://kubernetes.default.svc</strong><small>Target Kubernetes API</small></label><label>Namespace<strong>payments</strong><small>Workload namespace</small></label><label>Sync policy<strong>Automatic · Prune · Self Heal</strong><small>How drift is corrected</small></label></div><button class="mock-primary">CREATE</button></div></div>`;
    if (slide.kind === "synced-state" || slide.kind === "drift-state") {
      const synced = slide.kind === "synced-state";
      return `${argoDashboard(synced ? "Synced" : "OutOfSync", "Healthy", synced ? 3 : 1)}<div class="state-grid state-strip"><div class="state-card"><strong>Git · desired</strong><code>replicas: 3</code></div><div class="state-card"><strong>Kubernetes · actual</strong><code>replicas: ${synced ? "3" : "1"}</code></div><div class="state-card"><strong>Argo CD</strong><code>${synced ? "Synced / Healthy" : "OutOfSync"}</code></div></div>${inspectYaml(TALK.deploymentManifest)}`;
    }
    if (slide.kind === "states") return `<div class="diagram state-comparison"><div class="state-card"><strong>Git · desired</strong><code>replicas: 3</code></div><div class="reconcile-loop">observe<br>↻<br>reconcile</div><div class="state-card"><strong>Kubernetes · actual</strong><code>replicas: 1</code></div></div>`;
    if (slide.kind === "enterprise") return `<div class="diagram enterprise-diagram"><div class="enterprise-topology">${flowMarkup(slide.flow)}</div><div class="appset-view"><div class="appset-root"><span class="mock-logo">ApplicationSet</span><b>payments-environments</b><small>3 generated Applications</small></div><div class="appset-children"><div><span class="ui-badge ok">Synced</span><b>app-dev</b><small>Healthy</small></div><div><span class="ui-badge ok">Synced</span><b>app-test</b><small>Healthy</small></div><div><span class="ui-badge warn">Gated</span><b>app-prod</b><small>Healthy</small></div></div></div><div class="controls-ring">${slide.controls.map((control) => `<span class="control-chip">${escape(control)}</span>`).join("")}</div></div>`;
    if (slide.kind === "lab") return `<div class="diagram"><pre class="terminal">${escape(slide.yaml)}</pre><a class="btn amber lab-link" href="../lab/">Open failure lab →</a></div>`;
    return `<div class="diagram"><pre class="terminal">${escape(slide.yaml)}</pre></div>`;
  }

  function slideMarkup(slide) {
    return `<div class="slide-inner slide-${escape(slide.kind)}"><p class="eyebrow">${escape(slide.eyebrow)}</p><h1>${escape(slide.title)}</h1><p class="lead">${escape(slide.lead)}</p>${visual(slide)}${slide.source ? `<a class="reference-link" href="${escape(slide.source)}" target="_blank" rel="noreferrer">Reference · Official Argo CD documentation ↗</a>` : ""}</div>`;
  }

  function initPresentation() {
    initProtected();
    const root = $("#slide");
    const count = $("#slide-count");
    const dots = $("#dots");
    let index = Math.max(0, Math.min(TALK.slides.length - 1, Number(new URLSearchParams(location.search).get("slide")) || 0));
    dots.innerHTML = TALK.slides.map((_, itemIndex) => `<button class="dot" data-index="${itemIndex}" aria-label="Go to slide ${itemIndex + 1}"></button>`).join("");
    function render() {
      root.innerHTML = slideMarkup(TALK.slides[index]);
      count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(TALK.slides.length).padStart(2, "0")}`;
      $$(".dot", dots).forEach((dot, itemIndex) => dot.classList.toggle("active", itemIndex === index));
      history.replaceState(null, "", `?slide=${index}`);
    }
    function move(amount) {
      index = Math.max(0, Math.min(TALK.slides.length - 1, index + amount));
      render();
    }
    $("#prev").addEventListener("click", () => move(-1));
    $("#next").addEventListener("click", () => move(1));
    dots.addEventListener("click", (event) => {
      if (event.target.dataset.index !== undefined) {
        index = Number(event.target.dataset.index);
        render();
      }
    });
    addEventListener("keydown", (event) => {
      if (["ArrowRight", "PageDown", " "].includes(event.key)) move(1);
      if (["ArrowLeft", "PageUp"].includes(event.key)) move(-1);
    });
    render();
  }

  const initialLabStates = {
    drift: {status:"OutOfSync",good:false,git:"replicas: 3",cluster:"replicas: 1",log:["Drift detected: replicas differ from Git."],action:"Reconcile"},
    image: {status:"PR ready",good:false,git:"image: app:v41",cluster:"image: app:v41 · Healthy",log:["PR proposes image: app:v42"],action:"Merge and sync"},
    manual: {status:"Synced",good:true,git:"limits.cpu: 500m",cluster:"limits.cpu: 500m",log:["No drift detected."],action:"Run kubectl change"},
    secret: {status:"Synced / app error",good:false,git:"Deployment: Healthy",cluster:"Authentication: failed",log:["Pod readiness: passing","Application authentication: failed","Credential: expired"],action:"Inspect evidence"}
  };

  function freshLabStates() {
    return JSON.parse(JSON.stringify(initialLabStates));
  }

  function initLab() {
    initProtected();
    let active = "drift";
    const states = freshLabStates();
    const tabs = $("#scenario-tabs");
    const copy = $("#scenario-copy");
    const simulation = $("#sim");
    tabs.innerHTML = TALK.scenarios.map((scenario) => `<button class="scenario-tab" data-id="${scenario.id}">${scenario.label} · ${escape(scenario.title)}</button>`).join("");

    function render() {
      const scenario = TALK.scenarios.find((item) => item.id === active);
      const state = states[active];
      $$(".scenario-tab", tabs).forEach((tab) => tab.classList.toggle("active", tab.dataset.id === active));
      copy.innerHTML = `<p class="eyebrow">Scenario ${scenario.label}</p><h2>${escape(scenario.title)}</h2><p class="lead">${escape(scenario.summary)}</p><p>${escape(scenario.lesson)}</p>`;
      simulation.innerHTML = `<span class="badge ${state.good ? "good" : "bad"}">ARGO CD · ${escape(state.status)}</span><div class="state-grid"><div class="state-card"><strong>Git · desired</strong><code>${escape(state.git)}</code></div><div class="state-card"><strong>Cluster · actual</strong><code>${escape(state.cluster)}</code></div></div><div class="event-log">${state.log.map((entry) => `<div>› ${escape(entry)}</div>`).join("")}</div><div class="sim-actions"><button class="btn" id="act">${escape(state.action)}</button><button class="btn secondary" id="reset">Reset</button></div>${active === "image" ? '<div class="decision"><p class="eyebrow">Promotion and rollback control</p><button data-choice>Gate production promotion</button><button data-choice>Rollback through Git</button><button data-choice>Pause automatic sync</button></div>' : ""}`;
      $("#act").addEventListener("click", act);
      $("#reset").addEventListener("click", reset);
      $$("[data-choice]", simulation).forEach((button) => button.addEventListener("click", () => button.classList.toggle("chosen")));
    }

    function reset() {
      states[active] = freshLabStates()[active];
      render();
    }

    function act() {
      const state = states[active];
      if (active === "drift") {
        Object.assign(state, {status:"Synced / Healthy",good:true,cluster:"replicas: 3",action:"Reconciled"});
        state.log.push("Argo applied replicas: 3.", "Health check passed.");
      }
      if (active === "image") {
        Object.assign(state, {status:"Degraded",git:"image: app:v42",cluster:"image: app:v42 · health check failed",action:"Retry rollout"});
        state.log.push("PR merged.", "Argo synced app:v42.", "Kubernetes health check failed.", "Decision required: rollback or gate promotion.");
      }
      if (active === "manual") {
        if (state.status === "Synced") {
          Object.assign(state, {status:"OutOfSync",good:false,cluster:"limits.cpu: 100m",action:"Reconcile"});
          state.log.push("kubectl changed production.", "Audit event recorded.", "Drift detected.");
        } else {
          Object.assign(state, {status:"Synced / Healthy",good:true,cluster:"limits.cpu: 500m",action:"Reconciled"});
          state.log.push("Argo restored the reviewed CPU limit.");
        }
      }
      if (active === "secret") {
        state.log.push("Objects match Git.", "Credential expired outside the deployment lifecycle.", "Rotate the secret and verify identity, network, and application paths.");
        state.action = "Evidence collected";
      }
      render();
    }

    tabs.addEventListener("click", (event) => {
      if (event.target.dataset.id) {
        active = event.target.dataset.id;
        render();
      }
    });
    render();
  }

  function initDemo() {
    initProtected();
    const flow = $("#demo-flow");
    const comparison = $("#reconcile-demo");
    const events = $("#demo-events");
    const manual = $("#manual-change");
    const reconcile = $("#reconcile");
    let clusterReplicas = 3;
    flow.innerHTML = TALK.primaryFlow.map(node).join("");
    function render() {
      const synced = clusterReplicas === 3;
      comparison.innerHTML = `${argoDashboard(synced ? "Synced" : "OutOfSync", "Healthy", clusterReplicas)}<div class="state-grid state-strip"><div class="state-card"><strong>Git · desired state</strong><code>replicas: 3</code></div><div class="state-card"><strong>Kubernetes · actual state</strong><code>replicas: ${clusterReplicas}</code></div><div class="state-card"><strong>Argo CD</strong><code>${synced ? "Synced / Healthy" : "OutOfSync"}</code></div></div>${inspectYaml(TALK.deploymentManifest)}`;
      manual.disabled = !synced;
      reconcile.disabled = synced;
    }
    manual.addEventListener("click", () => {
      clusterReplicas = 1;
      events.innerHTML = "<div>› kubectl scaled the workload to one replica.</div><div>› Argo CD detected drift from Git.</div>";
      render();
    });
    reconcile.addEventListener("click", () => {
      clusterReplicas = 3;
      events.innerHTML += "<div>› Argo CD reapplied replicas: 3.</div><div>› Application returned to Synced / Healthy.</div>";
      render();
    });
    $("#demo-reset").addEventListener("click", () => {
      clusterReplicas = 3;
      events.textContent = "Waiting for a manual cluster change…";
      render();
    });
    events.textContent = "Waiting for a manual cluster change…";
    render();
  }

  function initArchitecture() {
    initProtected();
    $("#enterprise-architecture").innerHTML = `<div class="architecture-path">${TALK.enterpriseFlow.map(node).join("")}</div><div class="control-plane"><p class="eyebrow">Enterprise controls surrounding the path</p><div class="controls-ring">${TALK.controls.map((control) => `<span class="control-chip">${escape(control)}</span>`).join("")}</div></div>`;
  }

  window.Dosti = {initAccess, initProtected, initPresentation, initLab, initDemo, initArchitecture};
})();
