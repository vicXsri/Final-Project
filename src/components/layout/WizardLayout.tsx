// Wizard pages share this layout so the side navigation behaves the same way.
// Wizard pages share this layout so the side navigation behaves the same way.
// Wizard pages share this layout so the side navigation behaves the same way.
import { useEffect, useState, type PropsWithChildren } from "react";
import { Button } from "@/components/ui/button";
import { WizardSidebar } from "@/features/wizard/components/WizardSidebar";

const SIDEBAR_STORAGE_KEY = "qcl-workflow-panel-open";

export function WizardLayout({ children }: PropsWithChildren) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarOpen));
  }, [isSidebarOpen]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-start">
        <Button variant="outline" onClick={() => setIsSidebarOpen((current) => !current)}>
          {isSidebarOpen ? "Hide Workflow Panel" : "Show Workflow Panel"}
        </Button>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {isSidebarOpen ? <WizardSidebar /> : null}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
