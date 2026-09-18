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

  function visual(slide) {
    if (slide.kind === "chaos") return `<div class="diagram chaos-grid">${slide.points.map(node).join("")}</div>`;
    if (slide.kind === "flow" || slide.kind === "primary-flow") return `<div class="diagram">${flowMarkup(slide.flow)}<div class="legend"><div><b>Git</b>desired state</div><div><b>Kubernetes</b>actual state</div><div><b>Argo CD</b>reconciliation</div></div></div>`;
    if (slide.kind === "application") return `<div class="application-layout"><pre class="terminal application-yaml">${escape(TALK.applicationManifest)}</pre><div class="field-guide">${TALK.applicationFields.map((field) => `<div><code>${escape(field.name)}</code><span>${escape(field.value)}</span></div>`).join("")}</div></div>`;
    if (slide.kind === "synced-state" || slide.kind === "drift-state") {
      const synced = slide.kind === "synced-state";
      return `<div class="diagram"><span class="badge ${synced ? "good" : "bad"}">ARGO CD · ${synced ? "SYNCED / HEALTHY" : "OUT OF SYNC"}</span><div class="state-grid"><div class="state-card"><strong>Git · desired</strong><code>replicas: 3</code></div><div class="state-card"><strong>Kubernetes · actual</strong><code>replicas: ${synced ? "3" : "1"}</code></div></div></div>`;
    }
    if (slide.kind === "states") return `<div class="diagram state-comparison"><div class="state-card"><strong>Git · desired</strong><code>replicas: 3</code></div><div class="reconcile-loop">observe<br>↻<br>reconcile</div><div class="state-card"><strong>Kubernetes · actual</strong><code>replicas: 1</code></div></div>`;
    if (slide.kind === "enterprise") return `<div class="diagram">${flowMarkup(slide.flow)}<div class="controls-ring">${slide.controls.map((control) => `<span class="control-chip">${escape(control)}</span>`).join("")}</div></div>`;
    if (slide.kind === "lab") return `<div class="diagram"><pre class="terminal">${escape(slide.yaml)}</pre><a class="btn amber lab-link" href="../lab/">Open failure lab →</a></div>`;
    return `<div class="diagram"><pre class="terminal">${escape(slide.yaml)}</pre></div>`;
  }

  function slideMarkup(slide) {
    return `<div class="slide-inner"><p class="eyebrow">${escape(slide.eyebrow)}</p><h1>${escape(slide.title)}</h1><p class="lead">${escape(slide.lead)}</p>${visual(slide)}</div>`;
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
    drift: {status:"OUT OF SYNC",good:false,git:"replicas: 3",cluster:"replicas: 1",log:["Drift detected: replicas differ from Git."],action:"Reconcile"},
    image: {status:"PR READY",good:false,git:"image: app:v41",cluster:"image: app:v41 · HEALTHY",log:["PR proposes image: app:v42"],action:"Merge and sync"},
    manual: {status:"SYNCED",good:true,git:"limits.cpu: 500m",cluster:"limits.cpu: 500m",log:["No drift detected."],action:"Run kubectl change"},
    secret: {status:"SYNCED / APP ERROR",good:false,git:"Deployment: Healthy",cluster:"Authentication: failed",log:["Pod readiness: passing","Application authentication: failed","Credential: expired"],action:"Inspect evidence"}
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
        Object.assign(state, {status:"SYNCED / HEALTHY",good:true,cluster:"replicas: 3",action:"Reconciled"});
        state.log.push("Argo applied replicas: 3.", "Health check passed.");
      }
      if (active === "image") {
        Object.assign(state, {status:"DEGRADED",git:"image: app:v42",cluster:"image: app:v42 · health check failed",action:"Retry rollout"});
        state.log.push("PR merged.", "Argo synced app:v42.", "Kubernetes health check failed.", "Decision required: rollback or gate promotion.");
      }
      if (active === "manual") {
        if (state.status === "SYNCED") {
          Object.assign(state, {status:"OUT OF SYNC",good:false,cluster:"limits.cpu: 100m",action:"Reconcile"});
          state.log.push("kubectl changed production.", "Audit event recorded.", "Drift detected.");
        } else {
          Object.assign(state, {status:"SYNCED / HEALTHY",good:true,cluster:"limits.cpu: 500m",action:"Reconciled"});
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
      comparison.innerHTML = `<span class="badge ${synced ? "good" : "bad"}">ARGO CD · ${synced ? "SYNCED / HEALTHY" : "OUT OF SYNC"}</span><div class="state-grid"><div class="state-card"><strong>Git · desired state</strong><code>replicas: 3</code></div><div class="state-card"><strong>Kubernetes · actual state</strong><code>replicas: ${clusterReplicas}</code></div></div>`;
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
      events.innerHTML += "<div>› Argo CD reapplied replicas: 3.</div><div>› Application returned to SYNCED / HEALTHY.</div>";
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
