# Deploying, and locking down `/admin`

The admin panel serves member names, phone numbers, emails and emergency
contacts. **Until you complete step 3, deploying this publishes all of it.**

There are two locks, and you want both:

| Lock | Where | Protects against |
|---|---|---|
| **1. Cloudflare Access** | Cloudflare dashboard | Everyone. The actual gate. |
| **2. Application backstop** | `middleware.ts` in this repo | Access being absent, misconfigured, or switched off |

Lock 1 is the gate. Lock 2 exists because Lock 1 lives entirely in a dashboard
where nobody reviewing this repo can see it, nothing fails if it is deleted,
and a path policy that stops matching silently reopens the admin panel.

---

## 1. Apply migrations to the remote database

```bash
npm run db:migrate:remote
```

Optionally seed demo data (it is obviously synthetic, but there is no reason to
ship it):

```bash
npm run db:seed:remote
```

## 2. Deploy

```bash
npm run deploy
```

This builds with OpenNext and pushes to Cloudflare Workers. Note where it lands —
the output ends with a `*.workers.dev` URL.

## 3. Turn on Cloudflare Access ← **do this before sharing the URL**

### a. Enable Zero Trust (free, no card required)

1. Cloudflare dashboard → **Zero Trust**
2. Choose a **team name**, e.g. `pulsegym`
3. This becomes your team domain: `pulsegym.cloudflareaccess.com`

### b. Create the Access application

4. **Workers & Pages** → your worker → **Access** tab
5. Choose **Protect a specific hostname, Custom Domain, or path**
6. Path: **`/admin`**

> ⚠️ **Use a path, not Worker-level Access.** Worker-level gates the whole
> Worker, which includes your public marketing page — you would hide your own
gym. Access hierarchy applies the most specific rule first, so a path rule wins.

7. Include: **Previews + Production** (or production only if you prefer)

### c. Who gets in

8. Add a policy:
   - **Action:** `Allow`
   - **Include:** `Emails`, then list each person:

```
you@gmail.com
manager@pulsegym.in
frontdesk@pulsegym.in
```

9. Save.

That is the whole gate. Each person visits `/admin`, enters their email, receives
a 6-digit code, and is in. No passwords, no shared secret, nothing to leak.

**Adding someone later** — add their email to that list. No deploy.
**Removing someone** — delete the line. They lose access on their next request.
**Removing someone *now*** — Zero Trust → **Users** → the person → **Revoke**.
Kills live sessions immediately.

Anyone not on the list gets a Cloudflare 403. The Worker never runs.

## 4. Turn on the application backstop

Copy the AUD tag and team domain from the Access application, then put them in
your **build** environment:

```bash
# .env  (gitignored — see .env.example)
ACCESS_TEAM_DOMAIN=pulsegym.cloudflareaccess.com
ACCESS_AUD=<the Application Audience tag>
```

Then **rebuild and redeploy**. These are read at build time.

> **Why build time?** Next.js middleware runs in the edge runtime and only sees
> environment variables that existed when the bundle was built. Worker `vars`
> are runtime values and are invisible to it. Setting them as `vars` will
> silently leave the guard off.
>
> Neither value is a secret. Both appear in any Access-protected URL.

With these set, a request reaching `/admin` without a valid Access JWT gets a
403 **from the application itself** — so a dashboard mistake no longer means
public member data.

---

## Verification

Do these after deploying. The first one matters most.

```bash
# 1. Is the admin actually gated? Open an INCOGNITO window, logged out:
#      https://your-app.workers.dev/admin
#    Expected: a Cloudflare Access login page. Anything else means it is PUBLIC.

# 2. Is the marketing site still public?
#      https://your-app.workers.dev/
#    Expected: the landing page loads normally.

# 3. Does the API answer without a session? Should NOT return member JSON.
curl -s -o /dev/null -w '%{http_code}\n' https://your-app.workers.dev/admin/api/members
#    Expected: 403 (from Cloudflare, or from the backstop)
```

### Checking the backstop locally

Set the two variables to anything, restart `npm run dev`, and visit `/admin`:

```
403 — not authorised   No Cloudflare Access token on the request.
```

That proves the middleware is live. Then blank them again — with no config the
guard allows the request and logs a warning, because Access does not exist on
localhost.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| `/admin` is public in production | Path policy does not match. Re-check the path is `/admin`, not `/admin/` or the bare hostname |
| Marketing site asks for login | Access is Worker-level, not path-level. Scope it to `/admin` |
| `403 — not authorised` for a legitimate admin | They are not coming through Access. Usually a bookmark to a hostname outside the policy |
| `403` for everyone, all the time | `ACCESS_AUD` does not match the application's AUD tag, or the team domain has a typo |
| Backstop never fires even with config set | The variables were set as Worker `vars` rather than at build time |
| Console warns `UNPROTECTED` in production | The backstop is off. Expected locally; a real gap in production |

---

## What is still missing

- **No pre-commit hook.** `npm run verify` and `npm run test:e2e` are manual.
- **Scheduled reminders** (module 8) are unbuilt. When they arrive they need a
  cron Worker, because `@opennextjs/cloudflare` exports only `fetch` — a cron
  trigger on this Worker would fire at nothing. See ARCHITECTURE.md.
- **No rate limiting** on the login attempt path. Cloudflare Access handles
  that for the admin area; the public API has only `/api/health`.
