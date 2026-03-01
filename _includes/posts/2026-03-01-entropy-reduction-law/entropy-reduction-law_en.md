
I once proposed the first paradox of information technology: information technology is an anti-human technology. In my article [The Twilight of the Public Cloud](https://www.zeusro.com/2026/02/04/fimbulwinter/?lang=en), I summarized the law of entropy increase in the IT industry and "Rule Zero" — nobody wants to do code refactoring whose marginal benefit is zero.

Today I want to refute Rule Zero and propose a new "The Second Law of Information Technology" — in post-modern programming, the human purpose is to reduce the time-series complexity of code (n<n-1).

## The Rationality of Legacy Code and the Necessity of Refactoring

If you have ever decompiled the Android APK of a game, you will find a large number of redundant art assets inside — assets completely unrelated to the current version. They are historically inherited garbage code.

Due to Rule Zero, no programmer is willing to refactor or delete these art assets. This also explains why the installation package of *Honor of Kings* kept growing, until solutions like "clear historical props" and "modular on-demand resource downloads" were finally proposed — though some players complained that after the update, the "Zongzi" skin turned into a pile of bot-like icons.

Why does this happen? It comes down to a basic principle of game theory: **a local optimum is not necessarily a global optimum**. For game developers, constructing new narratives is essential for generating new revenue. Clearing historical technical debt has no direct reflection on the game's financials.

But for players and operators, bloated installation packages drive up CDN traffic costs, and the accumulation of garbage code prolongs the time users need to download and open the game — and may even cause lag.

If you use the law of entropy increase to evaluate the software development process, you will find that a "shit mountain" codebase is inevitable — to some extent, it is a form of "defensive programming" by software engineers.

## Defensive Programming or Over-Engineering?

From a political-economic perspective, software engineers are fundamentally still "migrant workers" who do not own the means of production. From the moment they join a company, everything they think and write becomes the company's "digital assets." This is reflected in the US TV series *Silicon Valley*: while working at Hooli, Richard used his personal time (though partially on company computers for testing) to develop a revolutionary lossless data compression algorithm, and founded Pied Piper on that basis.

As Pied Piper began to gain traction, Hooli (led by Gavin Belson) formally sued Pied Piper in season two, accusing Richard of "stealing" Hooli's intellectual property (copyright infringement), claiming that under Richard's employment contract with Hooli (which included an invention assignment clause), all code and related technology he developed during his employment belonged to Hooli.

![](/img/in-post/entropy-reduction-law/GT5mot-XYAAI9Z3.jpeg)

Fighting the company is unwise. To guard against the risk of being laid off, software engineers resort to more than just avoiding documentation — abusing design patterns, using reflection for implicit method calls, and over-engineering are all common tactics.

I sometimes genuinely don't understand: employers ask me about "single-machine high concurrency" and "flash sale" scenarios just to negotiate salaries down. The most absurd was being asked about "millions of users online simultaneously" — I took one look at the salary range for that position.

With AI assistance, I could certainly design a workflow to handle these scenarios. The real question is: after deploying Redis distributed locks, Redis clusters, Kubernetes HPA auto-scaling, microservices, and message broker decoupling — where is the actual return on that code? Does our product truly have that many paying users? Is it appropriate to hand a critical system over to an employee of a marginal third-party vendor?

Back to that interview: I didn't bother wasting my time with them. I suggested they run a Weibo lottery to solve the flash sale problem, then hit `Command+Q` to end the entire remote session.

## Scientific Entropy Reduction Makes Everyone's Life Easier

Looking back at the world after World War II, we rebuilt towering structures from ruins. Information technology has not yet reached a hundred years, and already the final horn is sounding. If this industry is destined to gradually fade with the rise of artificial intelligence, then use less C++ (avoid sudden death), use more GC languages, and serve as the final QA for AI coding.

That way you can still see a sky that hasn't faded when you leave work each day — isn't that a good thing?

## n<n-1
