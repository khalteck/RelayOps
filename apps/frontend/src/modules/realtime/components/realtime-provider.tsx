import type { IncidentDto, ServerToClientEvents } from "@relayops/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { io, type Socket } from "socket.io-client";
import { queryKeys } from "@/helpers/query-keys";
import { reconcileIncident } from "@/modules/incidents";
import { apiRequest } from "@/services/api-client";

type RealtimeStatus = "connecting" | "live" | "reconnecting" | "offline";
const RealtimeContext = createContext<RealtimeStatus>("offline");

export function WorkspaceRealtimeProvider({
  workspaceId,
  children
}: {
  workspaceId: string;
  children: ReactNode;
}) {
  const client = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const revisions = useRef(new Map<string, number>());

  useEffect(() => {
    let disposed = false;
    let socket: Socket<ServerToClientEvents> | undefined;
    let refreshingTicket = false;
    setStatus("connecting");

    const requestTicket = () =>
      apiRequest<{ ticket: string; expiresInSeconds: number }>("/api/v1/realtime/ticket", {
        method: "POST"
      });

    const receiveIncident = (incident: IncidentDto) => {
      const latest = revisions.current.get(incident.id) ?? 0;
      if (incident.revision <= latest) return;
      revisions.current.set(incident.id, incident.revision);
      reconcileIncident(client, workspaceId, incident);
      void client.invalidateQueries({ queryKey: queryKeys.incidents.lists(workspaceId) });
      void client.invalidateQueries({ queryKey: queryKeys.analyticsAll(workspaceId) });
      void client.invalidateQueries({ queryKey: queryKeys.auditAll(workspaceId) });
    };

    void requestTicket()
      .then(({ data }) => {
        if (disposed) return;
        socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
          auth: { ticket: data.ticket },
          transports: ["websocket"],
          reconnection: true
        });
        socket.on("connect", () => setStatus("live"));
        socket.on("disconnect", () => setStatus("reconnecting"));
        socket.on("connect_error", () => {
          setStatus("offline");
          if (refreshingTicket || disposed || !socket) return;
          refreshingTicket = true;
          void requestTicket()
            .then(({ data: refreshed }) => {
              if (!socket || disposed) return;
              socket.auth = { ticket: refreshed.ticket };
              socket.connect();
            })
            .catch(() => undefined)
            .finally(() => {
              refreshingTicket = false;
            });
        });
        socket.io.on("reconnect_attempt", () => setStatus("reconnecting"));
        socket.on("incident.created", receiveIncident);
        socket.on("incident.updated", receiveIncident);
        socket.on("timeline.created", (entry) => {
          void client.invalidateQueries({
            queryKey: queryKeys.incidents.timeline(workspaceId, entry.incidentId)
          });
        });
        socket.on("notification.created", () => {
          void client.invalidateQueries({ queryKey: queryKeys.notifications });
        });
      })
      .catch(() => setStatus("offline"));

    return () => {
      disposed = true;
      socket?.disconnect();
    };
  }, [client, workspaceId]);

  const value = useMemo(() => status, [status]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function RealtimeConnectionLabel({ compact = false }: { compact?: boolean }) {
  const status = useContext(RealtimeContext);
  const labels: Record<RealtimeStatus, string> = {
    connecting: "Connecting live updates",
    live: "Live updates connected",
    reconnecting: "Reconnecting live updates",
    offline: "Live updates offline"
  };
  if (compact) {
    return (
      <span className={`app-nav__signal app-nav__signal--${status}`} aria-label={labels[status]} />
    );
  }
  return (
    <>
      <span className={`app-nav__signal app-nav__signal--${status}`} aria-hidden="true" />
      <div>
        <strong>{labels[status]}</strong>
        <small>
          {status === "live" ? "Workspace events are current" : "HTTP updates remain available"}
        </small>
      </div>
    </>
  );
}
