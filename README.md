# stanzawhere

Shared Cursor workspace for João’s stanzawhere tool. Load the app here first; then we harden it and host it.

## For João — load the app (do this)

You do not need git commands. Cursor runs them. Follow the internal guides, then paste the phrases below.

**Guides** (from the [stanza README](https://github.com/ai-stanza/stanza/blob/main/README.md)):

- [Git in Cursor — Setup](https://github.com/ai-stanza/stanza/blob/main/docs/guides/git-cursor/setup.html) — install Cursor, connect GitHub
- [Git in Cursor — Start](https://github.com/ai-stanza/stanza/blob/main/docs/guides/git-cursor/index.html) — mental model (branch → build → commit → push)
- [What to say](https://github.com/ai-stanza/stanza/blob/main/docs/guides/git-cursor/say.html) — pasteable phrases
- [DGX Spark — Cursor agents](https://github.com/ai-stanza/stanza/blob/main/docs/guides/dgx-spark/index.html) — **later**, for hosting / GPU. Skip until the app is in this repo.

Open the `.html` files in a browser after Cursor clones `ai-stanza/stanza`, or click the GitHub links and use **View file**.

### 1. Cursor + GitHub (once)

1. Install Cursor from [cursor.com/download](https://cursor.com/download), sign in with your Stanza account.
2. New Agent chat — paste the **Connect GitHub** prompt from [Setup](https://github.com/ai-stanza/stanza/blob/main/docs/guides/git-cursor/setup.html). When a code like `ABCD-EFGH` appears, enter it at [github.com/login/device](https://github.com/login/device) with your **work** GitHub (`jgsaramago`).
3. Confirm Cursor says you are connected as `jgsaramago`.

Skip Colophon unless you are also working in the stanza monorepo (that’s Setup step 3).

### 2. Open this project

New Agent chat — paste:

```
Clone https://github.com/ai-stanza/stanzawhere.git into ~/Projects/stanzawhere if it isn’t there, then open that folder as the Cursor workspace. Confirm I have write access and the folder is this repo, not the stanza monorepo.
```

### 3. Put your existing app in the repo

New Agent chat, with this folder open — paste (edit the path if your files live somewhere else):

```
Load my existing stanzawhere app into this repo.

1. Find my current app on this Mac (ask me if the path isn’t obvious).
2. Copy the app files into this workspace. Keep README.md, AGENTS.md, and .gitignore unless merging content into them.
3. Do not commit .env, secrets, API keys, or node_modules / venv.
4. Commit on main with a short message that the app is now in the shared repo.
5. Push to GitHub and give me the repo URL.

I should not have to run git myself.
```

When that’s done, ping Andrew. We’ll harden, then host (Spark / Cloudflare — [DGX Spark guide](https://github.com/ai-stanza/stanza/blob/main/docs/guides/dgx-spark/index.html)).

## Collaborators

- João Saramago (`jgsaramago`) — tool owner, write
- Andrew Stanza (`zaphodnothingth`) — admin
