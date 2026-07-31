import { Button, Result } from "antd";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "An unexpected page error occurred.";

  return (
    <main className="centered-state">
      <Result
        status="error"
        title="This view could not be opened"
        subTitle={message}
        extra={
          <Button type="primary" onClick={() => window.location.assign("/")}>
            Return to RelayOps
          </Button>
        }
      />
    </main>
  );
}
