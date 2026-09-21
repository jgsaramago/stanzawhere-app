# StanzaWhere

Internal web app for Stanza colleagues to share **travel**, **PTO**, and **weekly location** on a people × timezone calendar — with country public holidays and a manager approval flow.

Guides: [https://ai-stanza.github.io/stanza/](https://ai-stanza.github.io/stanza/)

## Features

- **People rows** on the left; **day columns** across the week
- **Multi-timezone header** (PT / MT / CT / ET / WET / CET) with live local times
- Event types: **Travel**, **PTO**, **Week location**
- **Public holidays** for US and PT shown in the week strip and on each person’s home-country days
- **Approval workflow**: draft → pending → approved / rejected
- Flight email import, StanBot booking helper, editable profiles
- Data persisted in **localStorage** (seeded demo team included)

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://127.0.0.1:5173`).

## How to try the approval flow

1. Add a request with **+ Request** (defaults to pending).
2. Switch **Acting as** to the relevant approver (Darwin / Nick / Charlie).
3. Open **Approvals**, review, then approve or reject.

## Stack

Vite · React · TypeScript · date-fns · lucide-react

## Collaborators

- João Saramago (`jgsaramago`) — tool owner, write
- Andrew Stanza (`zaphodnothingth`) — admin
