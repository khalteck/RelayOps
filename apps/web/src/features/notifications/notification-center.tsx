import { BellOutlined, CheckOutlined, RightOutlined } from "@ant-design/icons";
import type { NotificationDto } from "@relayops/types";
import { Badge, Button, Drawer, Empty, Popover, Skeleton } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications
} from "./notifications.api";

function relativeTime(value: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selected, setSelected] = useState<NotificationDto | null>(null);

  const openNotification = (notification: NotificationDto) => {
    setPopoverOpen(false);
    setSelected(notification);
    if (!notification.readAt) markRead.mutate(notification.id);
  };

  const content = (
    <div className="notification-popover">
      <div className="notification-popover__header">
        <strong>Notifications</strong>
        <Button
          type="link"
          size="small"
          icon={<CheckOutlined />}
          disabled={!notifications.data?.unreadCount}
          loading={markAllRead.isPending}
          onClick={() => markAllRead.mutate()}
        >
          Read all
        </Button>
      </div>
      {notifications.isPending ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : notifications.data?.items.length ? (
        <div className="notification-list" role="list">
          {notifications.data.items.map((notification) => (
            <button
              key={notification.id}
              type="button"
              role="listitem"
              className={`notification-item${notification.readAt ? "" : " notification-item--unread"}`}
              onClick={() => openNotification(notification)}
            >
              <span className="notification-item__dot" aria-hidden="true" />
              <span className="notification-item__copy">
                <strong>{notification.title}</strong>
                <span>{notification.message}</span>
                <small>{relativeTime(notification.createdAt)}</small>
              </span>
              <RightOutlined aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="You’re all caught up." />
      )}
    </div>
  );

  return (
    <>
      <Popover
        trigger="click"
        placement="bottomRight"
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        content={content}
        styles={{ body: { padding: 0 } }}
      >
        <Badge count={notifications.data?.unreadCount ?? 0} size="small" overflowCount={9}>
          <Button type="text" icon={<BellOutlined />} aria-label="Open notifications" />
        </Badge>
      </Popover>
      <Drawer
        title="Notification details"
        width="min(420px, 100vw)"
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        extra={selected?.readAt ? <span className="notification-read-state">Read</span> : null}
      >
        {selected ? (
          <div className="notification-detail">
            <p className="eyebrow">{selected.kind.replaceAll("_", " ")}</p>
            <h2>{selected.title}</h2>
            <p>{selected.message}</p>
            <small>{new Date(selected.createdAt).toLocaleString()}</small>
            {selected.resourcePath ? (
              <Button
                type="primary"
                onClick={() => {
                  setSelected(null);
                  void navigate(selected.resourcePath!);
                }}
              >
                Open related resource
              </Button>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </>
  );
}
