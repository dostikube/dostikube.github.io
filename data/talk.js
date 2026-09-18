window.DOSTI_TALK = {
  code: "GITOPS26",
  title: "GitOps in the Real World",
  subtitle: "Lessons from Operating Kubernetes with Argo CD",
  audienceUrl: "https://dostikube.github.io/live/",
  slides: [
    {
      id: "opening", eyebrow: "DostiKube / field session", title: "GitOps in the Real World", lead: "Lessons from operating Kubernetes with Argo CD.", kind: "hero",
      notes: "Open with the operational problem. This session is about ownership, controls and recovery—not an Argo CD feature tour.",
      yaml: "# The question\nwho decides what production should be?"
    },
    {
      id: "before", eyebrow: "01 / Before GitOps", title: "Five ways to change a cluster. No single answer.", lead: "Every path can be valid. Together they create ambiguity.", kind: "chaos",
      points: ["developers → kubectl", "CI → direct deploy", "operator → manual patch", "old manifest → forgotten", "cluster → drift"],
      notes: "Ask the room which path owns the truth after an incident. Emphasize that the problem is competing write paths, not kubectl itself.",
      yaml: "$ kubectl scale deploy/api --replicas=1\n$ pipeline deploy --env prod\n# which change wins?"
    },
    {
      id: "model", eyebrow: "02 / Operating model", title: "Make change travel through one inspectable path.", lead: "Git says what should exist. The cluster says what does exist. Argo CD closes the gap.", kind: "flow",
      flow: ["Developer", "Feature branch", "Pull request", "Validation", "Protected main", "Desired state", "Argo CD", "Kubernetes"],
      notes: "Pause at protected main. GitOps depends on the quality of the path into Git. Reconciliation is useful only when desired state is trustworthy.",
      yaml: "Git      = desired state\nCluster  = actual state\nArgo CD  = reconciliation loop"
    },
    {
      id: "enterprise", eyebrow: "03 / Enterprise architecture", title: "Argo CD is one component in the control system.", lead: "Identity, policy, promotion and evidence determine whether reconciliation is safe.", kind: "enterprise",
      flow: ["Developers", "GitHub Enterprise", "Pull requests", "CI · security · policy", "Config repository", "Argo CD", "DEV · TEST · STAGING · PROD"],
      controls: ["Entra ID", "RBAC", "Secrets", "Policy", "Audit logs", "Monitoring", "Network controls", "Observability"],
      notes: "The architecture is deliberately wider than Argo. Call out environment promotion, separation of duties, secrets lifecycle and auditability.",
      yaml: "promotion:\n  dev: automatic\n  test: validated\n  staging: approved\n  prod: gated"
    },
    {
      id: "lab", eyebrow: "04 / Enter lab", title: "See it in the real world.", lead: "Four incidents. One operating model. Several decisions Argo CD cannot make for you.", kind: "lab",
      notes: "Move into the lab. Let participants predict the outcome before pressing each action.",
      yaml: "drift · bad image · expired secret · manual change"
    }
  ],
  scenarios: [
    { id: "drift", label: "Scenario A", title: "Configuration drift", summary: "Git wants three replicas. The cluster has one.", lesson: "Reconciliation is the useful part of GitOps: observed state moves back toward reviewed desired state." },
    { id: "image", label: "Scenario B", title: "Bad image deployment", summary: "A merged image change reaches Kubernetes and fails its health check.", lesson: "A reconciler can keep applying a bad desired state. Promotion and rollback ownership must be designed." },
    { id: "secret", label: "Scenario C", title: "Expired secret", summary: "The Deployment is healthy. The application cannot authenticate.", lesson: "GitOps controls declared configuration. It does not renew credentials or diagnose every dependency." },
    { id: "manual", label: "Scenario D", title: "Manual production change", summary: "A direct kubectl patch makes production differ from Git.", lesson: "Detection, audit and reconciliation turn an invisible change into an explicit event." }
  ]
};
