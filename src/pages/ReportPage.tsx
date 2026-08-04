// The final report screen lives here inside the shared wizard frame.
import { WizardLayout } from "@/components/layout/WizardLayout";
import { ReportSummaryPanel } from "@/features/reporting/components/ReportSummaryPanel";

export function ReportPage() {
  return (
    <WizardLayout>
      <ReportSummaryPanel />
    </WizardLayout>
  );
}
