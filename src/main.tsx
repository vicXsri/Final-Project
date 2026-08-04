// This is the entry point that boots React and catches early startup failures.
// This is the entry point that boots React and catches early startup failures.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import { clearDynamicImportRecoveryFlag, recoverDynamicImportError } from "@/lib/dynamicImportRecovery";

const rootElement = document.getElementById("root");

function renderStartupError(error: unknown) {
  if (!rootElement) {
    return;
  }

  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  rootElement.innerHTML = `
    <div style="padding:24px;font-family:Segoe UI,Arial,sans-serif;color:#102033;">
      <div style="max-width:960px;border:1px solid #d5e0ea;background:#ffffffcc;border-radius:16px;padding:20px;">
        <h1 style="margin:0 0 12px;font-size:24px;">Startup Error</h1>
        <p style="margin:0 0 12px;">The app failed before the UI could render.</p>
        <pre style="white-space:pre-wrap;word-break:break-word;background:#f8fbfd;padding:12px;border-radius:12px;">${message}</pre>
      </div>
    </div>
  `;
}

window.addEventListener("error", (event) => {
  if (recoverDynamicImportError(event.error ?? event.message)) {
    return;
  }

  renderStartupError(event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  if (recoverDynamicImportError(event.reason)) {
    return;
  }

  renderStartupError(event.reason);
});

async function startApp() {
  try {
    const { default: App } = await import("@/app/App");

    if (!rootElement) {
      throw new Error("Root element '#root' was not found.");
    }

    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    clearDynamicImportRecoveryFlag();
  } catch (error) {
    if (recoverDynamicImportError(error)) {
      return;
    }

    renderStartupError(error);
  }
}

void startApp();
