window.DOSTI_PLATFORM = {
  environments: {
    dev: {replicas:1,image:"payments:v43-dev",cpu:"100m",autoSync:"true"},
    test: {replicas:2,image:"payments:v42",cpu:"250m",autoSync:"true"},
    prod: {replicas:3,image:"payments:v42",cpu:"500m",autoSync:"false"}
  },
  files: [
    {path:"apps/payments/base/deployment.yaml",role:"Shared workload base",failure:"A bad base affects every overlay.",content:`apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payments\nspec:\n  template:\n    spec:\n      containers:\n        - name: payments\n          image: payments:v42\n          resources:\n            requests:\n              cpu: 250m`},
    {path:"environments/{env}/payments/patch.yaml",role:"Environment-specific desired state",failure:"The wrong overlay can promote unsafe values.",template:true},
    {path:"argocd/applications/payments.yaml",role:"Binds a Git path to a cluster destination",failure:"A wrong path or destination targets the wrong state.",content:`apiVersion: argoproj.io/v1alpha1\nkind: Application\nmetadata:\n  name: payments-prod\nspec:\n  source:\n    repoURL: https://github.example.com/platform/gitops.git\n    targetRevision: main\n    path: environments/prod/payments\n  destination:\n    server: https://kubernetes.default.svc\n    namespace: payments`},
    {path:"argocd/applicationsets/payments-environments.yaml",role:"Generates one Application per environment",failure:"Generator mistakes can fan out across clusters.",content:`apiVersion: argoproj.io/v1alpha1\nkind: ApplicationSet\nmetadata:\n  name: payments-environments\nspec:\n  generators:\n    - list:\n        elements:\n          - env: dev\n          - env: test\n          - env: stage\n          - env: prod\n  template:\n    metadata:\n      name: payments-{{env}}`},
    {path:"policies/require-resources.yaml",role:"Rejects workloads without resource requests",failure:"A missing policy lets risky desired state reach Git.",content:`apiVersion: kyverno.io/v1\nkind: ClusterPolicy\nmetadata:\n  name: require-resources\nspec:\n  validationFailureAction: Enforce\n  rules:\n    - name: require-cpu-memory\n      validate:\n        message: Resource requests are required.`}
  ],
  diffs: [
    {id:"replicas",label:"Replicas",status:"OutOfSync",desired:"replicas: 3",actual:"replicas: 1",reason:"A manual scale changed live state."},
    {id:"image",label:"Image tag",status:"OutOfSync",desired:"image: payments:v42",actual:"image: payments:latest",reason:"The cluster runs an unreviewed mutable tag."},
    {id:"limits",label:"Resource limit",status:"OutOfSync",desired:"cpu: 500m",actual:"cpu: 100m",reason:"An operator reduced the production CPU limit."},
    {id:"env",label:"Environment variable",status:"OutOfSync",desired:"LOG_LEVEL: info",actual:"LOG_LEVEL: debug",reason:"Runtime configuration differs from Git."},
    {id:"ingress",label:"Ingress host",status:"OutOfSync",desired:"host: payments.example.com",actual:"host: payments.internal",reason:"The live route points to the wrong hostname."},
    {id:"secret",label:"Secret reference",status:"Synced / runtime risk",desired:"secretKeyRef: payments-db",actual:"secretKeyRef: payments-db",reason:"Objects match, but the referenced credential may still be expired."}
  ],
  failures: [
    {id:"image",title:"Bad image tag",symptom:"Pods enter ImagePullBackOff.",evidence:"Registry returns manifest unknown for payments:v99.",rootCause:"The desired image tag does not exist.",decision:"Block promotion and keep the stable revision serving traffic.",fix:"Revert the image tag in Git and merge through review.",prevention:"Validate image existence and signatures before merge."},
    {id:"manifest",title:"Broken manifest",symptom:"Argo reports ComparisonError.",evidence:"YAML parser points to an invalid mapping on line 18.",rootCause:"The committed manifest is syntactically invalid.",decision:"Stop sync; do not bypass validation.",fix:"Correct the manifest and merge a new commit.",prevention:"Run schema and render validation in CI."},
    {id:"namespace",title:"Missing namespace",symptom:"Resources cannot be created.",evidence:"Kubernetes returns namespaces “payments” not found.",rootCause:"The destination namespace was never provisioned.",decision:"Create it through the owned platform path.",fix:"Add the namespace resource or approved CreateNamespace sync option.",prevention:"Validate destination prerequisites before promotion."},
    {id:"readiness",title:"Failing readiness probe",symptom:"Rollout stalls with zero ready endpoints.",evidence:"Probe receives HTTP 503 from /ready.",rootCause:"The new version cannot satisfy its readiness contract.",decision:"Abort promotion and preserve the stable ReplicaSet.",fix:"Repair the application or probe configuration, then redeploy.",prevention:"Exercise probes in pre-production and canary analysis."},
    {id:"secret",title:"Wrong secret reference",symptom:"Application starts but cannot authenticate.",evidence:"Pod event reports secret payments-db-v2 not found.",rootCause:"The manifest references a secret that was not synchronized.",decision:"Check ownership before creating credentials manually.",fix:"Correct the reference or restore the external secret flow.",prevention:"Validate secret references and rotation dependencies."},
    {id:"rbac",title:"RBAC denied",symptom:"Argo cannot apply a resource.",evidence:"API server returns forbidden for serviceaccount argocd-application-controller.",rootCause:"The controller lacks permission in the target namespace.",decision:"Do not grant broad cluster-admin access.",fix:"Add the narrow required role and binding through review.",prevention:"Test least-privilege permissions per project and destination."},
    {id:"policy",title:"Policy violation",symptom:"Admission rejects the Deployment.",evidence:"Policy require-resources reports missing memory limit.",rootCause:"Desired state violates the cluster admission policy.",decision:"Fix the workload instead of bypassing enforcement.",fix:"Add reviewed resource requests and limits in Git.",prevention:"Run the same policy checks in pull requests."},
    {id:"health",title:"Failed health check",symptom:"Argo is Synced while the application is Degraded.",evidence:"Deployment has unavailable replicas and error-rate alerts fire.",rootCause:"Git accurately describes a version that does not operate correctly.",decision:"Abort or revert; reconciliation alone cannot help.",fix:"Move desired state to the known-good revision.",prevention:"Gate promotion on health and service-level metrics."},
    {id:"patch",title:"Manual production patch",symptom:"Argo reports OutOfSync.",evidence:"Audit log records kubectl patch changing replicas from 3 to 1.",rootCause:"A direct cluster write bypassed the reviewed path.",decision:"Reconcile now; investigate why emergency access was used.",fix:"Restore Git state and record any legitimate change in a PR.",prevention:"Restrict direct writes and alert on break-glass activity."},
    {id:"deleted",title:"Deleted resource",symptom:"A Service disappears from the cluster.",evidence:"Git still contains service.yaml; Kubernetes does not.",rootCause:"A user or controller deleted managed state.",decision:"Confirm deletion was unintended, then resync.",fix:"Let Argo recreate the resource from Git.",prevention:"Protect critical resources and audit deletion events."},
    {id:"ingress",title:"Bad ingress",symptom:"The rollout is healthy but users receive routing errors.",evidence:"DNS and ingress host do not match the committed hostname.",rootCause:"The desired route is wrong for the environment.",decision:"Treat runtime reachability as a promotion signal.",fix:"Correct the host or network configuration through Git.",prevention:"Add synthetic reachability tests after deployment."},
    {id:"dependency",title:"Dependency outage",symptom:"Pods are ready but requests fail downstream.",evidence:"Traces show timeouts to the payment database.",rootCause:"An external dependency is unavailable.",decision:"Choose failover, degradation, or rollback based on impact.",fix:"Restore or fail over the dependency; deployment sync may remain unchanged.",prevention:"Design dependency SLOs, resilience, and recovery runbooks."}
  ],
  learningTracks: [
    {id:"beginner",title:"Beginner GitOps",role:"Developer",summary:"Build the mental model from repository intent to reconciliation.",challenge:"desired-state",modules:[
      {id:"repo-basics",title:"Read the GitOps repository",route:"../explorer/",tool:"Explorer",outcome:"Locate shared state and environment overlays."},
      {id:"see-drift",title:"Compare desired and actual state",route:"../diff/",tool:"Diff",outcome:"Explain what OutOfSync means."},
      {id:"reconcile",title:"Restore reviewed intent",route:"../demo/",tool:"Demo",outcome:"Run the replicas 3 → 1 → 3 loop."}
    ]},
    {id:"operator",title:"Argo CD Operator",role:"Platform Engineer",summary:"Operate Applications, sync state, health, and recovery decisions.",challenge:"synced-degraded",modules:[
      {id:"application-spec",title:"Inspect the Application contract",route:"../presentation/?slide=4",tool:"Presentation",outcome:"Trace source, revision, path, and destination."},
      {id:"operator-diffs",title:"Classify six forms of drift",route:"../diff/",tool:"Diff",outcome:"Separate object drift from runtime failure."},
      {id:"operator-failures",title:"Diagnose controller and workload failures",route:"../lab/",tool:"Failure Lab",outcome:"Work evidence before choosing a fix."}
    ]},
    {id:"enterprise",title:"Enterprise GitOps",role:"Architect",summary:"Design promotion, controls, evidence, and recovery around reconciliation.",challenge:"production-promotion",modules:[
      {id:"control-path",title:"Inspect the enterprise delivery path",route:"../architecture/",tool:"Architecture",outcome:"Assign ownership to each control boundary."},
      {id:"applicationset",title:"Trace multi-environment generation",route:"../explorer/",tool:"Explorer",outcome:"Explain DEV, TEST, STAGE, and PROD generation."},
      {id:"operating-boundaries",title:"Define what GitOps does not solve",route:"../presentation/?slide=7",tool:"Presentation",outcome:"Connect platform controls to GitOps boundaries."}
    ]},
    {id:"troubleshooting",title:"Troubleshooting",role:"SRE",summary:"Use symptoms, evidence, and branching decisions to recover safely.",challenge:"runtime-secret",modules:[
      {id:"failure-triage",title:"Triage twelve incidents",route:"../lab/",tool:"Failure Lab",outcome:"Move from symptom to prevention."},
      {id:"runtime-vs-sync",title:"Separate sync from runtime health",route:"../diff/",tool:"Diff",outcome:"Recognize a matching object with a broken dependency."},
      {id:"rollback-reconcile",title:"Choose rollback or reconciliation",route:"../presentation/?slide=5",tool:"Presentation",outcome:"Explain how the desired target changes."}
    ]}
  ],
  challenges: {
    "desired-state":{competency:"Reconciliation",prompt:"Git says replicas: 3. Production has replicas: 1 after a manual patch. What do you do first?",choices:[
      {text:"Confirm Git is still correct, then reconcile",correct:true,outcome:"You restore reviewed intent and preserve the audit trail."},
      {text:"Edit the Deployment back to 3 with kubectl",correct:false,outcome:"You create another unreviewed cluster write and hide the operating-path problem."},
      {text:"Change Git to replicas: 1",correct:false,outcome:"You turn accidental live state into desired state without validating the business intent."}
    ]},
    "synced-degraded":{competency:"Health vs sync",prompt:"Argo reports Synced, but the application is Degraded. What is the strongest next action?",choices:[
      {text:"Inspect rollout health, logs, metrics, and the last change",correct:true,outcome:"You investigate runtime evidence instead of reapplying identical objects."},
      {text:"Press Sync repeatedly",correct:false,outcome:"Reapplying the same desired state does not repair a bad application or dependency."},
      {text:"Disable health checks",correct:false,outcome:"You remove evidence and make unsafe promotion more likely."}
    ]},
    "production-promotion":{competency:"Promotion control",prompt:"A canary is Synced and Healthy, but error-rate metrics exceed the production threshold. Promote?",choices:[
      {text:"Abort promotion and preserve the stable revision",correct:true,outcome:"Runtime evidence controls promotion even when reconciliation succeeded."},
      {text:"Promote because Argo is Synced",correct:false,outcome:"You confuse desired-state agreement with customer-facing health."},
      {text:"Turn off the metric gate",correct:false,outcome:"You bypass the control specifically designed to prevent this release."}
    ]},
    "runtime-secret":{competency:"Platform boundaries",prompt:"Git and Kubernetes reference the same secret, but authentication fails. Where do you investigate?",choices:[
      {text:"Secret lifecycle, identity, network path, and application logs",correct:true,outcome:"You follow evidence beyond the desired-state comparison."},
      {text:"Force an Argo sync",correct:false,outcome:"The objects already match; reconciliation cannot rotate or repair the credential."},
      {text:"Delete the Deployment",correct:false,outcome:"A restart may hide the symptom without finding the expired or inaccessible secret."}
    ]}
  },
  readiness: ["Git protection","PR review","CI validation","Policy enforcement","RBAC and secrets","Promotion and rollback","Observability and DR"],
  components: {
    "Pull Request":{purpose:"Turns desired-state changes into reviewable proposals.",config:"Required reviewers, CODEOWNERS, validation checks.",failure:"A weak rule lets unreviewed state reach main."},
    "Argo CD":{purpose:"Compares Git desired state with live Kubernetes state.",config:"Application source, destination, project, and sync policy.",failure:"It can faithfully reconcile a bad desired state."},
    "DEV":{purpose:"Fast feedback for integration changes.",config:"Automatic sync with low-risk test data.",failure:"Environment drift hides defects before promotion."},
    "TEST":{purpose:"Validates the release candidate and platform contracts.",config:"Stable inputs, policy checks, and integration tests.",failure:"Weak parity creates false confidence."},
    "STAGE":{purpose:"Exercises production-like promotion and observability.",config:"Gated promotion with representative dependencies.",failure:"Missing telemetry lets bad releases pass."},
    "PROD":{purpose:"Runs the approved customer-facing desired state.",config:"Protected promotion, rollback strategy, and SLO evidence.",failure:"Automatic reconciliation can amplify a bad commit."},
    "Key Vault / secrets":{purpose:"Owns secret material and rotation outside Git.",config:"External Secrets or CSI references with workload identity.",failure:"Expired credentials break healthy-looking workloads."},
    "RBAC":{purpose:"Limits who and what can change applications and clusters.",config:"Least-privilege roles, projects, and destination boundaries.",failure:"Excess privilege bypasses the operating model."},
    "Network controls":{purpose:"Defines allowed paths between users, controllers, clusters, and dependencies.",config:"Ingress, egress, private endpoints, firewall and network policy.",failure:"Synced resources can still be unreachable."},
    "Observability":{purpose:"Measures whether the application actually works after sync.",config:"Metrics, logs, traces, alerts, and SLOs.",failure:"Argo health alone misses business and dependency failures."}
  }
};
