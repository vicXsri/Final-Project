// The wizard guard keeps users from skipping ahead when required steps are empty.
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useWizard } from "@/features/wizard/context/WizardContext";
import { getFirstBlockedWizardPath } from "@/features/wizard/lib/validation";

export function WizardRouteGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { draft } = useWizard();

  useEffect(() => {
    const guardedPrefixes = ["/wizard", "/results", "/report"];
    const shouldGuardRoute = guardedPrefixes.some((prefix) => location.pathname.startsWith(prefix));

    if (!shouldGuardRoute) {
      return;
    }

    const blockedPath = getFirstBlockedWizardPath(draft, location.pathname);
    if (blockedPath && blockedPath !== location.pathname) {
      navigate(blockedPath, { replace: true });
    }
  }, [draft, location.pathname, navigate]);

  return null;
}
