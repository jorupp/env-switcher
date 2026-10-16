let apps = [];

const appsList = document.querySelector("#apps-list");
const status = document.querySelector("#status");
const saveButton = document.querySelector("#save-button");

function setStatus(text, isError = false) {
  status.textContent = text;
  status.classList.toggle("error", isError);
}

function markDirty() {
  setStatus("Unsaved changes.");
}

function createField(labelText, value, onInput, inputType = "text") {
  const label = document.createElement("label");
  label.className = "environment-field";
  const caption = document.createElement("span");
  caption.textContent = labelText;
  const input = document.createElement("input");
  input.type = inputType;
  input.value = value ?? "";
  input.addEventListener("input", () => onInput(input.value));
  label.append(caption, input);
  return label;
}

function renderApps() {
  if (apps.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "No apps yet. Add an app, then add its environments.";
    appsList.replaceChildren(emptyState);
    return;
  }

  appsList.replaceChildren(
    ...apps.map((app) => {
      const card = document.createElement("section");
      card.className = "app-card";

      const header = document.createElement("div");
      header.className = "app-header";
      const nameLabel = document.createElement("label");
      nameLabel.className = "app-name-field";
      nameLabel.append(document.createTextNode("App name"));
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.maxLength = 80;
      nameInput.value = app.name;
      nameInput.addEventListener("input", () => {
        app.name = nameInput.value;
        markDirty();
      });
      nameLabel.append(nameInput);

      const removeApp = document.createElement("button");
      removeApp.type = "button";
      removeApp.className = "remove-button";
      removeApp.textContent = "Remove app";
      removeApp.addEventListener("click", () => {
        apps = apps.filter((item) => item !== app);
        renderApps();
        markDirty();
      });
      header.append(nameLabel, removeApp);

      const environmentList = document.createElement("div");
      environmentList.className = "environment-list";
      app.environments.forEach((environment) => {
        const row = document.createElement("div");
        row.className = "environment-row";
        const nameField = createField("Environment", environment.name, (value) => {
          environment.name = value;
          markDirty();
        });
        const urlField = createField("Base URL", environment.url, (value) => {
          environment.url = value;
          markDirty();
        }, "url");
        const removeEnvironment = document.createElement("button");
        removeEnvironment.type = "button";
        removeEnvironment.className = "remove-button";
        removeEnvironment.textContent = "Remove";
        removeEnvironment.addEventListener("click", () => {
          app.environments = app.environments.filter((item) => item !== environment);
          renderApps();
          markDirty();
        });
        row.append(nameField, urlField, removeEnvironment);
        environmentList.append(row);
      });

      const addEnvironment = document.createElement("button");
      addEnvironment.type = "button";
      addEnvironment.className = "add-environment-button";
      addEnvironment.textContent = "Add environment";
      addEnvironment.addEventListener("click", () => {
        app.environments.push({
          id: crypto.randomUUID(),
          name: "",
          url: ""
        });
        renderApps();
        markDirty();
      });

      card.append(header, environmentList, addEnvironment);
      return card;
    })
  );
}

document.querySelector("#add-app-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const nameInput = document.querySelector("#new-app-name");
  const name = nameInput.value.trim();
  if (!name) {
    setStatus("Enter an app name before adding it.", true);
    return;
  }

  apps.push({
    id: crypto.randomUUID(),
    name,
    environments: []
  });
  nameInput.value = "";
  renderApps();
  markDirty();
});

saveButton.addEventListener("click", async () => {
  const validationError = EnvSwitcher.validateApps(apps);
  if (validationError) {
    setStatus(validationError, true);
    return;
  }

  apps = apps.map((app) => ({
    ...app,
    name: app.name.trim(),
    environments: app.environments.map((environment) => ({
      ...environment,
      name: environment.name.trim(),
      url: EnvSwitcher.normalizeBaseUrl(environment.url)
    }))
  }));

  try {
    await chrome.storage.local.set({ apps });
    renderApps();
    setStatus("Changes saved.");
  } catch (error) {
    setStatus(`Couldn't save settings: ${error.message}`, true);
  }
});

async function initializeOptions() {
  try {
    const stored = await chrome.storage.local.get("apps");
    apps = stored.apps ?? [];
    if (!Array.isArray(apps)) {
      throw new Error("Saved apps data is not a list.");
    }
    renderApps();

    const validationError = EnvSwitcher.validateApps(apps);
    if (validationError) {
      setStatus(`Saved settings need attention: ${validationError}`, true);
    }
  } catch (error) {
    setStatus(`Couldn't load settings: ${error.message}`, true);
  }
}

initializeOptions();
