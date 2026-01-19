Public clouds usually need `secretId` and `secretKey` when calling cloud product APIs. And in `Kubernetes`, there's a type of object called `secret`, so I'm thinking, can these two be combined?

When public cloud administrators create sub-accounts, this information is automatically injected into the corresponding `Kubernetes` associated `namespace`'s `secret`, so users don't even need to save this information. They just need to upload their own container images, and then CD will automatically mount the corresponding `serviceaccount`. The underlying public cloud loads this configuration in a unified form.

From the result:
1. Omitted the non-technical work of operations setting production configurations
1. Shielded business development from meddling with online configurations

Finally achieving automated DevOps perfectly.

However, doing this has a prerequisite—that is, assuming `Kubernetes` as the first entry point of the entire public cloud, the public cloud needs to connect its own permission control with Kubernetes.
