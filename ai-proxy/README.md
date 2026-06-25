# Add "Ask Claude" to the Spanish Vocab app

This sets up a tiny free Cloudflare Worker that holds your Anthropic API key as a
secret, so the public web app can talk to Claude without ever exposing the key.

You'll do this once. It takes about 10 minutes. **I never see your key** — you
paste it into Cloudflare yourself.

---

## 1. Get an Anthropic API key
1. Go to <https://console.anthropic.com> → sign in.
2. **Billing** → add a small amount of credit (a few dollars lasts a long time
   at Haiku prices — roughly a fraction of a cent per question).
3. **API Keys** → **Create key** → copy it (starts with `sk-ant-...`).

## 2. Create the Cloudflare Worker
1. Go to <https://dash.cloudflare.com> → sign up (free) / sign in.
2. **Workers & Pages** → **Create** → **Create Worker**.
3. Give it a name, e.g. `spanish-ai`. Click **Deploy** (it deploys a hello-world).
4. Click **Edit code**. Delete everything in the editor, paste the full contents
   of `worker.js` (in this folder), then **Deploy**.
5. Copy your Worker URL — it looks like
   `https://spanish-ai.<your-subdomain>.workers.dev`.

## 3. Add your secrets
In the Worker's page → **Settings** → **Variables and Secrets**:
- Add a **Secret** named `ANTHROPIC_API_KEY` = your `sk-ant-...` key.
- (Recommended) Add a **Secret** named `APP_TOKEN` = any random string you make
  up (e.g. a password). This stops strangers from using your worker.
- (Recommended) Add a **Variable** named `ALLOWED_ORIGIN` =
  `https://rasoolzandvakil-boop.github.io`
  so only your app can call it.
Click **Deploy** to apply.

## 4. Connect the app
1. Open the app → **⚙ Settings** → **AI assistant**.
2. Paste your Worker URL into **AI assistant URL**.
3. If you set `APP_TOKEN`, paste the same value into **App token**.
4. Close settings. Go to **Class → Past lessons** — the **Ask Claude about your
   lessons** box at the top is now active.

---

## Costs & safety
- Model is `claude-3-5-haiku` (cheap). Change `DEFAULT_MODEL` in `worker.js` to a
  larger model if you want deeper answers.
- The `ALLOWED_ORIGIN` + `APP_TOKEN` settings keep casual abuse out. The token
  lives in your browser's local settings, not in the public source code.
- Cloudflare's free tier covers ~100k worker requests/day — far more than you'll
  use. Your only real cost is Anthropic API usage, which you control via the
  credit you add.
- To rotate the key later: create a new key in the Anthropic console, update the
  `ANTHROPIC_API_KEY` secret in Cloudflare, delete the old key.
