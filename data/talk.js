window.DOSTI_TALK = {
  title: "GitOps in the Real World",
  subtitle: "Lessons from Operating Kubernetes with Argo CD",
  deliveryFlow: ["Developer", "Feature branch", "Pull Request", "CI validation", "Security / policy", "Protected main", "Git configuration repository", "Argo CD", "Kubernetes"],
  enterpriseFlow: ["Developers", "GitHub Enterprise", "Pull Request", "Branch protection", "CI/CD checks", "GitOps repository", "Argo CD", "DEV", "TEST", "STAGING", "PROD"],
  controls: ["Entra ID", "RBAC", "Secrets management", "Network controls", "Policy", "Audit logging", "Monitoring", "Observability", "Change management"],
  slides: [
    {id:"opening",eyebrow:"DostiKube / field session",title:"GitOps in the Real World",lead:"Lessons from operating Kubernetes with Argo CD.",kind:"hero",notes:"Frame GitOps as an operating model for controlled change and recovery.",yaml:"# The operating question\nwho decides what production should be?"},
    {id:"before",eyebrow:"01 / Before GitOps",title:"Five ways to change a cluster. No single answer.",lead:"Direct kubectl, independent pipelines, manual patches, stale manifests, and drift compete for control.",kind:"chaos",points:["developer → kubectl","CI → direct deploy","operator → manual patch","manifest → forgotten","cluster → drift"],notes:"The risk is competing write paths and an unclear source of truth.",yaml:"$ kubectl scale deploy/api --replicas=1\n$ pipeline deploy --env prod\n# which change wins?"},
    {id:"flow",eyebrow:"02 / Reviewed change",title:"Make change travel through one inspectable path.",lead:"Every production change gains an owner, evidence, and a rollback point.",kind:"flow",flow:["Developer","Feature branch","Pull Request","CI validation","Security / policy","Protected main","Git config repo","Argo CD","Kubernetes"],notes:"Pause at protected main: reconciliation is safe only when desired state is trustworthy.",yaml:"Git        = desired state\nKubernetes = actual state\nArgo CD    = reconciliation"},
    {id:"model",eyebrow:"03 / Reconciliation",title:"Desired and actual state are allowed to disagree—briefly.",lead:"Argo CD continuously observes the gap and makes it visible before it acts.",kind:"states",notes:"Reconciliation is the mechanism. Policy determines when and where it may act.",yaml:"desired: replicas: 3\nactual:  replicas: 1\nstatus:  OUT OF SYNC"},
    {id:"enterprise",eyebrow:"04 / Enterprise architecture",title:"Argo CD is one component in the control system.",lead:"Identity, policy, promotion, evidence, and operations surround the deployment path.",kind:"enterprise",flow:["Developers","GitHub Enterprise","PR","Branch protection","CI/CD checks","GitOps repo","Argo CD","DEV","TEST","STAGING","PROD"],controls:["Entra ID","RBAC","Secrets","Network controls","Policy","Audit logging","Monitoring","Observability","Change management"],notes:"Show separation of duties, environment promotion, secrets lifecycle, and audit evidence.",yaml:"promotion:\n  dev: automatic\n  test: validated\n  staging: approved\n  prod: gated"},
    {id:"lab",eyebrow:"05 / Operate",title:"See what reconciliation can—and cannot—fix.",lead:"Drift, a bad image, a manual patch, and an expired secret require different decisions.",kind:"lab",notes:"Open the lab and ask the room to predict each outcome.",yaml:"drift · bad image · manual change · expired secret"}
  ],
  scenarios: [
    {id:"drift",label:"01",title:"Configuration drift",summary:"Git wants three replicas. The cluster has one.",lesson:"Reconciliation moves observed state back toward reviewed desired state."},
    {id:"image",label:"02",title:"Bad image release",summary:"A merged image reaches Kubernetes and fails its health check.",lesson:"Argo can keep applying a bad desired state. Promotion and rollback ownership belong in the operating model."},
    {id:"manual",label:"03",title:"Manual production change",summary:"A kubectl patch makes production differ from Git.",lesson:"Detection, audit, and reconciliation turn an invisible change into an explicit event."},
    {id:"secret",label:"04",title:"Expired secret",summary:"The Deployment appears healthy, but the application cannot authenticate.",lesson:"GitOps does not automatically solve secret expiry, identity issues, networking, or application bugs."}
  ],
  demoSteps: [
    {label:"Feature branch",event:"Developer updates image to app:v42."},
    {label:"Pull Request",event:"Review opens with the configuration diff."},
    {label:"CI / policy",event:"Syntax, security, and policy checks pass."},
    {label:"Protected main",event:"Reviewed change merges to the trusted branch."},
    {label:"Argo CD",event:"Desired state change is detected and synced."},
    {label:"Kubernetes",event:"Rollout becomes healthy at replicas: 3."}
  ]
};
