# stanzawhere

Shared Cursor workspace for João’s stanzawhere tool. Load the app here first; then we harden it and host it.

## For João — load the app (do this)

You do not need git commands. Paste into Cursor Agent.

**Docs** — new Agent chat with no folder open, paste:

```
Clone https://github.com/ai-stanza/stanza.git if needed and host docs/guides/git-cursor and docs/guides/dgx-spark as local pages; give me the URLs.
```

Then follow Setup (GitHub connect only — Cursor is already installed), Start, and What to say. Spark is later, after the app is in this repo.

### 1. GitHub (once)

Paste the **Connect GitHub** prompt from Setup. When a code like `ABCD-EFGH` appears, enter it at [github.com/login/device](https://github.com/login/device) with work GitHub `jgsaramago`.

### 2. Open this project

```
Clone https://github.com/ai-stanza/stanzawhere.git into ~/Projects/stanzawhere if it isn’t there, then open that folder as the Cursor workspace. Confirm I have write access and the folder is this repo, not the stanza monorepo.
```

### 3. Put your existing app in the repo

```
Load my existing stanzawhere app into this repo.

1. Find my current app on this Mac (ask me if the path isn’t obvious).
2. Copy the app files into this workspace. Keep README.md, AGENTS.md, and .gitignore unless merging content into them.
3. Do not commit .env, secrets, API keys, or node_modules / venv.
4. Commit on main with a short message that the app is now in the shared repo.
5. Push to GitHub and give me the repo URL.

I should not have to run git myself.
```

When that’s done, ping Andrew.

## Collaborators

- João Saramago (`jgsaramago`) — tool owner, write
- Andrew Stanza (`zaphodnothingth`) — admin
