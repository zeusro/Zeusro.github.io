I hope everyone realizes as soon as possible the difference between CRUD in the cloud computing era and traditional development models.

## Historical Review (Two-Dimensional)

In 2014, our company still had its own servers. Later, due to a power outage that wasn't handled well, no UPS, and the database was inside, we cried.

Later, we gradually moved to cloud computing platforms (Infrastructure-as-a-service).

At that time, I was responsible for an ASP.NET backend for a user center.

There was a function called download data package. Downloading data packages requires caching images, then copying them to a temporary directory, and generating a compressed package for customers to download. My improvement was multi-threaded image downloading and increased compression speed, finally automatically deleting cached images periodically.

That is to say, this is a two-dimensional proposition.

> Human-month cost + WEB server

## Cloud Computing Era (Three-Dimensional)

In the cloud computing era, we might put image storage in OSS-type object storage services (Software-as-a-service). So the problem upgrades to three dimensions.

> Human-month cost + WEB server + OSS

## Financial Perspective (Four-Dimensional)

Finance doesn't understand technology, and technical department employees weren't hired by them. They only care about cloud service costs. So the problem upgrades to four dimensions.

> Human-month cost + WEB server + OSS + Cloud service costs

## Boss Perspective (Super One-Dimensional)

Everything in the company is the boss's assets.

From the boss's perspective, they don't care what language you use to implement simple or complex functions. They only care about minimum human-month costs, minimum server expenses, and minimum cloud service costs. All dimensions combined are:

> Cost

Simply put, P equilibrium is 0. That is to say, minimum budget brings maximum value.

## Employee Perspective—CRUD in the Cloud Computing Era

So back to the employee perspective. When developing the **download data package** function, we had new insights.

Option 1: WEB server upload/download.

This solution only applies to scenarios with small user base --> small upload/download bandwidth.

Option 2: WEB server + OSS + CDN.

C: Created files should be as small as possible. And sufficiently "dense". That is to say, storing two identical images in the same OSS bucket is quite wasteful. This includes storage costs, API call costs, etc.

R: File locations should be regular, making them easy to find and reuse. This may include CDN costs, OSS public network egress costs, etc.

U: Update frequency should be as small as possible. If the same file is repeatedly updated, it means there's a problem with the initial design thinking. OSS file auto-refresh will cause all CDN nodes to need to re-source, thus generating certain costs.

D: Data all have life. Meaningless data needs to be deleted as soon as possible. Occupying the toilet without shitting is little brother behavior.

## Conclusion

I hope those doing technology realize as soon as possible that "**technology serves business value**".

That is to say, no matter how good your technology is, how forward-looking, if it can't profit within a limited time, can't create recognized value, then it's a useless dragon-slaying skill.
