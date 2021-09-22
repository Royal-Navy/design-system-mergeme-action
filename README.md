# mergeme-action



This GitHub Action approves and attempts to merge Pull Requests when triggered. Cloned from [ridedott/merge-me-action](https://github.com/ridedott/merge-me-action)

By using
[branch protection](https://docs.github.com/en/free-pro-team@latest/github/administering-a-repository/about-protected-branches)
rules, it can be specified what the requirements are for a PR to be merged (e.g.
require branches to be up to date, require status checks to pass).

## Usage

The Action supports three run triggers:

- `check_suite` (works only on the default branch).
- `pull_request_target` for all branches.
- `workflow_run` for all branches.

When using the Merge Me! Action, ensure security of your workflows. GitHub
Security Lab provides more
[detailed](https://securitylab.github.com/research/github-actions-preventing-pwn-requests/)
overview of these risks involved in using `pull_request_target` and
`workflow_run` triggers, as well as recommendations on how to avoid these risks.

Recommended setup differs between public and private repositories, however the
Action can be used in other combinations as well.

### Public repositories

Using a `workflow_run` trigger allows to provide the Merge Me! Action with
necessary credentials, while allowing the CI to keep using `pull_request`
trigger, which is safer than `pull_request_target`.

Create a new `.github/workflows/merge-me.yaml` file:

```yaml
name: Merge me!

on:
  workflow_run:
    types:
      - completed
    workflows:
      # List all required workflow names here.
      - 'Continuous Integration'

jobs:
  merge-me:
    name: Merge me!
    runs-on: ubuntu-latest
    steps:
      - # It is often a desired behavior to merge only when a workflow execution
        # succeeds. This can be changed as needed.
        if: ${{ github.event.workflow_run.conclusion == 'success' }}
        name: Merge me!
        uses: defencedigital/design-system-mergeme-action@master
        with:
          # Depending on branch protection rules, a  manually populated
          # `GITHUB_TOKEN_WORKAROUND` secret with permissions to push to
          # a protected branch must be used. This secret can have an arbitrary
          # name, as an example, this repository uses `DOTTBOTT_TOKEN`.
          #
          # When using a custom token, it is recommended to leave the following
          # comment for other developers to be aware of the reasoning behind it:
          #
          # This must be used as GitHub Actions token does not support pushing
          # to protected branches.
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Triggering on `check_suite` is similar:

```yaml
name: Merge me!

on:
  check_suite:
    types:
      - completed

jobs:
  merge-me:
    name: Merge me!
    runs-on: ubuntu-latest
    steps:
      - name: Merge me!
        uses: defencedigital/design-system-mergeme-action@master
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Private repositories

Private repositories are less prone to attacks, as only a restricted set of
accounts has access to them. At the same time, CIs in private repositories often
require access to secrets for other purposes as well, such as installing private
dependencies. For these reasons, it is recommended to use `pull_request_target`
trigger, which allows to combine regular CI checks and the Merge Me! Action into
one workflow:

```yaml
name: Continuous Integration

on:
  # Trigger on Pull Requests against the master branch.
  pull_request_target:
    branches:
      - master
    types:
      - opened
      - synchronize
  # Trigger on Pull Requests to the master branch.
  push:
    branches:
      - master

jobs:
  # Add other CI jobs, such as testing and linting. The example test job
  # showcases checkout settings which support `pull_request_target` and `push`
  # triggers at the same time.
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
        with:
          # This adds support for both `pull_request_target` and `push` events.
          ref: ${{ github.event.pull_request.head.sha || github.sha }}
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: 16
          registry-url: https://npm.pkg.github.com
      - # This allows private dependencies from GitHub Packages to be installed.
        # Depending on the setup, it might be required to use a personal access
        # token instead.
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        name: Install dependencies
        run: npm ci --ignore-scripts --no-audit --no-progress
      - name: Test
        run: npm run test
  merge-me:
    name: Merge me!
    needs:
      # List all required job names here.
      - test
    runs-on: ubuntu-latest
    steps:
      - name: Merge me!
        uses: defencedigital/design-system-mergeme-action@master
        with:
          # Depending on branch protection rules, a  manually populated
          # `GITHUB_TOKEN_WORKAROUND` secret with permissions to push to
          # a protected branch must be used. This secret can have an arbitrary
          # name, as an example, this repository uses `DOTTBOTT_TOKEN`.
          #
          # When using a custom token, it is recommended to leave the following
          # comment for other developers to be aware of the reasoning behind it:
          #
          # This must be used as GitHub Actions token does not support pushing
          # to protected branches.
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    timeout-minutes: 5
```

## Configuration

### Enable auto-merge for a different bot

You may have another bot that also creates PRs against your repository and you
want to automatically merge those. By default, this GitHub Action assumes the
bot is [`dependabot`](https://github.com/dependabot). You can override the bot
name by changing the value of `GITHUB_LOGIN` parameter:

```yaml
jobs:
  merge-me:
    steps:
      - name: Merge me!
        uses: defencedigital/design-system-mergeme-action@master
        with:
          GITHUB_LOGIN: my-awesome-bot-r2d2
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```


`GITHUB_LOGIN` option supports
[micromatch](https://github.com/micromatch/micromatch).

### Use of configurable pull request merge method

By default, this GitHub Action assumes merge method is `SQUASH`. You can
override the merge method by changing the value of `MERGE_METHOD` parameter (one
of `MERGE`, `SQUASH` or `REBASE`):

```yaml
jobs:
  merge-me:
    steps:
      - name: Merge me!
        uses: defencedigital/design-system-mergeme-action@master
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          MERGE_METHOD: MERGE
```

### Presets

Presets enable additional functionality which can be used to better personalize
default behavior of the Merge me! Action.

Available presets are:

- `DEPENDABOT_MINOR` - Merge only minor and patch dependency updates for pull
  requests created by Dependabot if the dependency version follows
  [Semantic Versioning v2](https://semver.org/).
- `DEPENDABOT_PATCH` - Merge only patch dependency updates for pull requests
  created by Dependabot if the dependency version follows
  [Semantic Versioning v2](https://semver.org/).

```yaml
jobs:
  merge-me:
    steps:
      - name: Merge me!
        uses: defencedigital/design-system-mergeme-action@master
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PRESET: DEPENDABOT_PATCH
```

### Number of retries

In case the merge action fails, by default it will automatically be retried up
to three times using an exponential backoff strategy. This means, the first
retry will happen 1 second after the first failure, while the second will happen
4 seconds after the previous, the third 9 seconds, and so on.

It's possible to configure the number of retries by providing a value for
`MAXIMUM_RETRIES` (by default, the value is `3`).

```yaml
jobs:
  merge-me:
    steps:
      - name: Merge me!
        uses: defencedigital/design-system-mergeme-action@master
        with:
          MAXIMUM_RETRIES: 2
```

### Enable for manual changes

There are cases in which manual changes are needed, for instance, in order to
make the CI pass or to solve some conflicts that Dependabot (or the bot you are
using) cannot handle. By default, this GitHub action will skip this case where
the author is not [`dependabot`](https://github.com/dependabot) (or the bot you
are using). This is often desirable as the author might prefer to get a code
review before merging the changes. For this, it checks whether all commits were
made by the original author and that the commit signature is valid.

It is possible to override this default behavior by setting the value of
`ENABLED_FOR_MANUAL_CHANGES` to `'true'`.

```yaml
jobs:
  merge-me:
    steps:
      - name: Merge me!
        uses: defencedigital/design-system-mergeme-action@master
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ENABLED_FOR_MANUAL_CHANGES: 'true'
```

> Important: Please note the single quotes around `true`.


## Built with

### Automation

- [Dependabot](https://dependabot.com/)
- [GitHub Actions](https://github.com/features/actions)

### Source

- [TypeScript](https://www.typescriptlang.org)

