const message = document.querySelector("#message");
const pageDetails = document.querySelector("#page-details");
const targetList = document.querySelector("#targets");

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
  message.hidden = false;
  pageDetails.hidden = true;
}

document.querySelector("#manage-button").addEventListener("click", async () => {
  try {
    await chrome.runtime.openOptionsPage();
  } catch (error) {
    showMessage(`Couldn't open settings: ${error.message}`, true);
  }
});

async function initializePopup() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) {
      showMessage("This tab's address isn't available.");
      return;
    }

    const stored = await chrome.storage.local.get("apps");
    const apps = stored.apps ?? [];
    const validationError = EnvSwitcher.validateApps(apps);
    if (validationError) {
      showMessage(`Settings need attention: ${validationError}`, true);
      return;
    }

    const match = EnvSwitcher.findMatch(tab.url, apps);
    if (!match) {
      showMessage(
        apps.length
          ? "This page doesn't match any configured environment."
          : "No apps configured yet. Add an app to get started."
      );
      return;
    }

    message.hidden = true;
    pageDetails.hidden = false;
    document.querySelector("#app-name").textContent = match.app.name;
    document.querySelector("#current-environment").textContent =
      `Current environment: ${match.environment.name}`;

    const targets = match.app.environments.filter(
      (environment) => environment !== match.environment
    );
    if (targets.length === 0) {
      const note = document.createElement("p");
      note.textContent = "Add another environment to this app to switch pages.";
      targetList.replaceChildren(note);
      return;
    }

    targetList.replaceChildren(
      ...targets.map((environment) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = `Open in ${environment.name}`;
        button.addEventListener("click", async () => {
          try {
            const url = EnvSwitcher.mapPageUrl(tab.url, environment.url);
            await chrome.tabs.create({ url, active: true });
            window.close();
          } catch (error) {
            showMessage(`Couldn't open the page: ${error.message}`, true);
          }
        });
        return button;
      })
    );
  } catch (error) {
    showMessage(`Couldn't load environment settings: ${error.message}`, true);
  }
}

initializePopup();
