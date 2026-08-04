// The sidebar reflects the current wizard state and exposes the enabled steps.
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useWizard } from "@/features/wizard/context/WizardContext";
import { getFirstBlockedWizardPath } from "@/features/wizard/lib/validation";
import { cn } from "@/lib/utils";
import { getVisibleWizardSteps } from "@/features/wizard/lib/wizardSteps";

export function WizardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { draft } = useWizard();
  const visibleWizardSteps = getVisibleWizardSteps(draft);

  return (
    <aside className="w-full max-w-[280px] shrink-0">
      <div className="flex flex-col gap-2">
        {visibleWizardSteps.map((item, index) => {
          const isActive = item.match?.some((prefix) => location.pathname.startsWith(prefix));
          const blockedPath = getFirstBlockedWizardPath(draft, item.href);
          const isBlocked = blockedPath !== null && blockedPath !== item.href;

          return (
            <NavLink
              key={`${item.label}-${index}`}
              to={item.href}
              onClick={(event) => {
                if (isBlocked && blockedPath) {
                  event.preventDefault();
                  navigate(blockedPath);
                }
              }}
              className={() =>
                cn(
                  "block rounded-sm border bg-white px-5 py-5 text-lg font-semibold shadow-sm transition",
                  isActive
                    ? "border-[#2d8cff] bg-[#eaf4ff] text-[#1d6fd8] ring-2 ring-[#2d8cff]"
                    : "border-[#eef2f5] text-[var(--color-ink)] hover:bg-[var(--color-fog)]",
                  isBlocked ? "opacity-60" : "",
                )
              }
            >
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
