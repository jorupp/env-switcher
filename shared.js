globalThis.EnvSwitcher = (() => {
  function normalizeBaseUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
      throw new Error("Enter a base URL.");
    }

    let url;
    try {
      url = new URL(value.trim());
    } catch {
      throw new Error("Enter a valid URL, including http:// or https://.");
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Base URLs must use http:// or https://.");
    }
    if (url.username || url.password) {
      throw new Error("Base URLs cannot contain a username or password.");
    }
    if ((url.pathname !== "" && url.pathname !== "/") || url.search || url.hash) {
      throw new Error("Use a site root as the base URL, without a path, query, or hash.");
    }

    return url.origin;
  }

  function validateApps(apps) {
    if (!Array.isArray(apps)) {
      return "Apps must be a list.";
    }

    const origins = new Set();
    for (const app of apps) {
      if (!app || typeof app !== "object" || typeof app.name !== "string" || !app.name.trim()) {
        return "Every app needs a name.";
      }
      if (!Array.isArray(app.environments) || app.environments.length === 0) {
        return `Add at least one environment to "${app.name.trim()}".`;
      }

      const environmentNames = new Set();
      for (const environment of app.environments) {
        if (
          !environment ||
          typeof environment !== "object" ||
          typeof environment.name !== "string" ||
          !environment.name.trim()
        ) {
          return `Every environment in "${app.name.trim()}" needs a name.`;
        }

        const environmentName = environment.name.trim().toLowerCase();
        if (environmentNames.has(environmentName)) {
          return `Environment names must be unique within "${app.name.trim()}".`;
        }
        environmentNames.add(environmentName);

        let origin;
        try {
          origin = normalizeBaseUrl(environment.url);
        } catch (error) {
          return `${app.name.trim()} / ${environment.name.trim()}: ${error.message}`;
        }

        if (origins.has(origin)) {
          return `The base URL ${origin} is already assigned to another environment.`;
        }
        origins.add(origin);
      }
    }

    return null;
  }

  function findMatch(currentUrl, apps) {
    const page = new URL(currentUrl);
    for (const app of apps) {
      for (const environment of app.environments) {
        if (normalizeBaseUrl(environment.url) === page.origin) {
          return { app, environment };
        }
      }
    }
    return null;
  }

  function mapPageUrl(currentUrl, targetBaseUrl) {
    const page = new URL(currentUrl);
    return `${normalizeBaseUrl(targetBaseUrl)}${page.pathname}${page.search}${page.hash}`;
  }

  return { normalizeBaseUrl, validateApps, findMatch, mapPageUrl };
})();
