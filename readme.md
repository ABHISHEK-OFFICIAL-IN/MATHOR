# Maths Notebook — PWA

14 handwritten-style maths tools. Works offline once loaded.

## Files
- `index.html` — the app
- `logo.jpg` — 512×512 square icon (you supply)
- `manifest.json` — PWA metadata + shortcuts
- `sw.js` — service worker (offline cache)
- `offline.html` — offline fallback page

## Run locally
Service workers need **HTTPS or localhost**.

### Option A — Python (already installed on Mac/Linux)
```bash
cd your-folder
python3 -m http.server 8080
# open http://localhost:8080
```

### Option B — Node
```bash
npx serve .
```

### Option C — VS Code
Install "Live Server" → right-click `index.html` → **Open with Live Server**.

> ⚠️ Just double-clicking `index.html` (file://) will **not** register the service worker or enable install. You must serve over http://localhost.

## Test the install prompt
1. Serve the folder (above).
2. Open the page in Chrome/Edge.
3. Click the **⬇ Install app** button (appears in the header) or use the install icon in the address bar.
4. On Android Chrome / iOS Safari, use **Add to Home Screen**.
5. Then toggle **DevTools → Application → Service Workers → Offline** to test offline mode.

## Logo requirements
- **Filename:** `logo.jpg` (exactly, lowercase)
- **Size:** at least **512×512** pixels, square
- **Format:** JPG
- The manifest reuses the same file for 192, 512 and maskable — a single high-res square JPG is fine.

## Deep-link shortcuts (optional)
The manifest's app shortcuts open `index.html?tool=lcm`, `?tool=div`, etc.
To make them actually switch tabs, paste this **before `</body>`** in `index.html`:

```html
<script>
  (function () {
    const tool = new URLSearchParams(location.search).get('tool');
    if (!tool) return;
    const tab = document.querySelector('.tab[data-tab="' + tool + '"]');
    if (tab) tab.click();
  })();
</script>
```

## Shipping an update
1. Change HTML/CSS/JS.
2. Open `sw.js` and bump `const VERSION = 'v1.0.1';` (or whatever).
3. Reload — old cache is wiped, new one installed.

If you forget to bump the version, users may keep seeing the old cached copy.

## Deploying
Any static host works — GitHub Pages, Netlify, Vercel, Cloudflare Pages, Firebase Hosting.
Just upload all 5 files to the same folder. No build step.

### GitHub Pages quick path
1. Create a repo, upload the files.
2. **Settings → Pages → Deploy from branch → main / root**.
3. Open `https://<username>.github.io/<repo>/` — install works immediately (HTTPS).

## Checklist
- [ ] `logo.jpg` in the same folder as `index.html`
- [ ] Serving over `http://localhost` or HTTPS (not `file://`)
- [ ] DevTools → Application → Manifest → no errors
- [ ] DevTools → Application → Service Workers → **activated and running**
- [ ] Toggle Offline → page still loads