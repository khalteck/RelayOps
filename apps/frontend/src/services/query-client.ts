import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        const status = "status" in error ? Number(error.status) : 500;
        return status >= 500 && failureCount < 2;
      },
      refetchOnWindowFocus: false
    },
    mutations: { retry: false }
  }
});
