import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { contactMessages } from "#/db/schema";
import { Button } from "#/components/ui/button";
import { Mail, Check, Archive, Inbox } from "lucide-react";
import { useCallback, useState } from "react";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { StatusBadge } from "#/components/ui/status-badge";
import { DeleteButton } from "#/components/dashboard/DeleteButton";
import {
  deleteDashboardMessage,
  getDashboardMessages,
  updateDashboardMessageStatus,
} from "#/server/dashboard/messages";

type MessageRow = typeof contactMessages.$inferSelect;

export const Route = createFileRoute("/dashboard/messages")({
  loader: () => getDashboardMessages(),
  component: MessagesPage,
});

function MessagesPage() {
  const initialMessages = Route.useLoaderData();
  const [messages, setMessages] = useState(initialMessages);

  const handleStatus = useCallback(async (
    id: number,
    status: "read" | "archived" | "new",
  ) => {
    await updateDashboardMessageStatus({ data: { id, status } });
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, status } : message,
      ),
    );
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    await deleteDashboardMessage({ data: id });
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Inbox"
        description="Manage inquiries and messages from your site's contact form."
        icon={Inbox}
        iconLabel="Communication"
      />

      <div className="grid gap-6">
        {messages.length > 0 ? (
          messages.map((msg: MessageRow) => (
            <div
              key={msg.id}
              className={`bg-card border shadow-sm rounded-xl p-6 transition-all group ${
                msg.status === "new"
                  ? "border-primary/30 shadow-sm"
                  : "border-border/50 opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-black text-foreground uppercase tracking-wider text-sm flex items-center gap-2">
                      <Mail
                        size={14}
                        className={
                          msg.status === "new"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      />
                      {msg.name}
                    </span>
                    <span className="text-muted-foreground text-xs font-bold font-mono">
                      &lt;{msg.email}&gt;
                    </span>
                    <StatusBadge
                      variant={
                        msg.status === "new"
                          ? "destructive"
                          : msg.status === "read"
                            ? "success"
                            : "info"
                      }
                    >
                      {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                    </StatusBadge>
                  </div>

                  <h3 className="text-xl font-bold text-foreground">
                    {msg.subject || "(No Subject)"}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/20 italic">
                    &quot;{msg.message}&quot;
                  </p>

                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">
                    Received on{" "}
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>

                <div className="flex flex-row sm:flex-col gap-2 self-end sm:self-center">
                  {msg.status !== "read" && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleStatus(msg.id, "read")}
                      title="Mark as Read"
                    >
                      <Check size={16} />
                    </Button>
                  )}
                  {msg.status !== "archived" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatus(msg.id, "archived")}
                      title="Archive"
                    >
                      <Archive size={16} />
                    </Button>
                  )}
                  <DeleteButton
                    onConfirm={() => handleDelete(msg.id)}
                    title="Delete Message?"
                    description="This will permanently delete the message. This action cannot be undone."
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Inbox}
            title="Your inbox is empty"
            description="Messages from the contact form will appear here."
          />
        )}
      </div>
    </DashboardPageContainer>
  );
}
