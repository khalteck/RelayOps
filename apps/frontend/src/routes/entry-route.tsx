import { AsyncState, RelayLogo } from "@relayops/ui";
import { Navigate } from "react-router-dom";
import { useOrganisations } from "@/modules/organisations";

export function Component() {
  const organisations = useOrganisations();
  const firstOrganisation = organisations.data?.[0];
  const firstWorkspace = firstOrganisation?.workspaces[0];

  if (firstOrganisation && firstWorkspace) {
    return (
      <Navigate replace to={`/app/${firstOrganisation.slug}/${firstWorkspace.slug}/dashboard`} />
    );
  }

  return (
    <main className="centered-state">
      <RelayLogo />
      <AsyncState
        loading={organisations.isPending}
        error={organisations.error}
        empty={organisations.data?.length === 0}
        emptyDescription="Your account does not have an accessible workspace."
        onRetry={() => void organisations.refetch()}
      >
        <span />
      </AsyncState>
    </main>
  );
}
