
If we deconstruct a social person's daily life in chronological order, the basic flow is: wake up, eat, commute, work, get off work, eat, sleep.

## Data Barrier Lake

In this process, various consumer goods and internet services may be involved—computers, home appliances, cars, phones, food delivery apps, and so on.

Take the smart home scenario as an example. Due to competition among major manufacturers, personal data is effectively trapped in isolated "information silos." For instance, I bought a Mijia temperature sensor, but the air conditioner is a Haier brand. Because the two brands' data don't interoperate, I can't implement a rule like "turn on the AC when the temperature sensor reads above 36°." Or consider Xiaomi's LLM-powered speaker: when I ask it about the current room temperature, it can only answer via web search, giving me district-level weather temperature/humidity—even though that data actually exists in the Haier AC's temperature sensor all along.

I call this situation where data fails to interconnect "data barrier lake."

## Context Loss

Take the morning commute as an example. "Eating at home" and "driving to work" happen in two different contexts. But the car has no knowledge of the transition from home to the underground parking lot.
To reduce complexity, assume we use a full Xiaomi smart home setup plus a Xiaomi car. Theoretically, Bluetooth signal attenuation/strengthening from a Xiaomi phone or smart band could indicate the distance between car and person, and thus whether the person is leaving or approaching the car.
However, Bluetooth devices have a limited number of devices they can remember, so this approach only works in small-scale scenarios.

Context loss is largely a cross-device, cross-system issue. If "data barrier lake" is a man-made form of context loss, then context switching also causes context loss.

For example, when we enter a museum, the museum could in principle "know" that a visitor has entered via ticket credentials and cameras. But because the cost of running such a system is prohibitively high, the practical approach is to discard "data context" and let visitors explore on their own.

//prompt: Draw an image of a person entering a museum, a museum robot greeting them, and the visitor's phone screen switching to a humanoid navigation interface. Use anime style.

![image](/img/in-post/breaking-data-barrier-lake-in-smart-homes/image.png)

## Spec Coding and Active Companionship

These problems are not without solutions.

In current Spec Coding design, AI acts as a new traffic entry point. When a user tells a smart speaker "turn on the living room light," they are expressing an expectation (spec). The AI, as a "controller," handles the actual delivery of that expectation (finding the living room light and turning it on).

But the issue with Spec Coding is that it is "human-initiated" rather than "thing-initiated." In current smart home setups, many automation scenarios must be manually designed to control devices (e.g., sense a person and, if it's after sunset, trigger automatic lighting). In my view, the first principle of AGI is that data is stored on the user's own consumer electronics, with platforms using copy-on-write to minimize use of user data.

If base sensor data resides locally on the user's device, there is no "information silo" problem from the start. Consumer electronics carrying personal data can interconnect with other devices (e.g., the car) via sensors.

Active Companionship built on AGI is key to smart home automation flows and home robots. Take the afternoon nap scenario: with enough accumulated data (e.g., the user usually draws the curtains and turns off the lights after 12:00 on weekdays), correlations can be established. The smart home should be able to propose a suggestion ("On weekday afternoons, when I sense you, I'll turn off the lights and draw the curtains") and, after user authorization, automate it on weekdays.
