// Route errors fall back to this page so bad navigation still feels controlled.
import { isRouteErrorResponse, useRouteError, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function RouteErrorPage() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "An unexpected application error occurred.";

  return (
    <div className="mx-auto max-w-3xl py-16">
      <Card className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-[var(--color-slate)]">{message}</p>
        <div>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
