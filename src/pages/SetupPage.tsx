// Device and workflow choices start here before the measurement-specific steps.
import { WizardLayout } from "@/components/layout/WizardLayout";
import { SetupParametersForm } from "@/features/measurement-setup/forms/SetupParametersForm";

export function SetupPage() {
  return (
    <WizardLayout>
      <SetupParametersForm />
    </WizardLayout>
  );
}
