// Each upload step lands here with the matching measurement kind.
import type { MeasurementKind } from "@/types/contracts";
import { WizardLayout } from "@/components/layout/WizardLayout";
import { FileImportWorkspace } from "@/features/file-import/components/FileImportWorkspace";

export function FilesPage({ kind }: { kind: MeasurementKind }) {
  return (
    <WizardLayout>
      <FileImportWorkspace kind={kind} />
    </WizardLayout>
  );
}
