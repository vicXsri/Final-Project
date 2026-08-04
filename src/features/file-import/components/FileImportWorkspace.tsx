// This ties a file-upload step to the correct wizard navigation logic.
// This ties a file-upload step to the correct wizard navigation logic.
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useWizard } from "@/features/wizard/context/WizardContext";
import { getFileStepNavigation } from "@/features/wizard/lib/wizardSteps";
import type { MeasurementKind } from "@/types/contracts";
import { FileAssignmentSection } from "./FileAssignmentSection";

interface FileImportWorkspaceProps {
  kind: MeasurementKind;
}

export function FileImportWorkspace({ kind }: FileImportWorkspaceProps) {
  const navigate = useNavigate();
  const { draft, setAssignmentFiles, setAssignmentNotes } = useWizard();
  const assignment = draft.traceAssignments[kind];
  const { previousHref, nextHref, nextLabel } = getFileStepNavigation(draft, kind);

  return (
    <div className="grid gap-6">
      <FileAssignmentSection
        kind={kind}
        assignment={assignment}
        onChange={(files) => setAssignmentFiles(kind, files)}
        onNotesChange={(notes) => setAssignmentNotes(kind, notes)}
      />
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <Button type="button" variant="outline" onClick={() => navigate(previousHref)}>
            Previous
          </Button>
        </div>
        <div className="flex gap-3">
          <Button type="button" onClick={() => navigate(nextHref)}>
            {nextLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
