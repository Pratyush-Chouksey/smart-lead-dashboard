import { QueryClient } from '@tanstack/react-query'

// Singleton QueryClient — exported so AuthContext can call
// queryClient.clear() on login/logout without circular imports.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,  // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})
