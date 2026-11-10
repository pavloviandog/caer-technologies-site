# Monthly CAER blog drafts

The workflow runs on the first of each month at 9:17 a.m. America/Chicago (DST aware), or manually from Actions → Monthly CAER blog draft → Run workflow. GitHub may delay scheduled runs. It generates one evergreen plain-English IT article with Python and the OpenAI Responses API, then opens a draft pull request with the static HTML article, blog index card, and sitemap entry. No Python dependencies are required.

## Enable after reviewing this setup pull request

1. Add an OpenAI API key as the repository Actions secret `OPENAI_API_KEY` under Settings → Secrets and variables → Actions. Never commit the key or paste it into a PR. API billing is separate from ChatGPT subscriptions.
2. Under Settings → Actions → General → Workflow permissions, enable **Allow GitHub Actions to create and approve pull requests**. This automation only creates PRs; it does not approve them.
3. Optionally set the repository variable `OPENAI_MODEL`; the default is `gpt-4.1-mini`. Use a model available to your API project that supports Responses and structured outputs. One bounded API request is made per new monthly draft; reruns reuse an existing PR or branch and preserve human edits. There are no automatic API retries.
4. In Cloudflare Pages, verify that production builds track only `main`. For stronger protection, exclude `automation/*` branches from preview builds. The setup and generated draft commits start with `[CF-Pages-Skip]`, which Cloudflare Pages documents as suppressing deployment. This does not configure or guarantee behavior for custom deploy hooks or Cloudflare Workers Builds: confirm those are disabled or require approval before enabling the schedule.
5. Merge the setup PR only after review. It creates no blog content. Run the workflow manually to create the first content draft; otherwise the next scheduled run creates it. You can provide a month (`YYYY-MM`) and optional evergreen topic.

## Review and publish

Review each draft's facts, advice, tone, similarity to existing posts, company claims, and date. The generator has no live research and must not be used as a source of current news or regulatory guidance. Text is escaped before insertion into the HTML template; the model cannot inject executable markup. The page uses the site's existing shared stylesheet, header, footer, and contact link. Its blog card uses the Beginner filter.

Mark the PR ready, approve/review it, and merge when you want the content published. Remove `[CF-Pages-Skip]` from the final merge/squash commit message so the existing Cloudflare production integration can build. The workflow never pushes to `main`, merges PRs, installs Cloudflare credentials, or invokes deployment. Before approval, retain the skip prefix on any edited branch commits.

An existing monthly PR (including a closed or merged one) prevents another draft and another API charge for that month. A pushed branch without a PR is recovered by opening its PR without regenerating content. To intentionally restart a rejected draft, first decide how to handle its existing branch/PR or choose a different month. Do not force-push over editorial work.

The current `main` branch is unprotected. The review process is procedural until repository rules are configured. Consider requiring PR review and restricting direct pushes, with rules suitable for your reviewer setup (a PR author cannot approve their own PR). Cloudflare settings and repository protections are external settings, not changed by this PR.

## Checks and operations

Run `python -m unittest discover -s tests -v`. Tests use synthetic data, require no secrets, and make no API requests. A separate PR workflow runs these tests; GitHub may require initial workflow approval. PRs created using `GITHUB_TOKEN` do not normally trigger other Actions workflows, so these monthly content PRs require manual editorial review; rendering and validation happen inside the generator before the commit.

Failures appear in Actions; no partial generated output is pushed when generation or validation fails. Missing keys and disabled PR creation must be fixed in repository settings. Public-repository schedules can be disabled by GitHub after 60 days of inactivity. Keep an eye on Actions and re-enable if needed. To pause generation, disable the Monthly CAER blog draft workflow.

References: [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), [GitHub scheduled workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [Cloudflare Pages GitHub integration and skip prefixes](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/).
