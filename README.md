# Env Switcher

Env Switcher is a dependency-free Chrome extension for opening the current page in another configured environment. For example, map `https://devserver` and `https://localhost:3000` to the same app, then open a page on either environment in the other one. The pathname, query string, and hash are preserved.

## Configure apps

1. Open the extension's **Manage apps** page from its toolbar popup (or from the extension details page).
2. Add an app, then add each environment with a name and a site-root base URL. For example, add `Dev` → `https://devserver` and `Local` → `https://localhost:3000`.
3. Select **Save changes**. Base URLs must use `http://` or `https://` and contain no path, query, or hash. Each base URL can belong to only one environment so a page resolves unambiguously.
4. Navigate to a page on one of those base URLs, open the Env Switcher toolbar button, and select the destination environment.

Settings are saved in Chrome's local extension storage. The extension uses `activeTab` to read the current page only when the toolbar button is opened, and `storage` to save the app mappings.

## Load the extension in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Select **Load unpacked**.
4. Choose the folder containing this `manifest.json` file.
5. (Optional) Pin **Env Switcher** from Chrome's Extensions menu for quick access.

After changing the extension files, return to `chrome://extensions` and select the extension's reload button.

## Development checks

Run the helper tests with Node.js:

```powershell
node --test .\tests\shared.test.cjs
```
