// Small helpers for exporting the project/session data live here.
import type { WizardDraft } from "@/types/contracts";

export function exportDraftAsJson(draft: WizardDraft) {
  const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${draft.projectMetadata.device.waferNumber || "qcl-project"}-prototype.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
