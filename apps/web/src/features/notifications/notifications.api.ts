import type { NotificationDto, NotificationListDto } from "@relayops/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../app/query-keys";
import { apiRequest } from "../../services/api-client";

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () =>
      apiRequest<NotificationListDto>("/api/v1/notifications?limit=20").then(
        (result) => result.data
      ),
    staleTime: 30_000
  });
}

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest<NotificationDto>(`/api/v1/notifications/${notificationId}/read`, {
        method: "PATCH"
      }),
    onSuccess: ({ data }) => {
      client.setQueryData<NotificationListDto>(queryKeys.notifications, (current) => {
        if (!current) return current;
        const wasUnread = current.items.some((item) => item.id === data.id && !item.readAt);
        return {
          items: current.items.map((item) => (item.id === data.id ? data : item)),
          unreadCount: Math.max(0, current.unreadCount - (wasUnread ? 1 : 0))
        };
      });
    }
  });
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<void>("/api/v1/notifications/read-all", { method: "POST" }),
    onSuccess: () => {
      const now = new Date().toISOString();
      client.setQueryData<NotificationListDto>(queryKeys.notifications, (current) =>
        current
          ? {
              unreadCount: 0,
              items: current.items.map((item) => ({ ...item, readAt: item.readAt ?? now }))
            }
          : current
      );
    }
  });
}
