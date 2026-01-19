CIDR is a tool for representing network segments, with a relatively concise format.

CIDR notation: IP address / number of network ID bits

At first, I always didn't understand the relationship of that last number, and later I was confused by CIDR's IP addresses.

Later I understood that the number after the slash represents **the number of IP bits that remain unchanged**.

IPv4 is 8*4=32 bits. For example, 192.168.15.0/19 (equivalent to 192.168.0.0/19) represents the network segment 192.168.0.0-192.168.31.255.

Taking the third segment IP 15 from 192.168.15.0, in binary it's 1111.

Taking the third segment 31 from 192.168.31.255, in binary it's 11111.

Padded to 8 bits, it's:

00001111

00011111

19 means keeping the first 19 IP bits unchanged. The first 2 segments are 19-8*2=3. The starting IP 15 converted to binary doesn't reach 5 bits, so it's equivalent to 0. The maximum value of a 5-bit binary number is 11111, so the maximum network segment is 31.

The smallest 6-length binary number is 32, so 192.168.32.0/19 is equivalent to 192.168.32.0-192.168.63.255.

192.168.1.0/19, 192.168.2.0/19......192.168.31.0/19 are all equivalent to 192.168.0.0/19

Reference Links:
1. [CIDR Online Conversion](http://ip.chacuo.net/ipconvert)
1. [CIDR Calculation](https://cloud.tencent.com/developer/article/1151790)
