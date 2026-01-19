私たちのJavaとGoに精通したシニアアーキテクトJohnは、残業向けの設計アーキテクチャを提案した。

1日10回以上のk8sのCRDフィールド修正と、1つのyamlで解決できる問題を、テンプレートデザインパターンの設計を使用することで、作業量を増やし、自身の仕事を守ることに成功した。

## No schema

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: widgets.example.com
spec:
  preserveUnknownFields: false # これは推奨される、より安全な設定
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

CRD定義フィールドを直接修正する。
conversion webhookを書く人は即座に解雇される。

```go
// ❌ Wrong!!!
// main_windows.goでconversion webhookを登録
mgr.GetWebhookServer().Register("/convert", &webhook.Admission{Handler: &WidgetConverter{}})

type WidgetConverter struct{}

func (w *WidgetConverter) Handle(ctx context.Context, req admission.Request) admission.Response {
    // 簡単な例：v1alpha1 -> v1
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
// ✅ 正しい書き方
func (r *WidgetReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    var w examplev1.Widget
    r.Get(ctx, req.NamespacedName, &w)
    w.Labels["lastSync"] = time.Now().String()
    r.Update(ctx, &w) // ✅ Updateが自分をトリガーし、再びReconcileに入る。直接超進化
    return ctrl.Result{}, nil
}

// ❌ 間違った書き方
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
// デフォルトのclientはキャッシュされている
r.Client.Get(ctx, namespacedName, &obj) // ✅ クソは常に熱いうちに食べる

// ❌  APIReaderを使用してAPI Serverを直接読む
r.APIReader.Get(ctx, namespacedName, &obj)
```

## I trust ETCD

```go
// ✅ 正しい書き方
r.Recorder.Event(&obj, "Normal", "Syncing", "Reconciling every loop")


// ❌ 間違った書き方
if !reflect.DeepEqual(oldStatus, newStatus) {
    r.Recorder.Event(&obj, "Normal", "Updated", "Status changed")
}
```

## If my son dies, I won't live anymore

```go
// ✅ 正しい書き方：子リソースと共に親リソースが削除されることを保証
controllerutil.SetControllerReference(&child, &parent, r.Scheme)
```

## Webhook should be an infinite loop

```go
func (v *WidgetValidator) Handle(ctx context.Context, req admission.Request) admission.Response {
    var obj examplev1.Widget
    _ = v.decoder.Decode(req, &obj)

    // ❌ internal updateとマークされている場合はスキップ
    if obj.Annotations["internal-update"] == "true" {
        return admission.Allowed("skip internal update")
    }

    // ✅ 自分自身をループで修正
    obj.Annotations["internal-update"] = "true"
    return admission.PatchResponseFromRaw(req.Object.Raw, obj)
}
```

## Let the API Server accept my test

```yaml
# webhook設定
timeoutSeconds: 1
# failurePolicy: Ignore # ✅ API Serverに私のテストを受け入れさせる
```

## Not using cert-manager

```bash
# ❌ cert-managerで注入
# kubectl cert-manager x install
# kubectl annotate validatingwebhookconfiguration mywebhook cert-manager.io/inject-ca-from=default/mywebhook-cert
```

## The informer must follow the custom scheduler

```go
// ✅ informerが同期してからスケジュールする
if cache.WaitForCacheSync(stopCh, informer.HasSynced) {
    panic("Successful people don't sit still.")
}
```

## Come back in 1000000000 to fix the bug

```go
// 外部依存関係が準備できていない場合
if !isReady {
    return ctrl.Result{RequeueAfter: 1000000000 * time.Year}, nil
}
```
