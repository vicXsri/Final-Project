// The app is wrapped once here so every route can reach the wizard state.
// The app is wrapped once here so every route can reach the wizard state.
import { WizardProvider } from "@/features/wizard/context/WizardContext";
import { AppRouter } from "./router";

export default function App() {
  return (
    <WizardProvider>
      <AppRouter />
    </WizardProvider>
  );
}
