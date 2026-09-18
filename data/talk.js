window.DOSTI_TALK = {
  title: "GitOps in the Real World",
  subtitle: "Lessons from Operating Kubernetes with Argo CD",
  primaryFlow: ["Developer", "Git repository", "GitOps manifests", "Argo CD Application", "Kubernetes cluster"],
  enterpriseFlow: ["Developers", "GitHub Enterprise", "Pull Request", "Branch Protection", "CI / Security / Policy", "GitOps Repository", "Argo CD", "DEV", "TEST", "PROD"],
  controls: ["Entra ID", "RBAC", "Key Vault / secrets", "Network controls", "Monitoring", "Audit logs", "Observability"],
  deploymentManifest: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payments
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: payments
          image: registry.example.com/payments:v42`,
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
    {name:"path",value:"Manifest directory in Git"},
    {name:"destination",value:"Target Kubernetes API"},
    {name:"namespace",value:"Workload namespace"},
    {name:"syncPolicy",value:"How drift is corrected"}
  ],
  slides: [
    {id:"opening",eyebrow:"DostiKube / field session",title:"GitOps in the Real World",lead:"Operate Kubernetes through reviewed intent, continuous comparison, and explicit recovery.",kind:"hero",notes:"Open with one question: how does reviewed intent become running state?",yaml:"Git        = desired state\nKubernetes = actual state\nArgo CD    = reconciliation",source:"https://argo-cd.readthedocs.io/en/stable/"},
    {id:"why",eyebrow:"01 / Why GitOps",title:"Production needs an answer to: who changed what?",lead:"GitOps turns competing write paths into a reviewable operating flow.",kind:"why",notes:"GitOps improves change control and recovery, but only when teams agree on the path into Git.",yaml:"before: kubectl + pipelines + manual patches\nafter:  review → desired state → reconciliation",source:"https://argo-cd.readthedocs.io/en/stable/getting_started/"},
    {id:"source",eyebrow:"02 / Source of truth",title:"Git holds the state we reviewed.",lead:"A pull request records the manifest change, validation evidence, approver, and rollback point.",kind:"github",notes:"Git is the desired-state source. It does not prove that the cluster is healthy; Argo and observability provide that evidence.",yaml:"",source:"https://argo-cd.readthedocs.io/en/stable/user-guide/application-specification/"},
    {id:"git-to-argo",eyebrow:"03 / Git → Argo CD",title:"Connect one Git path to one Kubernetes destination.",lead:"Argo CD watches the reviewed manifests, compares them with the cluster, and exposes the gap.",kind:"primary-flow",flow:["Developer","Git repository","GitOps manifests","Argo CD Application","Kubernetes cluster"],notes:"The Application resource is the binding between a source path and a destination.",yaml:"Developer → Git → manifests → Application → cluster",source:"https://argo-cd.readthedocs.io/en/stable/getting_started/"},
    {id:"application",eyebrow:"04 / Create Application",title:"Tell Argo CD what to read—and where to apply it.",lead:"The Application resource binds a Git revision and path to a Kubernetes destination.",kind:"application",notes:"Walk through source first, destination second, and automation last. The example endpoints are illustrative.",yaml:"",source:"https://argo-cd.readthedocs.io/en/stable/user-guide/application-specification/"},
    {id:"sync",eyebrow:"05 / Sync & Reconcile",title:"Synced and healthy answer different questions.",lead:"Synced means Kubernetes matches Git. Healthy means the workload is operating successfully.",kind:"synced-state",notes:"A workload may be synced but unhealthy. Keep desired-state agreement separate from runtime health.",yaml:"Git:        replicas: 3\nKubernetes: replicas: 3\nArgo:       Synced / Healthy",source:"https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/"},
    {id:"drift",eyebrow:"06 / Drift demo",title:"A manual cluster change creates a visible gap.",lead:"Git still says three. Kubernetes now runs one. Argo CD reports OutOfSync until reconciliation restores intent.",kind:"drift-state",notes:"Open Sync & Reconcile and run the 3 → 1 → 3 transition.",yaml:"Git:        replicas: 3\nKubernetes: replicas: 1\nArgo:       OutOfSync",source:"https://argo-cd.readthedocs.io/en/stable/user-guide/sync-options/"},
    {id:"enterprise",eyebrow:"07 / Enterprise architecture",title:"Argo CD operates inside a larger control system.",lead:"Identity, review, policy, secrets, network controls, evidence, and observability make reconciliation safe.",kind:"enterprise",flow:["Developers","GitHub Enterprise","Pull Request","Branch Protection","CI / Security / Policy","GitOps Repository","Argo CD","DEV","TEST","PROD"],controls:["Entra ID","RBAC","Key Vault / secrets","Network controls","Monitoring","Audit logs","Observability"],notes:"The operating model defines who may change desired state and how change reaches each environment.",yaml:"GitOps is an operating model,\nnot just installing Argo CD.",source:"https://argo-cd.readthedocs.io/en/latest/user-guide/application-set-ui/"}
  ],
  scenarios: [
    {id:"drift",label:"01",title:"Configuration drift",summary:"Git wants three replicas. The cluster has one.",lesson:"Reconciliation moves observed state back toward reviewed desired state."},
    {id:"image",label:"02",title:"Bad image release",summary:"A merged image reaches Kubernetes and fails its health check.",lesson:"Argo can keep applying a bad desired state. Promotion and rollback ownership belong in the operating model."},
    {id:"manual",label:"03",title:"Manual production change",summary:"A kubectl patch makes production differ from Git.",lesson:"Detection, audit, and reconciliation turn an invisible change into an explicit event."},
    {id:"secret",label:"04",title:"Expired secret",summary:"The Deployment appears healthy, but the application cannot authenticate.",lesson:"GitOps does not automatically solve secret expiry, identity issues, networking, or application bugs."}
  ]
};
