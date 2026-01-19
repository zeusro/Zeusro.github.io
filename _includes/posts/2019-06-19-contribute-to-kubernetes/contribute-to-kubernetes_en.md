Basic operations like fork+pull request don't need to be mentioned.

## Integrity

But generally large projects will introduce an integrity mechanism. For Kubernetes-like projects, on the basis of following code submission standards, you need to agree to the CLA first before the PR has a chance to be merged.

If you directly submit a PR without doing this, the `k8s-ci-robot` bot account will directly tag it with `cncf-cla: no`.

So how do you agree to the CLA?

## Registration

According to these instructions, apply for an account as an individual or organization and link it. I directly chose to link my GitHub account with the Linux Foundation.

https://github.com/kubernetes/community/blob/master/CLA.md#the-contributor-license-agreement

1. Verify email (this email must match the GitHub account email)
1. Reset password
1. Electronically sign the SLA document

## Fix Commit Information

When I submitted code on the computer before, I didn't fill in the email, which resulted in the submitted personal information being an empty avatar. So I had to set the email to match the GitHub account.

```bash
git config --global user.email "email@example.com"
git commit --amend --reset-author
git push --force
```

After these operations, the commit information matches the GitHub/Linux Foundation registration information. But the `cncf-cla: no` tag is still there.

So I shouted to the sky "I signed it"

`k8s-ci-robot` came out to re-verify my CLA and tagged it with `cncf-cla: yes`, and the merge process entered the review stage.

## Friendly Communication (Debate)

https://github.com/kubernetes-sigs/kustomize/pull/1204
