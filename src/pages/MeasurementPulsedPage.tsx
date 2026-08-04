// Pulsed setup has its own page before the user moves into file uploads.
import { WizardLayout } from "@/components/layout/WizardLayout";
import { MeasurementSetupForm } from "@/features/measurement-setup/forms/MeasurementSetupForm";

export function MeasurementPulsedPage() {
  return (
    <WizardLayout>
      <MeasurementSetupForm mode="pulsed" />
    </WizardLayout>
  );
}
