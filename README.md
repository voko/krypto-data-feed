# KriptoStream DLT Data Feed — Calculator

The demo application for the [JFrog PS Simulation](../README.md). A small interactive
command-line calculator, deliberately kept simple so that the interesting part is its *supply
chain*: how it is built, resolved, scanned, signed off and cleaned up across the six labs.

Repository: `voko/krypto-data-feed`

---

## The application

Prompts for two integers and an operator, prints the result, and repeats forever. `Ctrl-C`
exits cleanly.

```
  KriptoStream DLT Data Feed
  interactive integer calculator

  operators: +  -  *  /  %  ^
  press Ctrl-C to exit

first integer   > 12
operator        > *
second integer  > 11
  = 132
```

Bad input is routine rather than fatal — the loop reports it and prompts again:

```
first integer   > 7
operator        > /
second integer  > 0
  ! division by zero is undefined
```

### Layout

| Path                               | Role                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/calculator.js`                | Pure arithmetic. No I/O, no dependencies — every function is total in its arguments.                        |
| `src/parse.js`                     | Input validation. This is where **lodash** is genuinely used, and where Lab 5's vulnerable downgrade lands. |
| `src/cli.js`                       | Thin I/O shell: the prompt loop and signal handling.                                                        |
| `test/`                            | Unit tests for the two pure modules.                                                                        |
| `scripts/migrate-legacy-images.sh` | Lab 2 deliverable — bulk lift-and-shift of legacy Docker images.                                            |
| `.github/workflows/*.example`      | Reference solutions for Labs 3 and 5, shipped unarmed.                                                      |

The split is deliberate: parsing and arithmetic are pure and therefore worth unit-testing,
while `cli.js` is the untestable edge that just moves bytes.

---

## Running it

```bash
npm install
npm start          # or: node src/cli.js
npm test           # 29 unit tests, no test framework to install
```

Requires Node 20 or newer. The tests use the built-in `node:test` runner, so the only
dependencies in the tree are the two the application actually uses at runtime — which keeps
the SBOM in Lab 3 honest.

### In a container

The image builds on the `alpine:3.19` that Lab 2 migrates into Artifactory as `dlt-base:3.19`,
which doubles as proof the lift-and-shift produced a usable artifact:

```bash
# After Lab 2 (default): builds FROM the migrated Artifactory image
jf docker login --server-id kripto-admin
docker build -t krypto-calc .

# Before Lab 2: fall back to the public image
docker build --build-arg BASE_IMAGE=alpine:3.19 -t krypto-calc .

# The app is an interactive REPL, so -it is required
docker run -it --rm krypto-calc
```

The container runs as an unprivileged `krypto` user.

---

## Dependencies

| Package      | Version on `main` | Why                                                |
| ------------ | ----------------- | -------------------------------------------------- |
| `lodash`     | `4.17.21` (exact) | String/collection helpers in `src/parse.js`        |
| `picocolors` | `1.1.1` (exact)   | Terminal colour, ~2 kB, no transitive dependencies |

Versions are pinned exactly rather than floated with `^`. A caret range means the artifact you
scanned and the artifact you ship can differ, which is precisely what the DLTC-01 chain of
custody exists to prevent.

> **Lab 5 note.** `main` pins the *safe* `lodash@4.17.21`. Lab 5 opens a pull request that
> downgrades it to the vulnerable `4.16.11`, so Frogbot reports a genuinely newly-introduced
> vulnerability rather than pre-existing noise.

---

## Workflows

Both GitHub Actions workflows ship as `.example` files, because authoring them *is* the lab.
Use them as reference solutions after you have written your own.

| File                                            | Lab | Rename to             |
| ----------------------------------------------- | --- | --------------------- |
| `.github/workflows/jfrog-oidc.yml.example`      | 3   | `jfrog-oidc.yml`      |
| `.github/workflows/frogbot-scan-pr.yml.example` | 5   | `frogbot-scan-pr.yml` |

```bash
git mv .github/workflows/jfrog-oidc.yml.example .github/workflows/jfrog-oidc.yml
```

The build workflow resolves npm through Artifactory, runs the unit tests, builds and pushes the
Docker image, and publishes Build Info linking the artifact to its commit — no stored
credentials anywhere, only a short-lived OIDC token.

---

## How this repo maps to the labs

| Lab | What it does with this repository                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------- |
| 1   | Creates the repositories this project publishes into                                                        |
| 2   | Migrates the base image the `Dockerfile` builds FROM; `scripts/migrate-legacy-images.sh` is the deliverable |
| 3   | OIDC-authenticated build; publishes Build Info and the SBOM listing these dependencies                      |
| 4   | The Xray watch that gates the image this repo pushes                                                        |
| 5   | The vulnerable-lodash pull request and the Frogbot gate that blocks it                                      |
| 6   | Retention policy that cleans up the dev images CI accumulates                                               |
