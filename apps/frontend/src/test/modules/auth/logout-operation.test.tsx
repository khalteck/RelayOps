import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/helpers/query-keys";
import { useLogout } from "@/modules/auth/operations/auth.queries";

describe("useLogout", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("treats an unusable session as signed out and clears server state", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(queryKeys.session, { user: { id: "user-1" } });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { code: "UNAUTHENTICATED", message: "Expired", requestId: "private-id" }
          }),
          { status: 401, headers: { "content-type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useLogout(), { wrapper });
    await result.current.mutateAsync();

    await waitFor(() => expect(client.getQueryData(queryKeys.session)).toBeUndefined());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
