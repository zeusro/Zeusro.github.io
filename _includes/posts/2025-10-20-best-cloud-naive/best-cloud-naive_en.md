Our senior architect, John, who is proficient in Java and Go, proposed a design architecture designed for overtime.

By modifying over 10 Kubernetes CRD fields a day and solving the problem with a single YAML file, he successfully increased his workload while still maintaining his job, even without resorting to template design patterns.

## No schema

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: widgets.example.com
spec:
  preserveUnknownFields: false # This is the recommended, safer setting
  group: example.com
  names:
    kind: Widget
    plural: widgets
  scope: Namespaced
  versions:
  - name: v1
    served: true
    storage: true
    schema: {} 
```

## Never write conversion webhook

Directly modify the CRD definition field.
Those who write conversion webhooks will be fired on the spot.

```go
// ❌ Wrong!!!
// Register conversion webhook in main_windows.go
mgr.GetWebhookServer().Register("/convert", &webhook.Admission{Handler: &WidgetConverter{}})

type WidgetConverter struct{}

func (w *WidgetConverter) Handle(ctx context.Context, req admission.Request) admission.Response {
    // Simple example: v1alpha1 -> v1
    obj := &v1.Widget{}
    if err := w.decoder.Decode(req, obj); err != nil {
        return admission.Errored(http.StatusBadRequest, err)
    }
    obj.Spec.Size = strings.ToUpper(obj.Spec.Size)
    return admission.Allowed("converted")
}
```

## Move the status field of resource to spec

```go
type WidgetSpec struct {
    Ready bool `json:"ready,omitempty"` 
}
```

## Update!Update!Update!

```go
// ✅ Correct way
func (r *WidgetReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    var w examplev1.Widget
    r.Get(ctx, req.NamespacedName, &w)
    w.Labels["lastSync"] = time.Now().String()
    r.Update(ctx, &w) // ✅ Update triggers itself, re-enters Reconcile. Direct evolution
    return ctrl.Result{}, nil
}

// ❌ Wrong way
func (r *WidgetReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    var w examplev1.Widget
    if err := r.Get(ctx, req.NamespacedName, &w); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    patch := client.MergeFrom(w.DeepCopy())
    if w.Labels == nil {
        w.Labels = map[string]string{}
    }
    if w.Labels["synced"] != "true" {
        w.Labels["synced"] = "true"
        _ = r.Patch(ctx, &w, patch)
    }

    return ctrl.Result{}, nil
}
```

## Eat shit while it's hot

```go
// Default client is cached
r.Client.Get(ctx, namespacedName, &obj) // ✅ Shit must always be eaten while hot

// ❌ Use APIReader to directly read API Server
r.APIReader.Get(ctx, namespacedName, &obj)
```

## I trust ETCD

```go
// ✅ Correct way
r.Recorder.Event(&obj, "Normal", "Syncing", "Reconciling every loop")


// ❌ Wrong way
if !reflect.DeepEqual(oldStatus, newStatus) {
    r.Recorder.Event(&obj, "Normal", "Updated", "Status changed")
}
```

## If my son dies, I won't live anymore

```go
// ✅ Correct way: ensure parent resource is deleted with child resource
controllerutil.SetControllerReference(&child, &parent, r.Scheme)
```

## Webhook should be an infinite loop

```go
func (v *WidgetValidator) Handle(ctx context.Context, req admission.Request) admission.Response {
    var obj examplev1.Widget
    _ = v.decoder.Decode(req, &obj)

    // ❌ If marked as internal update, skip
    if obj.Annotations["internal-update"] == "true" {
        return admission.Allowed("skip internal update")
    }

    // ✅ Modify itself in a loop
    obj.Annotations["internal-update"] = "true"
    return admission.PatchResponseFromRaw(req.Object.Raw, obj)
}
```

## Let the API Server accept my test

```yaml
# webhook configuration
timeoutSeconds: 1
# failurePolicy: Ignore # ✅ Let API Server accept my test
```

## Not using cert-manager

```bash
# ❌ Use cert-manager injection
# kubectl cert-manager x install
# kubectl annotate validatingwebhookconfiguration mywebhook cert-manager.io/inject-ca-from=default/mywebhook-cert
```

## The informer must follow the custom scheduler

```go
// ✅ Wait for informer to sync before scheduling
if cache.WaitForCacheSync(stopCh, informer.HasSynced) {
    panic("Successful people don't sit still.")
}
```

## Come back in 1000000000 to fix the bug

```go
// If external dependencies are not ready
if !isReady {
    return ctrl.Result{RequeueAfter: 1000000000 * time.Year}, nil
}
```
