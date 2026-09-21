(function () {
  "use strict";

  const TALK = window.DOSTI_TALK;
  const PLATFORM = window.DOSTI_PLATFORM || {};
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
    if (slide.kind === "delivery") return `<div class="delivery-board"><div class="delivery-phases"><section><span>01 · REVIEW</span><b>Change → PR</b><small>CI tests · policy · security</small></section><section><span>02 · RECONCILE</span><b>Merge → Argo CD sync</b><small>Apply the Rollout desired state</small></section><section><span>03 · VERIFY</span><b>Canary 20% → analysis</b><small>Health checks · metrics · approval</small></section><section><span>04 · DECIDE</span><b>Promote or abort</b><small>Advance traffic or revert Git</small></section></div><div class="delivery-status"><span class="ui-badge ok">SYNCED</span><span class="ui-badge warn">CANARY 20%</span><span class="ui-badge warn">PROMOTION PAUSED</span><span class="ui-badge ok">ANALYSIS RUN</span></div><div class="failure-branch"><span>FAILURE BRANCH</span><b>Bad desired state → sync succeeds → application becomes unhealthy → observability detects it → abort or revert Git</b><strong>Argo CD can faithfully deploy the wrong thing.</strong></div><div class="decision-compare"><div><b>Reconcile</b><span>Make actual state match the current desired state.</span></div><div><b>Rollback / revert</b><span>Change the target to a known-good desired state.</span></div></div></div>${inspectYaml(TALK.rolloutManifest,"View Rollout YAML")}`;
    if (slide.kind === "synced-state" || slide.kind === "drift-state") {
      const synced = slide.kind === "synced-state";
      return `${argoDashboard(synced ? "Synced" : "OutOfSync", "Healthy", synced ? 3 : 1)}<div class="state-grid state-strip"><div class="state-card"><strong>Git · desired</strong><code>replicas: 3</code></div><div class="state-card"><strong>Kubernetes · actual</strong><code>replicas: ${synced ? "3" : "1"}</code></div><div class="state-card"><strong>Argo CD</strong><code>${synced ? "Synced / Healthy" : "OutOfSync"}</code></div></div>${inspectYaml(TALK.deploymentManifest)}`;
    }
    if (slide.kind === "boundaries") return `<div class="boundary-board"><div class="boundary-core"><span class="mock-logo">ARGO CD</span><b>Reconcile declared state</b><small>observe · compare · apply</small></div><div class="boundary-grid">${slide.boundaries.map((boundary) => `<div><span>NOT SOLVED BY RECONCILIATION</span><b>${escape(boundary)}</b></div>`).join("")}</div><p class="boundary-rule">Each boundary still needs an owner, control, evidence, and recovery path.</p></div>`;
    if (slide.kind === "states") return `<div class="diagram state-comparison"><div class="state-card"><strong>Git · desired</strong><code>replicas: 3</code></div><div class="reconcile-loop">observe<br>↻<br>reconcile</div><div class="state-card"><strong>Kubernetes · actual</strong><code>replicas: 1</code></div></div>`;
    if (slide.kind === "enterprise") return `<div class="diagram enterprise-diagram"><div class="enterprise-topology">${flowMarkup(slide.flow)}</div><div class="appset-view"><div class="appset-root"><span class="mock-logo">ApplicationSet</span><b>payments-environments</b><small>4 generated Applications</small></div><div class="appset-children"><div><span class="ui-badge ok">Synced</span><b>app-dev</b><small>Healthy</small></div><div><span class="ui-badge ok">Synced</span><b>app-test</b><small>Healthy</small></div><div><span class="ui-badge ok">Synced</span><b>app-stage</b><small>Healthy</small></div><div><span class="ui-badge warn">Gated</span><b>app-prod</b><small>Healthy</small></div></div></div><div class="controls-ring enterprise-checklist">${slide.controls.map((control) => `<span class="control-chip">✓ ${escape(control)}</span>`).join("")}</div></div>`;
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

  function initLab() {
    initProtected();
    let active = PLATFORM.failures[0].id;
    let revealed = 0;
    const tabs = $("#scenario-tabs");
    const copy = $("#scenario-copy");
    const simulation = $("#sim");
    tabs.innerHTML = PLATFORM.failures.map((scenario, index) => `<button class="scenario-tab" data-id="${scenario.id}">${String(index + 1).padStart(2,"0")} · ${escape(scenario.title)}</button>`).join("");

    function render() {
      const scenario = PLATFORM.failures.find((item) => item.id === active);
      const steps = [["Symptom",scenario.symptom],["Evidence",scenario.evidence],["Root cause",scenario.rootCause],["Decision",scenario.decision],["Fix",scenario.fix],["Prevention",scenario.prevention]];
      $$(".scenario-tab", tabs).forEach((tab) => tab.classList.toggle("active", tab.dataset.id === active));
      copy.innerHTML = `<p class="eyebrow">Failure lab</p><h2>${escape(scenario.title)}</h2><p class="lead">Work the incident from observation to prevention.</p><p class="muted">Reveal one decision layer at a time instead of jumping straight to the fix.</p>`;
      simulation.innerHTML = `<div class="failure-timeline">${steps.map(([label,value],index) => `<article class="failure-step ${index <= revealed ? "revealed" : "locked"}"><span>${String(index + 1).padStart(2,"0")} · ${label}</span><p>${index <= revealed ? escape(value) : "Evidence hidden"}</p></article>`).join("")}</div><div class="sim-actions"><button class="btn" id="reveal" ${revealed >= steps.length - 1 ? "disabled" : ""}>${revealed >= steps.length - 1 ? "Scenario complete" : `Reveal ${steps[revealed + 1][0]}`}</button><button class="btn secondary" id="reset">Reset</button></div>`;
      $("#reveal").addEventListener("click", () => { revealed = Math.min(steps.length - 1, revealed + 1); render(); });
      $("#reset").addEventListener("click", () => { revealed = 0; render(); });
    }

    tabs.addEventListener("click", (event) => {
      if (event.target.dataset.id) {
        active = event.target.dataset.id;
        revealed = 0;
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
    const root = $("#enterprise-architecture");
    const detail = $("#component-detail");
    const controls = ["Key Vault / secrets","RBAC","Network controls","Observability"];
    root.innerHTML = `<div class="architecture-path interactive-path">${TALK.enterpriseFlow.map((item) => `<button class="node component-node" data-component="${escape(item)}">${escape(item)}</button>`).join("")}</div><div class="control-plane"><p class="eyebrow">Inspect a surrounding control</p><div class="controls-ring">${controls.map((item) => `<button class="control-chip component-node" data-component="${escape(item)}">${escape(item)}</button>`).join("")}</div></div>`;
    function show(name) {
      const component = PLATFORM.components[name] || {purpose:"Part of the reviewed delivery path.",config:"Ownership and configuration depend on the platform design.",failure:"A weak boundary can interrupt or bypass delivery."};
      $$("[data-component]",root).forEach((button) => button.classList.toggle("active",button.dataset.component === name));
      detail.innerHTML = `<p class="eyebrow">Selected component</p><h2>${escape(name)}</h2><div class="component-facts"><div><b>What it does</b><p>${escape(component.purpose)}</p></div><div><b>Configuration</b><p>${escape(component.config)}</p></div><div><b>Failure mode</b><p>${escape(component.failure)}</p></div></div>`;
    }
    root.addEventListener("click", (event) => { const button=event.target.closest("[data-component]"); if(button) show(button.dataset.component); });
    show("Argo CD");
  }

  function environmentYaml(name) {
    const env = PLATFORM.environments[name];
    return `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payments\nspec:\n  replicas: ${env.replicas}\n  template:\n    spec:\n      containers:\n        - name: payments\n          image: ${env.image}\n          resources:\n            requests:\n              cpu: ${env.cpu}\n# automated sync: ${env.autoSync}`;
  }

  function initExplorer() {
    initProtected();
    let environment = "prod";
    let activePath = "environments/prod/payments/patch.yaml";
    const tabs = $("#environment-tabs");
    const tree = $("#repo-tree");
    const code = $("#file-code");
    const meta = $("#file-meta");
    const impact = $("#file-impact");
    tabs.innerHTML = Object.keys(PLATFORM.environments).map((name) => `<button data-env="${name}">${name.toUpperCase()}</button>`).join("");
    function resolvedFiles() {
      return PLATFORM.files.map((file) => file.template ? {...file,path:file.path.replace("{env}",environment),content:environmentYaml(environment)} : file);
    }
    function renderTree() {
      const files = resolvedFiles();
      if (!files.some((file) => file.path === activePath)) activePath = `environments/${environment}/payments/patch.yaml`;
      tree.innerHTML = `<div class="tree-root">gitops/</div>${files.map((file) => `<button class="tree-file ${file.path === activePath ? "active" : ""}" data-path="${escape(file.path)}"><span>◇</span>${escape(file.path)}</button>`).join("")}`;
      $$("[data-env]",tabs).forEach((button) => button.classList.toggle("active",button.dataset.env === environment));
      const file = files.find((item) => item.path === activePath);
      meta.innerHTML = `<span>gitops / ${escape(file.path)}</span><span class="ui-badge ok">${environment.toUpperCase()}</span>`;
      code.textContent = file.content;
      impact.innerHTML = `<div><b>What Argo reads</b><p>${escape(file.role)}</p></div><div><b>What failure looks like</b><p>${escape(file.failure)}</p></div>`;
    }
    tabs.addEventListener("click", (event) => { if(event.target.dataset.env){ environment=event.target.dataset.env; activePath=`environments/${environment}/payments/patch.yaml`; renderTree(); }});
    tree.addEventListener("click", (event) => { const button=event.target.closest("[data-path]"); if(button){ activePath=button.dataset.path; renderTree(); }});
    renderTree();
  }

  function initDiff() {
    initProtected();
    let active = PLATFORM.diffs[0].id;
    const tabs = $("#diff-tabs");
    const workbench = $("#diff-workbench");
    tabs.innerHTML = PLATFORM.diffs.map((item) => `<button class="scenario-tab" data-id="${item.id}">${escape(item.label)}</button>`).join("");
    function render() {
      const item = PLATFORM.diffs.find((candidate) => candidate.id === active);
      $$(".scenario-tab",tabs).forEach((button) => button.classList.toggle("active",button.dataset.id === active));
      const changed = item.desired !== item.actual;
      const diff = changed ? `<span class="diff-minus">- ${escape(item.actual)}</span>\n<span class="diff-plus">+ ${escape(item.desired)}</span>` : `<span class="diff-neutral">No Kubernetes object diff</span>`;
      workbench.innerHTML = `<div class="diff-header"><div><span class="mock-logo">ARGO CD DIFF</span><b>${escape(item.label)}</b></div><span class="ui-badge ${changed ? "warn" : "ok"}">${escape(item.status)}</span></div><div class="diff-columns"><article><span>GIT · DESIRED</span><pre>${escape(item.desired)}</pre></article><article><span>CLUSTER · ACTUAL</span><pre>${escape(item.actual)}</pre></article></div><pre class="unified-diff">${diff}</pre><div class="diff-explanation"><b>${changed ? "Drift detected" : "Objects match; investigate outside desired state"}</b><p>${escape(item.reason)}</p><a class="btn secondary" href="../demo/">Open reconciliation demo →</a></div>`;
    }
    tabs.addEventListener("click", (event) => { if(event.target.dataset.id){ active=event.target.dataset.id; render(); }});
    render();
  }

  function initLearning() {
    initProtected();
    const PROGRESS_KEY = "dostikube-learning-progress";
    const tracks = PLATFORM.learningTracks || [];
    const challenges = PLATFORM.challenges || {};
    const readiness = PLATFORM.readiness || [];
    const allModules = tracks.flatMap((track) => track.modules);
    const summary = $("#learning-summary");
    const tabs = $("#track-tabs");
    const workbench = $("#track-workbench");
    const checklist = $("#readiness-checklist");
    let activeTrack = tracks[0] ? tracks[0].id : "";
    let progress = {completed:[],answers:{},readiness:[]};

    try {
      progress = {...progress,...JSON.parse(sessionStorage.getItem(PROGRESS_KEY) || "{}")};
    } catch (_) {
      sessionStorage.removeItem(PROGRESS_KEY);
    }

    function save() {
      sessionStorage.setItem(PROGRESS_KEY,JSON.stringify(progress));
    }

    function renderSummary() {
      const correct = Object.entries(progress.answers).filter(([id,index]) => challenges[id] && challenges[id].choices[index] && challenges[id].choices[index].correct).length;
      const total = allModules.length + Object.keys(challenges).length + readiness.length;
      const points = progress.completed.length + correct + progress.readiness.length;
      const percent = total ? Math.round((points / total) * 100) : 0;
      const weakAreas = Object.entries(progress.answers).filter(([id,index]) => challenges[id] && challenges[id].choices[index] && !challenges[id].choices[index].correct).map(([id]) => challenges[id].competency);
      summary.innerHTML = `<div class="progress-copy"><span class="eyebrow">Session progress</span><strong>${percent}%</strong><div class="progress-track"><span style="width:${percent}%"></span></div></div><div class="learning-stats"><div><b>${progress.completed.length}/${allModules.length}</b><span>modules</span></div><div><b>${correct}/${Object.keys(challenges).length}</b><span>decisions</span></div><div><b>${progress.readiness.length}/${readiness.length}</b><span>controls</span></div></div><div class="weak-area"><span>Review focus</span><b>${weakAreas.length ? escape([...new Set(weakAreas)].join(" · ")) : "No weak area recorded yet"}</b></div><button class="text-button reset-progress" id="reset-progress">Reset session progress</button>`;
      $("#reset-progress").addEventListener("click", () => {
        progress = {completed:[],answers:{},readiness:[]};
        save();
        renderAll();
      });
    }

    function renderTabs() {
      tabs.innerHTML = tracks.map((track) => {
        const complete = track.modules.filter((module) => progress.completed.includes(module.id)).length;
        return `<button class="track-tab ${track.id === activeTrack ? "active" : ""}" data-track="${escape(track.id)}"><span>${escape(track.role)}</span><b>${escape(track.title)}</b><small>${complete}/${track.modules.length} complete</small></button>`;
      }).join("");
    }

    function renderWorkbench() {
      const track = tracks.find((candidate) => candidate.id === activeTrack);
      if (!track) return;
      const challenge = challenges[track.challenge];
      const selected = progress.answers[track.challenge];
      const answered = selected !== undefined;
      workbench.innerHTML = `<div class="track-heading"><div><p class="eyebrow">${escape(track.role)} track</p><h2>${escape(track.title)}</h2><p>${escape(track.summary)}</p></div><span class="track-count">${track.modules.filter((module) => progress.completed.includes(module.id)).length} / ${track.modules.length}</span></div><div class="learning-grid"><div class="learning-modules">${track.modules.map((module,index) => {
        const done = progress.completed.includes(module.id);
        return `<article class="learning-module ${done ? "complete" : ""}"><span>${String(index + 1).padStart(2,"0")} · ${escape(module.tool)}</span><h3>${escape(module.title)}</h3><p>${escape(module.outcome)}</p><div><a href="${escape(module.route)}">Open tool →</a><button data-module="${escape(module.id)}">${done ? "✓ Completed" : "Mark complete"}</button></div></article>`;
      }).join("")}</div><article class="challenge-panel"><p class="eyebrow">Decision challenge · ${escape(challenge.competency)}</p><h3>${escape(challenge.prompt)}</h3><div class="challenge-choices">${challenge.choices.map((choice,index) => `<button class="challenge-choice ${answered && selected === index ? (choice.correct ? "correct" : "wrong") : ""}" data-choice="${index}">${escape(choice.text)}</button>`).join("")}</div>${answered ? `<div class="challenge-outcome ${challenge.choices[selected].correct ? "correct" : "wrong"}"><b>${challenge.choices[selected].correct ? "Strong decision" : "Operational risk"}</b><p>${escape(challenge.choices[selected].outcome)}</p></div>` : `<p class="challenge-hint">Choose the next action before the consequence is revealed.</p>`}</article></div>`;
      $$('[data-module]',workbench).forEach((button) => button.addEventListener("click", () => {
        const id = button.dataset.module;
        progress.completed = progress.completed.includes(id) ? progress.completed.filter((item) => item !== id) : [...progress.completed,id];
        save();
        renderAll();
      }));
      $$('[data-choice]',workbench).forEach((button) => button.addEventListener("click", () => {
        progress.answers[track.challenge] = Number(button.dataset.choice);
        save();
        renderAll();
      }));
    }

    function renderReadiness() {
      checklist.innerHTML = `<div class="readiness-heading"><div><p class="eyebrow">Production readiness</p><h2>Can the operating model carry production?</h2></div><span>${progress.readiness.length} / ${readiness.length}</span></div><div class="readiness-grid">${readiness.map((item,index) => `<button class="readiness-item ${progress.readiness.includes(index) ? "checked" : ""}" data-readiness="${index}"><span>${progress.readiness.includes(index) ? "✓" : "○"}</span>${escape(item)}</button>`).join("")}</div>`;
      $$('[data-readiness]',checklist).forEach((button) => button.addEventListener("click", () => {
        const index = Number(button.dataset.readiness);
        progress.readiness = progress.readiness.includes(index) ? progress.readiness.filter((item) => item !== index) : [...progress.readiness,index];
        save();
        renderAll();
      }));
    }

    function renderAll() {
      renderSummary();
      renderTabs();
      renderWorkbench();
      renderReadiness();
    }

    tabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-track]");
      if (button) {
        activeTrack = button.dataset.track;
        renderAll();
      }
    });
    renderAll();
  }

  window.Dosti = {initAccess, initProtected, initPresentation, initLab, initDemo, initArchitecture, initExplorer, initDiff, initLearning};
})();
