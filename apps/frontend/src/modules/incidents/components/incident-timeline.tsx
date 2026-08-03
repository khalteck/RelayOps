import { CommentOutlined, HistoryOutlined } from "@ant-design/icons";
import {
  timelineKindLabels,
  type IncidentDto,
  type PersonSummary,
  type TimelineEntryDto
} from "@relayops/types";
import { Alert, App, Button, Empty, Input, Skeleton, Timeline } from "antd";
import { useState } from "react";
import { useCommentOnIncident } from "../operations/incident.mutations";
import { useIncidentTimeline } from "../operations/incidents.queries";

function activityDescription(entry: TimelineEntryDto): string {
  if (entry.kind === "comment") return entry.body ?? "";
  const metadata = entry.metadata ?? {};
  if (entry.kind === "status_changed")
    return `Status changed to ${String(metadata.status ?? "unknown")}`;
  if (entry.kind === "assignment_changed") {
    return metadata.assigneeId ? "Responder assignment changed" : "Incident was unassigned";
  }
  if (entry.kind === "classification_changed") return "Priority or severity was updated";
  if (entry.kind === "incident_created") return "Incident was reported";
  return timelineKindLabels[entry.kind];
}

export function IncidentTimeline({
  incident,
  currentUser,
  canComment
}: {
  incident: IncidentDto;
  currentUser: PersonSummary;
  canComment: boolean;
}) {
  const { message } = App.useApp();
  const timeline = useIncidentTimeline(incident.workspaceId, incident.id);
  const comment = useCommentOnIncident(incident.workspaceId);
  const [body, setBody] = useState("");
  const entries = timeline.data?.pages.flatMap((page) => page.data) ?? [];

  const sendComment = async () => {
    const value = body.trim();
    if (!value) return;
    setBody("");
    try {
      await comment.mutateAsync({ incidentId: incident.id, body: value, actor: currentUser });
    } catch (error) {
      setBody(value);
      void message.error(error instanceof Error ? error.message : "Comment could not be added");
    }
  };

  return (
    <section className="incident-timeline" aria-label="Incident activity timeline">
      <h3>
        <HistoryOutlined /> Activity
      </h3>
      {canComment ? (
        <div className="comment-composer">
          <Input.TextArea
            value={body}
            rows={3}
            maxLength={4_000}
            placeholder="Add operational context…"
            aria-label="Incident comment"
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void sendComment();
            }}
          />
          <Button
            type="primary"
            icon={<CommentOutlined />}
            disabled={!body.trim()}
            loading={comment.isPending}
            onClick={() => void sendComment()}
          >
            Comment
          </Button>
        </div>
      ) : null}
      {timeline.isPending ? <Skeleton active paragraph={{ rows: 5 }} /> : null}
      {timeline.error ? <Alert type="error" showIcon message={timeline.error.message} /> : null}
      {!timeline.isPending && !timeline.error && !entries.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No activity yet" />
      ) : null}
      <Timeline
        items={entries.map((entry) => ({
          color: entry.kind === "comment" ? "blue" : "gray",
          children: (
            <article
              className="timeline-entry"
              data-optimistic={entry.id.startsWith("optimistic-")}
            >
              <div>
                <strong>{entry.actor.name}</strong>
                <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString()}</time>
              </div>
              <p>{activityDescription(entry)}</p>
            </article>
          )
        }))}
      />
      {timeline.hasNextPage ? (
        <Button loading={timeline.isFetchingNextPage} onClick={() => void timeline.fetchNextPage()}>
          Load earlier activity
        </Button>
      ) : null}
    </section>
  );
}
