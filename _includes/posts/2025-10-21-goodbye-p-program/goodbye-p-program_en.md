After this year's generative AI explosion, I've lost much motivation to share technology.
For example, configuring this GitHub Action would have taken me 2-3 days before. This time, with OpenAI's help, it was completed within 3 hours.

## Hello, GitHub Action

The adjustment process is very simple:
1. Change [p-program.github.io](https://github.com/p-program/p-program.github.io) pages-GitHub Pages settings to default values, leave Custom domain blank
1. Resolve **Dependabot alerts** in the source code project
1. Add `.github/workflows/deploy.yml` to the source code project according to the prompts

After adjustment, you no longer need to export static HTML artifacts, DNS doesn't need to be modified (preventing free-riding), and it automatically updates on every push event—simply perfect, worth a try.

```yml
on:
  push:
    branches:
      - mster      # If your main branch is master / main / mster, adjust to the correct branch name
  # Keep manual trigger
  workflow_dispatch:
```

[https://www.bullshitprogram.com/](https://github.com/p-program/p-program.github.io) is a domain I bought back then when I had too many vouchers with nowhere to spend them.

Early articles were inspired by Wang Yin's personal experiences.

Reading Wang Yin's early articles (before he returned to China to do education), I always felt refreshed—he broke my prejudices about traditional programming concepts.

"Programming concepts can be like this?! So-called OOP is nothing special!"

Later, this website mainly published cutting-edge technical insights, or "P-programming studies."

## Resolving Some Historical Legacy Issues

```
Dependabot encountered an error performing the update

Error: The updater encountered one or more errors.

For more information see: https://github.com/p-program/readme/network/updates/1130827200 (write access to the repository is required to view the log)
```

Dependabot's security checks mainly target the project's supply chain system—some dependencies haven't been upgraded to secure versions. Fix according to prompts, or manually upgrade.

After working in information technology for many years, I've always held contradictory opinions about this industry. But overall, I'm mainly opposed.
Technological development hasn't truly liberated productivity; instead, it has made people tools for quantified calculation.

Just like in 2020, when I proposed [OOOS](https://www.bullshitprogram.com/one-open-operating-system/), using [AI as an intelligent API gateway](https://www.bullshitprogram.com/the-seed-of-robot/), my original intention was to use AI to quickly realize human creativity.

But as it appears today, most companies use it as a layoff tool, which is really infuriating.
