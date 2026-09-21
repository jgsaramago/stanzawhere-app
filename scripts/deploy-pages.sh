#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Checking Pages + remotes"
gh api repos/jgsaramago/stanzawhere-app/pages --jq '{status,html_url,source}' || true
gh api repos/jgsaramago/stanzawhere-app/commits/gh-pages --jq '{sha:.sha,date:.commit.author.date,message:.commit.message}' || true

echo "==> Building"
GITHUB_PAGES=true npm run build
test -f dist/index.html
echo "Built index:"
cat dist/index.html

echo "==> Deploying dist to gh-pages"
rm -rf .gh-pages-deploy
mkdir .gh-pages-deploy
# Minimal git repo without hooks (sandbox-safe)
mkdir -p .gh-pages-deploy/.git/objects .gh-pages-deploy/.git/refs/heads
printf 'ref: refs/heads/gh-pages\n' > .gh-pages-deploy/.git/HEAD
printf '[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n\tlogallrefupdates = true\n\thooksPath = /dev/null\n' > .gh-pages-deploy/.git/config || true
cp -R dist/. .gh-pages-deploy/
# Cache-bust note file so commit always changes
date -u +"deployed=%Y-%m-%dT%H:%M:%SZ" > .gh-pages-deploy/deploy.txt
cd .gh-pages-deploy
git -c core.hooksPath=/dev/null add -A
git -c core.hooksPath=/dev/null \
  -c user.name='Joao Saramago' \
  -c user.email='jgsaramago@users.noreply.github.com' \
  commit -m "Deploy NYC Juxtapose week + roster titles"
git -c core.hooksPath=/dev/null push -f https://github.com/jgsaramago/stanzawhere-app.git HEAD:gh-pages

echo "==> Verify gh-pages tip"
gh api repos/jgsaramago/stanzawhere-app/commits/gh-pages --jq '{sha:.sha,message:.commit.message}'
gh api "repos/jgsaramago/stanzawhere-app/contents/index.html?ref=gh-pages" --jq .content | base64 -d

cd ..
rm -rf .gh-pages-deploy
echo DONE
