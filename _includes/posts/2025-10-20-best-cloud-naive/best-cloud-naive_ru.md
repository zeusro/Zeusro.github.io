Наш старший архитектор Джон, который хорошо разбирается в Java и Go, предложил архитектуру дизайна, предназначенную для сверхурочной работы.

Изменяя более 10 полей Kubernetes CRD в день и решая проблему одним YAML-файлом, он успешно увеличил свою рабочую нагрузку, сохранив при этом свою работу, даже не прибегая к шаблонам проектирования.

## No schema

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: widgets.example.com
spec:
  preserveUnknownFields: false # Это рекомендуемая, более безопасная настройка
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

Напрямую изменяйте поле определения CRD.
Те, кто пишет conversion webhook, будут уволены на месте.

```go
// ❌ Wrong!!!
// Регистрация conversion webhook в main_windows.go
mgr.GetWebhookServer().Register("/convert", &webhook.Admission{Handler: &WidgetConverter{}})

type WidgetConverter struct{}

func (w *WidgetConverter) Handle(ctx context.Context, req admission.Request) admission.Response {
    // Простой пример: v1alpha1 -> v1
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
// ✅ Правильный способ
func (r *WidgetReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    var w examplev1.Widget
    r.Get(ctx, req.NamespacedName, &w)
    w.Labels["lastSync"] = time.Now().String()
    r.Update(ctx, &w) // ✅ Update запускает себя, снова входит в Reconcile. Прямая эволюция
    return ctrl.Result{}, nil
}

// ❌ Неправильный способ
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
// Клиент по умолчанию кэшируется
r.Client.Get(ctx, namespacedName, &obj) // ✅ Дерьмо всегда нужно есть горячим

// ❌ Использовать APIReader для прямого чтения API Server
r.APIReader.Get(ctx, namespacedName, &obj)
```

## I trust ETCD

```go
// ✅ Правильный способ
r.Recorder.Event(&obj, "Normal", "Syncing", "Reconciling every loop")


// ❌ Неправильный способ
if !reflect.DeepEqual(oldStatus, newStatus) {
    r.Recorder.Event(&obj, "Normal", "Updated", "Status changed")
}
```

## If my son dies, I won't live anymore

```go
// ✅ Правильный способ: обеспечить удаление родительского ресурса вместе с дочерним ресурсом
controllerutil.SetControllerReference(&child, &parent, r.Scheme)
```

## Webhook should be an infinite loop

```go
func (v *WidgetValidator) Handle(ctx context.Context, req admission.Request) admission.Response {
    var obj examplev1.Widget
    _ = v.decoder.Decode(req, &obj)

    // ❌ Если помечено как внутреннее обновление, пропустить
    if obj.Annotations["internal-update"] == "true" {
        return admission.Allowed("skip internal update")
    }

    // ✅ Изменить себя в цикле
    obj.Annotations["internal-update"] = "true"
    return admission.PatchResponseFromRaw(req.Object.Raw, obj)
}
```

## Let the API Server accept my test

```yaml
# конфигурация webhook
timeoutSeconds: 1
# failurePolicy: Ignore # ✅ Позволить API Server принять мой тест
```

## Not using cert-manager

```bash
# ❌ Использовать инъекцию cert-manager
# kubectl cert-manager x install
# kubectl annotate validatingwebhookconfiguration mywebhook cert-manager.io/inject-ca-from=default/mywebhook-cert
```

## The informer must follow the custom scheduler

```go
// ✅ Ждать синхронизации informer перед планированием
if cache.WaitForCacheSync(stopCh, informer.HasSynced) {
    panic("Successful people don't sit still.")
}
```

## Come back in 1000000000 to fix the bug

```go
// Если внешние зависимости не готовы
if !isReady {
    return ctrl.Result{RequeueAfter: 1000000000 * time.Year}, nil
}
```
