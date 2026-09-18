window.DOSTI_TALK = {
  title: "GitOps in the Real World",
  subtitle: "Lessons from Operating Kubernetes with Argo CD",
  primaryFlow: ["Developer", "Git repository", "GitOps manifests", "Argo CD Application", "Kubernetes cluster"],
  enterpriseFlow: ["Developers", "GitHub Enterprise", "Pull Request", "Branch Protection", "CI / Security / Policy", "GitOps Repository", "Argo CD", "DEV", "TEST", "PROD"],
  controls: ["Entra ID", "RBAC", "Key Vault / secrets", "Network controls", "Monitoring", "Audit logs", "Observability"],
  applicationManifest: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: payments
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.example.com/platform/gitops-config.git
    targetRevision: main
    path: environments/prod/payments
  destination:
    server: https://kubernetes.default.svc
    namespace: payments
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true`,
  applicationFields: [
    {name:"repoURL",value:"Repository Argo CD reads"},
    {name:"targetRevision",value:"Branch, tag, or commit"},
    {name:"path",value:"Manifest directory in Git"},
    {name:"destination",value:"Target Kubernetes API"},
    {name:"namespace",value:"Workload namespace"},
    {name:"syncPolicy",value:"How drift is corrected"}
  ],
  slides: [
    {id:"opening",eyebrow:"DostiKube / field session",title:"GitOps in the Real World",lead:"Lessons from operating Kubernetes with Argo CD.",kind:"hero",notes:"Open with one question: how does reviewed intent become running state?",yaml:"Git        = desired state\nKubernetes = actual state\nArgo CD    = reconciliation"},
    {id:"git-to-argo",eyebrow:"01 / Git → Argo CD",title:"Give Argo CD one reviewed source of truth.",lead:"A developer changes manifests in Git. An Argo CD Application connects that path to a cluster.",kind:"primary-flow",flow:["Developer","Git repository","GitOps manifests","Argo CD Application","Kubernetes cluster"],notes:"Separate application source code from deployable desired state when that improves ownership and promotion.",yaml:"Developer → Git → manifests → Application → cluster"},
    {id:"application",eyebrow:"02 / Create Application",title:"Tell Argo CD what to read—and where to apply it.",lead:"The Application resource binds a Git revision and path to a Kubernetes destination.",kind:"application",notes:"Walk through source first, destination second, and automation last. The example endpoints are illustrative.",yaml:""},
    {id:"sync",eyebrow:"03 / Sync & Reconcile",title:"Compare desired state with actual state.",lead:"When both sides match, Argo CD reports SYNCED / HEALTHY.",kind:"synced-state",notes:"Healthy describes runtime health. Synced describes agreement with Git. They answer different questions.",yaml:"Git:        replicas: 3\nKubernetes: replicas: 3\nArgo:       SYNCED / HEALTHY"},
    {id:"drift",eyebrow:"04 / Drift",title:"A manual cluster change creates a visible gap.",lead:"Git still says three. Kubernetes now runs one. Argo CD reports OUT OF SYNC.",kind:"drift-state",notes:"Use the interactive Sync & Reconcile view to apply the manual change and restore desired state.",yaml:"Git:        replicas: 3\nKubernetes: replicas: 1\nArgo:       OUT OF SYNC"},
    {id:"enterprise",eyebrow:"05 / Enterprise architecture",title:"Argo CD operates inside a larger control system.",lead:"Identity, review, policy, secrets, network controls, evidence, and observability make reconciliation safe.",kind:"enterprise",flow:["Developers","GitHub Enterprise","Pull Request","Branch Protection","CI / Security / Policy","GitOps Repository","Argo CD","DEV","TEST","PROD"],controls:["Entra ID","RBAC","Key Vault / secrets","Network controls","Monitoring","Audit logs","Observability"],notes:"The operating model surrounds Argo CD. It defines who can change desired state and how change reaches each environment.",yaml:"GitOps is an operating model,\nnot just installing Argo CD."
    }
  ],
  scenarios: [
    {id:"drift",label:"01",title:"Configuration drift",summary:"Git wants three replicas. The cluster has one.",lesson:"Reconciliation moves observed state back toward reviewed desired state."},
    {id:"image",label:"02",title:"Bad image release",summary:"A merged image reaches Kubernetes and fails its health check.",lesson:"Argo can keep applying a bad desired state. Promotion and rollback ownership belong in the operating model."},
    {id:"manual",label:"03",title:"Manual production change",summary:"A kubectl patch makes production differ from Git.",lesson:"Detection, audit, and reconciliation turn an invisible change into an explicit event."},
    {id:"secret",label:"04",title:"Expired secret",summary:"The Deployment appears healthy, but the application cannot authenticate.",lesson:"GitOps does not automatically solve secret expiry, identity issues, networking, or application bugs."}
  ]
};
