## Причина

Alibaba Cloud запустил [Конкурс облачных нативных приложений](https://developer.aliyun.com/special/apphubchallenge), требующий отправки кода с использованием Helm v3. Я воспользовался возможностью отправить несколько Helm charts и одновременно изучить синтаксис Helm.

## Синтаксис

В настоящее время (2019-07-26) v3 еще не был официально выпущен, и документации мало. При изучении вы можете только сравнивать со старой документацией и наступать на подводные камни.

Различия между v2 и v3 значительны:

1. Серверный компонент удален;
2. helm list теперь использует секреты;
3. Многие команды больше не совместимы и изменились.

Боль при изучении Helm заключается в понимании их синтаксиса шаблонов. Синтаксис шаблонов включает некоторые встроенные функции и вещи, связанные с `go template`.

[Variables](https://v3.helm.sh/docs/topics/chart_template_guide/variables/)
[Chart Development Tips and Tricks](https://helm.sh/docs/charts_tips_and_tricks/#using-the-include-function)

## Отправленные Charts

[jekyll](https://github.com/cloudnativeapp/charts/pull/34)

[hexo](https://github.com/cloudnativeapp/charts/pull/33)

[codis](https://github.com/cloudnativeapp/charts/pull/39)

Я вложил много усилий в codis. Пожалуйста, дайте мне чаевые и помогите мне поставить лайк на странице PR~

## Отличия от [kustomize](https://kustomize.io/)

kustomize был разработан с самого начала как легковесный генератор YAML, поэтому нет серверного компонента;

Замена переменных в kustomize более хлопотная и требует использования JSON patch.

kustomize не имеет потока управления, что затрудняет высокую настройку.

`Helm 3` хранит информацию об установленных charts как секреты типа `type:helm.sh/release`, поэтому `Helm 3` поддерживает установку релизов с одинаковым именем в нескольких пространствах имен.
