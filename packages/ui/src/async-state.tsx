import { Button, Empty, Result, Skeleton } from "antd";
import type { ReactNode } from "react";

interface AsyncStateProps {
  loading: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}

export function AsyncState({
  loading,
  error,
  empty,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  onRetry,
  children
}: AsyncStateProps) {
  if (loading) {
    return (
      <div role="status" aria-label="Loading content">
        <Skeleton active paragraph={{ rows: 5 }} />
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="error"
        title="We could not load this view"
        subTitle={error.message}
        extra={
          onRetry ? (
            <Button type="primary" onClick={onRetry}>
              Try again
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (empty) {
    return <Empty description={emptyDescription ?? emptyTitle} />;
  }

  return children;
}
