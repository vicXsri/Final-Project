// Results pulls together the processed datasets and the interactive plots.
import { Card } from "@/components/ui/card";
import { WizardLayout } from "@/components/layout/WizardLayout";
import { LivPlotCard, SpectraPlotCard } from "@/features/plot-viewer/components/PlotCard";
import { useProcessedResults } from "@/features/plot-viewer/lib/useProcessedResults";
import type { ProcessedLivResult, ProcessedSpectraResult } from "@/types/contracts";

type ResultCard =
  | { kind: "liv"; datasetName: string; result: ProcessedLivResult }
  | { kind: "spectra"; datasetName: string; result: ProcessedSpectraResult };

export function ResultsPage() {
  const { livResults, spectraResults } = useProcessedResults();
  const orderedResultNames = [
    "Pulsed LIV",
    "Pulsed FTIR - fixed temperature",
    "Pulsed FTIR - fixed current",
    "CW LIV",
    "CW FTIR - fixed temperature",
    "CW FTIR - fixed current",
  ] as const;

  const resultCards: ResultCard[] = orderedResultNames.flatMap((datasetName): ResultCard[] => {
    const livResult = livResults.find((result) => result.datasetName === datasetName);
    if (livResult) {
      return [{ kind: "liv" as const, datasetName, result: livResult }];
    }

    const spectraResult = spectraResults.find((result) => result.datasetName === datasetName);
    if (spectraResult) {
      return [{ kind: "spectra" as const, datasetName, result: spectraResult }];
    }

    return [];
  });

  return (
    <WizardLayout>
      <Card className="mb-2 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f0fdfa_100%)]">
        <h2 className="text-2xl font-semibold">Generate Image File</h2>
      </Card>
      {resultCards.length === 0 ? (
        <Card>
          <h2 className="text-xl font-semibold">No processed results yet</h2>
        </Card>
      ) : null}
      <div className="grid gap-8">
        {resultCards.map((card) =>
          card.kind === "liv" ? (
            <LivPlotCard key={card.datasetName} result={card.result} />
          ) : (
            <SpectraPlotCard key={card.datasetName} result={card.result} />
          ),
        )}
      </div>
    </WizardLayout>
  );
}
