// Raw uploaded files are parsed and processed into plot-ready results here.
import { useMemo } from "react";
import { parseLivFile } from "@/core/parsers/livParser";
import { parseSpectraFile } from "@/core/parsers/spectraParser";
import { processLivDataset } from "@/core/processing/livProcessing";
import { processSpectraDataset } from "@/core/processing/spectraProcessing";
import { useWizard } from "@/features/wizard/context/WizardContext";
import { getEnabledFileSteps } from "@/features/wizard/lib/wizardSteps";
import type { LivDataset, ProcessedLivResult, ProcessedSpectraResult, SpectraDataset } from "@/types/contracts";

export function useProcessedResults() {
  const { draft } = useWizard();

  return useMemo(() => {
    const livResults: ProcessedLivResult[] = [];
    const spectraResults: ProcessedSpectraResult[] = [];
    const pulsedEnabled = draft.projectMetadata.workflows.pulsed;
    const cwEnabled = draft.projectMetadata.workflows.cw;
    const enabledFileSteps = getEnabledFileSteps(draft);

    const pulsedLivFiles = draft.traceAssignments.pulsedLiv.files;
    if (pulsedEnabled && enabledFileSteps.includes("pulsedLiv") && pulsedLivFiles.length > 0) {
      const dataset: LivDataset = {
        kind: "liv",
        datasetName: draft.traceAssignments.pulsedLiv.datasetName,
        traceVariableLabel: draft.traceAssignments.pulsedLiv.traceVariableLabel,
        traces: pulsedLivFiles.map(parseLivFile),
      };
      livResults.push(processLivDataset(dataset, draft.measurementSetup.pulsed.powerScale, draft.projectMetadata.device.dimensions));
    }

    const cwLivFiles = draft.traceAssignments.cwLiv.files;
    if (cwEnabled && enabledFileSteps.includes("cwLiv") && cwLivFiles.length > 0) {
      const dataset: LivDataset = {
        kind: "liv",
        datasetName: draft.traceAssignments.cwLiv.datasetName,
        traceVariableLabel: draft.traceAssignments.cwLiv.traceVariableLabel,
        traces: cwLivFiles.map(parseLivFile),
      };
      livResults.push(processLivDataset(dataset, draft.measurementSetup.cw.powerScale, draft.projectMetadata.device.dimensions));
    }

    const enabledSpectraKeys = enabledFileSteps.filter((key) => key !== "pulsedLiv" && key !== "cwLiv");

    for (const key of enabledSpectraKeys) {
      const assignment = draft.traceAssignments[key];
      if (assignment.files.length === 0) continue;
      // Each spectra step uses the same parser/processor pair; only the source bucket changes.
      const dataset: SpectraDataset = {
        kind: "spectra",
        datasetName: assignment.datasetName,
        traceVariableLabel: assignment.traceVariableLabel,
        traces: assignment.files.map(parseSpectraFile),
      };
      spectraResults.push(processSpectraDataset(dataset));
    }

    return { livResults, spectraResults };
  }, [draft]);
}
