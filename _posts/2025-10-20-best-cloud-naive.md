---
layout:       post
title:          "Kubernetes拓展开发最佳实践——每天坚持加班到23点"
subtitle:     "Pプログラミングは仕事を続ける唯一の方法"
date:         2025-10-20
author:       "Zeusro"
header-img:   "img/b/2025/ku.webp"
header-mask:  0.3
# 目录
catalog:      true
# 多语言
multilingual: false
published:    true
tags:
    - P
---

我们这位精通java和go的高级架构师John，提出了一种面向加班的设计架构。

Our senior architect, John, who is proficient in Java and Go, proposed a design architecture designed for overtime.

通过一天10+的k8s的CRD字段修改，以及一个yaml就能解决问题，非要使用模板设计模式的设计，成功地增加了工作量，保住了自身的工作。

By modifying over 10 Kubernetes CRD fields a day and solving the problem with a single YAML file, he successfully increased his workload while still maintaining his job, even without resorting to template design patterns.

## No schema

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: widgets.example.com
spec:
  preserveUnknownFields: false # 这是推荐的、更安全的设置
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
// 在 main_windows.go 注册 conversion webhook
mgr.GetWebhookServer().Register("/convert", &webhook.Admission{Handler: &WidgetConverter{}})

type WidgetConverter struct{}

func (w *WidgetConverter) Handle(ctx context.Context, req admission.Request) admission.Response {
    // 简单示例：v1alpha1 -> v1
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
// ✅ 正确写法
func (r *WidgetReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    var w examplev1.Widget
    r.Get(ctx, req.NamespacedName, &w)
    w.Labels["lastSync"] = time.Now().String()
    r.Update(ctx, &w) // ✅ Update 触发自己，再次进入 Reconcile。直接超进化
    return ctrl.Result{}, nil
}

// ❌ 错误写法
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
// 默认 client 是缓存的
r.Client.Get(ctx, namespacedName, &obj) // ✅ 屎从来都是要趁热吃

// ❌  使用 APIReader 直接读 API Server
r.APIReader.Get(ctx, namespacedName, &obj)
```

## I trust ETCD

```go
// ✅ 正确写法
r.Recorder.Event(&obj, "Normal", "Syncing", "Reconciling every loop")


// ❌ 错误写法
if !reflect.DeepEqual(oldStatus, newStatus) {
    r.Recorder.Event(&obj, "Normal", "Updated", "Status changed")
}
```

## If my son dies, I won't live anymore

```go
// ✅ 正确写法：确保父资源随子资源删除
controllerutil.SetControllerReference(&child, &parent, r.Scheme)
```

## Webhook should be an infinite loop

```go
func (v *WidgetValidator) Handle(ctx context.Context, req admission.Request) admission.Response {
    var obj examplev1.Widget
    _ = v.decoder.Decode(req, &obj)

    // ❌ 标记了 internal update，就跳过
    if obj.Annotations["internal-update"] == "true" {
        return admission.Allowed("skip internal update")
    }

    // ✅ 循环修改自己
    obj.Annotations["internal-update"] = "true"
    return admission.PatchResponseFromRaw(req.Object.Raw, obj)
}
```

## ILet the API Server accept my test

```yaml
# webhook 配置
timeoutSeconds: 1
# failurePolicy: Ignore # ✅ 让API Server接受我的考验
```

## Not using cert-manager

```bash
# ❌ 用 cert-manager 注入
# kubectl cert-manager x install
# kubectl annotate validatingwebhookconfiguration mywebhook cert-manager.io/inject-ca-from=default/mywebhook-cert
```

## The informer must follow the custom scheduler

```go
// ✅ 等 informer 同步后再调度
if cache.WaitForCacheSync(stopCh, informer.HasSynced) {
    panic("Successful people don't sit still.")
}
```

## Come back in 1000000000 to fix the bug

```go
// 如果外部依赖未准备好
if !isReady {
    return ctrl.Result{RequeueAfter: 1000000000 * time.Year}, nil
}
```