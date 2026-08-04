// This keeps hosted builds from getting stuck on stale lazy-loaded chunks.
const RELOAD_FLAG = "qcl-dynamic-import-reload";

function isDynamicImportError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "";

  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("error loading dynamically imported module")
  );
}

export function recoverDynamicImportError(error: unknown) {
  if (!isDynamicImportError(error)) {
    return false;
  }

  try {
    // Only retry once so a genuinely broken build does not loop forever.
    if (window.sessionStorage.getItem(RELOAD_FLAG) === "1") {
      window.sessionStorage.removeItem(RELOAD_FLAG);
      return false;
    }

    window.sessionStorage.setItem(RELOAD_FLAG, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

export function clearDynamicImportRecoveryFlag() {
  try {
    window.sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    // ignore session storage failures
  }
}
