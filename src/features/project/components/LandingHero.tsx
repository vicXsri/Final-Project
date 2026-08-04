// Session import/export and the first workflow actions start from this hero block.
import type { ChangeEvent } from "react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWizard } from "@/features/wizard/context/WizardContext";

export function LandingHero() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { draft, replaceDraft, exportDraft, importDraftFromPicker, resetDraft } = useWizard();

  const hasSavedData =
    draft.projectMetadata.author.trim() !== "" ||
    draft.projectMetadata.device.waferNumber.trim() !== "" ||
    Object.values(draft.traceAssignments).some((assignment) => assignment.files.length > 0 || assignment.notes.trim() !== "");

  const handleJsonImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      replaceDraft(JSON.parse(text));
      navigate("/wizard/setup");
    } catch (error) {
      window.alert(`Could not load session JSON: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      event.target.value = "";
    }
  };

  const handleImportClick = async () => {
    try {
      const file = await importDraftFromPicker();
      if (!file) {
        fileInputRef.current?.click();
        return;
      }

      const text = await file.text();
      replaceDraft(JSON.parse(text));
      navigate("/wizard/setup");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      window.alert(`Could not load session JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="grid gap-6">
      <Card className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => void handleImportClick()}>
            Import Session JSON
          </Button>
          <Button type="button" variant="outline" onClick={() => void exportDraft()}>
            Export Session JSON
          </Button>
          {hasSavedData ? (
            <Button onClick={() => navigate("/wizard/setup")}>
              Continue Saved Session
            </Button>
          ) : null}
          <Button
            variant={hasSavedData ? "outline" : "default"}
            onClick={() => {
              resetDraft();
              navigate("/wizard/setup");
            }}
          >
            Project
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleJsonImport}
          />
        </div>

      </Card>
    </div>
  );
}
