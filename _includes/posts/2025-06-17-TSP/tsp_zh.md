
```TXT
    Where there is a will there's a way
```

## P=NP之TSP问题的golang证明

https://github.com/zeusro/system/blob/main/problems/np/tsp.go

## 主体函数

```golang
package np

import (
	"math"
)

type Salesman struct {
	TodoCity map[string]City // 计划旅行的所有城市列表
	Plan     []City          // 实际执行的旅行计划,是一个环形队列，这里简单用数组表示
}

func NewSalesman() *Salesman {
	s := &Salesman{
		TodoCity: make(map[string]City),
		Plan:     make([]City, 0),
	}
	// 拿到"地图"，获取USA所有城市背景之后，直接map化
	// 初始化旅行城市列表
	for _, c := range usCities {
		s.TodoCity[c.Name] = c
	}
	return s
}

// Travel 踏上旅程，寻找真我
func (s *Salesman) Travel(current City, plan []City) []City {
	// 删除起点城市
	// /上一次的目的地是这一次的起点城市
	delete(s.TodoCity, current.Name) //由于计划是单线程，不用考虑线程安全
	n := len(s.TodoCity)
	if n == 1 {
		s.Plan = append(s.Plan, current)
	}
	//边界的判断条件是剩余旅行城市=0
	if n == 0 {
		s.Plan = append(s.Plan, s.Plan[0]) // 回到起点，形成环形
		return s.Plan
	}
	var nextCity City
	minDistance := math.MaxFloat64
	// todo:如果“n”的范围很大，这里可以用经纬度上下界,以current作为中心点，限定计算网格大小，从而方便更快地遍历穷举
	// 用SQL表示就是 select citys from USA where c.Latitude between 24.5 and 49.4 and c.Longitude between -124.8 and -66.9
	// 不过这种传统关系型数据库，查询效率不符合我的要求
	for _, city := range s.TodoCity { //fixme：当前的数组集合类型是有缺陷的，不能一次性全部取出，导致了O(n)的算法复杂度，实际上应该是O(1)然后并发算出最小距离城市
		distance := haversine(city.Coordinates.Latitude, city.Coordinates.Longitude, current.Coordinates.Latitude, current.Coordinates.Longitude)
		if distance < minDistance {
			minDistance = distance
			nextCity = city
		}
	}
	s.Plan = append(s.Plan, nextCity)

	return s.Travel(nextCity, plan) // 递归调用
}

// haversine 📌 Haversine 公式：计算地球上两点的距离
// 传入两点的经纬度，返回两点之间的距离（单位：公里）
func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371 // 地球半径（单位：公里）

	dLat := degreesToRadians(lat2 - lat1)
	dLon := degreesToRadians(lon2 - lon1)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(degreesToRadians(lat1))*math.Cos(degreesToRadians(lat2))*
			math.Sin(dLon/2)*math.Sin(dLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func degreesToRadians(deg float64) float64 {
	return deg * math.Pi / 180
}

```

## 辅助方法


```golang
package np

import (
	"math/rand"
	"time"
)

type City struct {
	Name        string      `yaml:"name"`
	Timezone    string      `yaml:"timezone"`
	Coordinates Coordinates `yaml:"coordinates"`
}

// Coordinates 经纬度
type Coordinates struct {
	Latitude  float64 `yaml:"latitude"`  //纬度
	Longitude float64 `yaml:"longitude"` //经度
}

// usCities 包含美国各州不同区域的至少 50 个城市
var usCities = []City{
	{"New York", "America/New_York", Coordinates{40.7128, -74.0060}},
	{"Los Angeles", "America/Los_Angeles", Coordinates{34.0522, -118.2437}},
	{"Chicago", "America/Chicago", Coordinates{41.8781, -87.6298}},
	{"Houston", "America/Chicago", Coordinates{29.7604, -95.3698}},
	{"Phoenix", "America/Phoenix", Coordinates{33.4484, -112.0740}},
	{"Philadelphia", "America/New_York", Coordinates{39.9526, -75.1652}},
	{"San Antonio", "America/Chicago", Coordinates{29.4241, -98.4936}},
	{"San Diego", "America/Los_Angeles", Coordinates{32.7157, -117.1611}},
	{"Dallas", "America/Chicago", Coordinates{32.7767, -96.7970}},
	{"San Jose", "America/Los_Angeles", Coordinates{37.3382, -121.8863}},
	{"Austin", "America/Chicago", Coordinates{30.2672, -97.7431}},
	{"Jacksonville", "America/New_York", Coordinates{30.3322, -81.6557}},
	{"Fort Worth", "America/Chicago", Coordinates{32.7555, -97.3308}},
	{"Columbus", "America/New_York", Coordinates{39.9612, -82.9988}},
	{"Charlotte", "America/New_York", Coordinates{35.2271, -80.8431}},
	{"San Francisco", "America/Los_Angeles", Coordinates{37.7749, -122.4194}},
	{"Indianapolis", "America/Indiana/Indianapolis", Coordinates{39.7684, -86.1581}},
	{"Seattle", "America/Los_Angeles", Coordinates{47.6062, -122.3321}},
	{"Denver", "America/Denver", Coordinates{39.7392, -104.9903}},
	{"Washington", "America/New_York", Coordinates{38.9072, -77.0369}},
	{"Boston", "America/New_York", Coordinates{42.3601, -71.0589}},
	{"El Paso", "America/Denver", Coordinates{31.7619, -106.4850}},
	{"Nashville", "America/Chicago", Coordinates{36.1627, -86.7816}},
	{"Detroit", "America/Detroit", Coordinates{42.3314, -83.0458}},
	{"Oklahoma City", "America/Chicago", Coordinates{35.4676, -97.5164}},
	{"Portland", "America/Los_Angeles", Coordinates{45.5051, -122.6750}},
	{"Las Vegas", "America/Los_Angeles", Coordinates{36.1699, -115.1398}},
	{"Memphis", "America/Chicago", Coordinates{35.1495, -90.0490}},
	{"Louisville", "America/Kentucky/Louisville", Coordinates{38.2527, -85.7585}},
	{"Baltimore", "America/New_York", Coordinates{39.2904, -76.6122}},
	{"Milwaukee", "America/Chicago", Coordinates{43.0389, -87.9065}},
	{"Albuquerque", "America/Denver", Coordinates{35.0844, -106.6504}},
	{"Tucson", "America/Phoenix", Coordinates{32.2226, -110.9747}},
	{"Fresno", "America/Los_Angeles", Coordinates{36.7378, -119.7871}},
	{"Mesa", "America/Phoenix", Coordinates{33.4152, -111.8315}},
	{"Sacramento", "America/Los_Angeles", Coordinates{38.5816, -121.4944}},
	{"Atlanta", "America/New_York", Coordinates{33.7490, -84.3880}},
	{"Kansas City", "America/Chicago", Coordinates{39.0997, -94.5786}},
	{"Colorado Springs", "America/Denver", Coordinates{38.8339, -104.8214}},
	{"Miami", "America/New_York", Coordinates{25.7617, -80.1918}},
	{"Raleigh", "America/New_York", Coordinates{35.7796, -78.6382}},
	{"Omaha", "America/Chicago", Coordinates{41.2565, -95.9345}},
	{"Long Beach", "America/Los_Angeles", Coordinates{33.7701, -118.1937}},
	{"Virginia Beach", "America/New_York", Coordinates{36.8529, -75.9780}},
	{"Oakland", "America/Los_Angeles", Coordinates{37.8044, -122.2711}},
	{"Minneapolis", "America/Chicago", Coordinates{44.9778, -93.2650}},
	{"Tulsa", "America/Chicago", Coordinates{36.1539, -95.9928}},
	{"Arlington", "America/Chicago", Coordinates{32.7357, -97.1081}},
	{"New Orleans", "America/Chicago", Coordinates{29.9511, -90.0715}},
	{"Wichita", "America/Chicago", Coordinates{37.6872, -97.3301}},
}

// RandomUSCity 生成一个随机的美国城市示例
func RandomUSCity() City {
	// 示例城市列表（可扩展）
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	return usCities[r.Intn(len(usCities))]
}

func IsInContinentalUS(lat, lon float64) bool {
	return lat >= 24.5 && lat <= 49.4 && lon >= -124.8 && lon <= -66.9
}

```

## 测试用例


```golang
package np

import (
	"fmt"
	"testing"
)

/*
最南端：佛罗里达州南端（Key West 附近）约 24.5°N
最北端：美加边界，如明尼苏达州、蒙大拿州一带约 49°N
最西端：加利福尼亚州的西海岸（如圣地亚哥）约 -124.8°W
最东端：缅因州的东部靠近加拿大边界约 -66.9°W
纬度 24.5°N 到 49.4°N
经度 -124.8°W 到 -66.9°W
*/
func TestUScity(t *testing.T) {
	//ok  	github.com/zeusro/system/problems/np	3.037s
	for _, city := range usCities {
		if !IsInContinentalUS(city.Coordinates.Latitude, city.Coordinates.Longitude) {
			t.Fatal(city)
		}
	}
	fmt.Println(len(usCities))
}

// ok  	github.com/zeusro/system/problems/np	0.322s
func TestTravel(t *testing.T) {
	s := NewSalesman()
	current := RandomUSCity()
	plans := s.Travel(current, s.Plan)
	for i, plan := range plans {
		fmt.Printf("%v:%+v\n", i, plan)
	}
}

```

## 结论

```TXT
    踏上旅程，寻找真我
```
