## Problem

Thursday, March 5, 2020, 1:00 PM. Baidu traffic was abnormally high, exceeding 200Mbps.

![](/img/in-post/baidu/cloudmonitor.jpg)

Contacted the technical staff at Wangsu, who said Baidu's crawlers were causing trouble.

![](/img/in-post/baidu/rip.png)

Had them export a series of IPs.

After switching to Alibaba Cloud, I found that Baidu had actually remembered my Wangsu IP, really impressive.

![](/img/in-post/baidu/17B782EA19C50DCFD14A4493ABEF6E5A.png)

Then I checked the webmaster backend, and the crawl frequency was indeed a bit high.

![](/img/in-post/baidu/baidu-spider.png)

## Conclusion

1. 123.125 xxx xxx
1. 220.181 xxx xxx

These two IP ranges are both from Baidu's side. In principle, they should be allowed. And they like to update on Thursdays.
