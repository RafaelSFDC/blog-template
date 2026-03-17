import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { Button } from "#/components/ui/button";
import { Field, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { StatusBadge } from "#/components/ui/status-badge";
import { Textarea } from "#/components/ui/textarea";
import { StatCard } from "#/components/ui/stat-card";
import {
  AlertTriangle,
  ClipboardList,
  Flag,
  Inbox,
  LifeBuoy,
  MessageSquarePlus,
  Users,
} from "lucide-react";
import {
  createBetaOpsFeedback,
  getBetaOpsDashboard,
  promoteMessageToBetaOpsAccount,
  updateBetaOpsAccount,
  updateBetaOpsFeedback,
} from "#/server/dashboard/beta-ops";
import type { BetaOpsDashboardData } from "#/server/dashboard/beta-ops";

export const Route = createFileRoute("/dashboard/beta-ops")({
  loader: () => getBetaOpsDashboard(),
  component: BetaOpsPage,
});

function BetaOpsPage() {
  const data = Route.useLoaderData() as BetaOpsDashboardData;
  type BetaOpsAccount = BetaOpsDashboardData["accounts"][number];
  type TriageMessage = BetaOpsDashboardData["triageMessages"][number];
  type OpsOwner = BetaOpsDashboardData["owners"][number];
  type FeedbackItem = BetaOpsAccount["feedbackItems"][number];
  type RecentFeedbackItem = BetaOpsDashboardData["recentFeedback"][number];
  const router = useRouter();
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const filteredAccounts = useMemo(
    () =>
      data.accounts.filter((account: BetaOpsAccount) => {
        if (stageFilter !== "all" && account.accountStage !== stageFilter) {
          return false;
        }
        if (statusFilter !== "all" && account.onboardingStatus !== statusFilter) {
          return false;
        }
        if (priorityFilter !== "all" && account.priority !== priorityFilter) {
          return false;
        }
        return true;
      }),
    [data.accounts, priorityFilter, stageFilter, statusFilter],
  );

  async function handlePromote(messageId: number) {
    try {
      setBusyKey(`promote-${messageId}`);
      await promoteMessageToBetaOpsAccount({ data: { messageId } });
      await router.invalidate();
      toast.success("Beta request promoted to Beta Ops.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not promote beta request.");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleAccountSave(formData: FormData) {
    const id = Number(formData.get("id"));

    try {
      setBusyKey(`account-${id}`);
      await updateBetaOpsAccount({
        data: {
          id,
          accountStage: String(formData.get("accountStage")) as
            | "new_lead"
            | "qualified"
            | "onboarding"
            | "active_beta"
            | "at_risk"
            | "paused",
          onboardingStatus: String(formData.get("onboardingStatus")) as
            | "not_started"
            | "scheduled"
            | "in_progress"
            | "completed"
            | "blocked",
          priority: String(formData.get("priority")) as "low" | "medium" | "high",
          ownerUserId: String(formData.get("ownerUserId") ?? ""),
          publicationName: String(formData.get("publicationName") ?? ""),
          notes: String(formData.get("notes") ?? ""),
          nextFollowUpOn: String(formData.get("nextFollowUpOn") ?? ""),
        },
      });
      await router.invalidate();
      toast.success("Beta account updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save account.");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleFeedbackCreate(formData: FormData) {
    const betaAccountId = Number(formData.get("betaAccountId"));

    try {
      setBusyKey(`feedback-create-${betaAccountId}`);
      await createBetaOpsFeedback({
        data: {
          betaAccountId,
          contactMessageId: undefined,
          title: String(formData.get("title") ?? ""),
          summary: String(formData.get("summary") ?? ""),
          priority: String(formData.get("priority")) as "low" | "medium" | "high",
          status: String(formData.get("status")) as "new" | "reviewed" | "planned" | "closed",
          ownerUserId: String(formData.get("ownerUserId") ?? ""),
          notes: String(formData.get("notes") ?? ""),
        },
      });
      await router.invalidate();
      toast.success("Feedback item created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save feedback.");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleFeedbackUpdate(formData: FormData) {
    const id = Number(formData.get("id"));

    try {
      setBusyKey(`feedback-${id}`);
      await updateBetaOpsFeedback({
        data: {
          id,
          status: String(formData.get("status")) as "new" | "reviewed" | "planned" | "closed",
          priority: String(formData.get("priority")) as "low" | "medium" | "high",
          ownerUserId: String(formData.get("ownerUserId") ?? ""),
          notes: String(formData.get("notes") ?? ""),
        },
      });
      await router.invalidate();
      toast.success("Feedback item updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update feedback.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Beta Ops"
        description="Classify beta accounts, capture launch feedback, and keep onboarding follow-ups visible."
        icon={ClipboardList}
        iconLabel="Launch Ops"
      >
        <Button asChild variant="outline">
          <Link to="/dashboard/messages">Open inbox</Link>
        </Button>
      </DashboardHeader>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Beta Accounts" value={data.summary.accountCount} />
        <StatCard icon={Inbox} label="Untriaged Requests" value={data.summary.untriagedRequests} />
        <StatCard icon={AlertTriangle} label="Blocked Onboarding" value={data.summary.blockedOnboarding} />
        <StatCard icon={Flag} label="New Feedback" value={data.summary.newFeedbackCount} />
      </div>

      <section className="mb-8 rounded-md border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <Inbox className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-2xl font-black text-foreground">Triage Queue</h2>
            <p className="text-sm text-muted-foreground">
              Promote beta requests into tracked launch accounts before archiving them.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {data.triageMessages.length > 0 ? (
            data.triageMessages.map((message: TriageMessage) => (
              <article key={message.id} className="rounded-md border border-border/70 bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-foreground">{message.name}</span>
                      <span className="text-xs font-semibold text-muted-foreground">{message.email}</span>
                      <StatusBadge variant={message.linkedBetaAccountId ? "success" : "destructive"}>
                        {message.messageType === "beta_request" ? "Beta request" : "General"}
                      </StatusBadge>
                      {message.linkedBetaAccountId ? (
                        <StatusBadge variant="success">Tracked</StatusBadge>
                      ) : (
                        <StatusBadge variant="info">Needs triage</StatusBadge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{message.subject || "Launch request"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {message.metadata.role ?? "unknown role"}
                      {" · "}
                      {message.metadata.publicationType ?? "unknown publication"}
                      {" · "}
                      {message.metadata.currentStack ?? "stack not provided"}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{message.message}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {message.linkedBetaAccountId ? (
                      <Button asChild variant="outline" size="sm">
                        <Link to="/dashboard/beta-ops">View in Beta Ops</Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => void handlePromote(message.id)}
                        disabled={busyKey === `promote-${message.id}`}
                      >
                        Promote to Beta Ops
                      </Button>
                    )}
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/dashboard/messages">Inbox</Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              icon={Inbox}
              title="No beta requests waiting"
              description="New requests from /lumina/beta will appear here for promotion and triage."
            />
          )}
        </div>
      </section>

      <section className="mb-8 rounded-md border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-2xl font-black text-foreground">Account Filters</h2>
            <p className="text-sm text-muted-foreground">
              Keep launch ops focused on the stage, onboarding state, and priority that need attention now.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field>
            <FieldLabel>Stage</FieldLabel>
            <NativeSelect value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} className="w-full">
              <NativeSelectOption value="all">All stages</NativeSelectOption>
              <NativeSelectOption value="new_lead">New lead</NativeSelectOption>
              <NativeSelectOption value="qualified">Qualified</NativeSelectOption>
              <NativeSelectOption value="onboarding">Onboarding</NativeSelectOption>
              <NativeSelectOption value="active_beta">Active beta</NativeSelectOption>
              <NativeSelectOption value="at_risk">At risk</NativeSelectOption>
              <NativeSelectOption value="paused">Paused</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel>Onboarding</FieldLabel>
            <NativeSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full">
              <NativeSelectOption value="all">All onboarding states</NativeSelectOption>
              <NativeSelectOption value="not_started">Not started</NativeSelectOption>
              <NativeSelectOption value="scheduled">Scheduled</NativeSelectOption>
              <NativeSelectOption value="in_progress">In progress</NativeSelectOption>
              <NativeSelectOption value="completed">Completed</NativeSelectOption>
              <NativeSelectOption value="blocked">Blocked</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel>Priority</FieldLabel>
            <NativeSelect value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="w-full">
              <NativeSelectOption value="all">All priorities</NativeSelectOption>
              <NativeSelectOption value="low">Low</NativeSelectOption>
              <NativeSelectOption value="medium">Medium</NativeSelectOption>
              <NativeSelectOption value="high">High</NativeSelectOption>
            </NativeSelect>
          </Field>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.65fr_1fr]">
        <section className="space-y-6">
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map((account: BetaOpsAccount) => (
              <article key={account.id} className="rounded-md border bg-card p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black text-foreground">{account.name}</h2>
                      <StatusBadge variant="info">{account.accountStage}</StatusBadge>
                      <StatusBadge variant={account.onboardingStatus === "blocked" ? "destructive" : "success"}>
                        {account.onboardingStatus}
                      </StatusBadge>
                      <StatusBadge variant={account.priority === "high" ? "destructive" : "info"}>
                        {account.priority}
                      </StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {account.email}
                      {" · "}
                      {account.publicationType ?? "publication type pending"}
                      {" · "}
                      {account.currentStack ?? "stack pending"}
                    </p>
                  </div>
                  <div className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <p>Owner: {account.ownerName ?? "Unassigned"}</p>
                    <p>Next follow-up: {formatDateInput(account.nextFollowUpAt)}</p>
                  </div>
                </div>

                <form
                  className="grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleAccountSave(new FormData(event.currentTarget));
                  }}
                >
                  <input type="hidden" name="id" value={account.id} />
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Field>
                      <FieldLabel>Stage</FieldLabel>
                      <NativeSelect name="accountStage" defaultValue={account.accountStage} className="w-full">
                        <NativeSelectOption value="new_lead">New lead</NativeSelectOption>
                        <NativeSelectOption value="qualified">Qualified</NativeSelectOption>
                        <NativeSelectOption value="onboarding">Onboarding</NativeSelectOption>
                        <NativeSelectOption value="active_beta">Active beta</NativeSelectOption>
                        <NativeSelectOption value="at_risk">At risk</NativeSelectOption>
                        <NativeSelectOption value="paused">Paused</NativeSelectOption>
                      </NativeSelect>
                    </Field>
                    <Field>
                      <FieldLabel>Onboarding</FieldLabel>
                      <NativeSelect name="onboardingStatus" defaultValue={account.onboardingStatus} className="w-full">
                        <NativeSelectOption value="not_started">Not started</NativeSelectOption>
                        <NativeSelectOption value="scheduled">Scheduled</NativeSelectOption>
                        <NativeSelectOption value="in_progress">In progress</NativeSelectOption>
                        <NativeSelectOption value="completed">Completed</NativeSelectOption>
                        <NativeSelectOption value="blocked">Blocked</NativeSelectOption>
                      </NativeSelect>
                    </Field>
                    <Field>
                      <FieldLabel>Priority</FieldLabel>
                      <NativeSelect name="priority" defaultValue={account.priority} className="w-full">
                        <NativeSelectOption value="low">Low</NativeSelectOption>
                        <NativeSelectOption value="medium">Medium</NativeSelectOption>
                        <NativeSelectOption value="high">High</NativeSelectOption>
                      </NativeSelect>
                    </Field>
                    <Field>
                      <FieldLabel>Owner</FieldLabel>
                      <NativeSelect name="ownerUserId" defaultValue={account.ownerUserId ?? ""} className="w-full">
                        <NativeSelectOption value="">Unassigned</NativeSelectOption>
                        {data.owners.map((owner: OpsOwner) => (
                          <NativeSelectOption key={owner.id} value={owner.id}>
                            {owner.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel>Publication name</FieldLabel>
                      <Input
                        name="publicationName"
                        defaultValue={account.publicationName ?? ""}
                        placeholder="Independent newsletter, magazine, or publication name"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Next follow-up</FieldLabel>
                      <Input
                        name="nextFollowUpOn"
                        type="date"
                        defaultValue={formatDateInput(account.nextFollowUpAt)}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel>Notes</FieldLabel>
                    <Textarea
                      name="notes"
                      rows={4}
                      defaultValue={account.notes ?? ""}
                      placeholder="What happened last, what is blocked, and what needs to happen next."
                    />
                  </Field>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={busyKey === `account-${account.id}`}>
                      Save account
                    </Button>
                  </div>
                </form>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-md border border-border/70 bg-background p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <MessageSquarePlus className="h-4 w-4 text-primary" />
                      <h3 className="font-black text-foreground">Feedback log</h3>
                    </div>
                    <div className="space-y-3">
                      {account.feedbackItems.length > 0 ? (
                        account.feedbackItems.map((item: FeedbackItem) => (
                          <form
                            key={item.id}
                            className="rounded-md border border-border/60 p-3"
                            onSubmit={(event) => {
                              event.preventDefault();
                              void handleFeedbackUpdate(new FormData(event.currentTarget));
                            }}
                          >
                            <input type="hidden" name="id" value={item.id} />
                            <p className="font-bold text-foreground">{item.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                            <div className="mt-3 grid gap-3 md:grid-cols-3">
                              <NativeSelect name="status" defaultValue={item.status} className="w-full">
                                <NativeSelectOption value="new">New</NativeSelectOption>
                                <NativeSelectOption value="reviewed">Reviewed</NativeSelectOption>
                                <NativeSelectOption value="planned">Planned</NativeSelectOption>
                                <NativeSelectOption value="closed">Closed</NativeSelectOption>
                              </NativeSelect>
                              <NativeSelect name="priority" defaultValue={item.priority} className="w-full">
                                <NativeSelectOption value="low">Low</NativeSelectOption>
                                <NativeSelectOption value="medium">Medium</NativeSelectOption>
                                <NativeSelectOption value="high">High</NativeSelectOption>
                              </NativeSelect>
                              <NativeSelect name="ownerUserId" defaultValue={item.ownerUserId ?? ""} className="w-full">
                                <NativeSelectOption value="">Unassigned</NativeSelectOption>
                                {data.owners.map((owner: OpsOwner) => (
                                  <NativeSelectOption key={owner.id} value={owner.id}>
                                    {owner.name}
                                  </NativeSelectOption>
                                ))}
                              </NativeSelect>
                            </div>
                            <Textarea
                              name="notes"
                              rows={2}
                              className="mt-3"
                              defaultValue={item.notes ?? ""}
                              placeholder="Internal notes for this feedback item."
                            />
                            <div className="mt-3 flex justify-end">
                              <Button
                                type="submit"
                                size="sm"
                                variant="outline"
                                disabled={busyKey === `feedback-${item.id}`}
                              >
                                Update feedback
                              </Button>
                            </div>
                          </form>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No feedback logged for this account yet.</p>
                      )}
                    </div>
                  </div>

                  <form
                    className="rounded-md border border-border/70 bg-background p-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleFeedbackCreate(new FormData(event.currentTarget));
                    }}
                  >
                    <input type="hidden" name="betaAccountId" value={account.id} />
                    <div className="mb-3 flex items-center gap-2">
                      <LifeBuoy className="h-4 w-4 text-primary" />
                      <h3 className="font-black text-foreground">Add feedback</h3>
                    </div>
                    <div className="space-y-3">
                      <Input name="title" placeholder="Short feedback title" />
                      <Textarea
                        name="summary"
                        rows={4}
                        placeholder="What happened, what hurts, and what should change?"
                      />
                      <div className="grid gap-3 md:grid-cols-3">
                        <NativeSelect name="status" defaultValue="new" className="w-full">
                          <NativeSelectOption value="new">New</NativeSelectOption>
                          <NativeSelectOption value="reviewed">Reviewed</NativeSelectOption>
                          <NativeSelectOption value="planned">Planned</NativeSelectOption>
                          <NativeSelectOption value="closed">Closed</NativeSelectOption>
                        </NativeSelect>
                        <NativeSelect name="priority" defaultValue={account.priority} className="w-full">
                          <NativeSelectOption value="low">Low</NativeSelectOption>
                          <NativeSelectOption value="medium">Medium</NativeSelectOption>
                          <NativeSelectOption value="high">High</NativeSelectOption>
                        </NativeSelect>
                        <NativeSelect name="ownerUserId" defaultValue={account.ownerUserId ?? ""} className="w-full">
                          <NativeSelectOption value="">Unassigned</NativeSelectOption>
                          {data.owners.map((owner: OpsOwner) => (
                            <NativeSelectOption key={owner.id} value={owner.id}>
                              {owner.name}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </div>
                      <Textarea
                        name="notes"
                        rows={2}
                        placeholder="Optional internal notes or reproduction details."
                      />
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={busyKey === `feedback-create-${account.id}`}
                      >
                        Add feedback
                      </Button>
                    </div>
                  </form>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              icon={Users}
              title="No beta accounts match these filters"
              description="Adjust the filters or promote a beta request from the triage queue."
            />
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-md border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-xl font-black text-foreground">Recent Feedback</h2>
            <div className="space-y-3">
              {data.recentFeedback.length > 0 ? (
                data.recentFeedback.map((item: RecentFeedbackItem) => (
                  <div key={item.id} className="rounded-md border border-border/60 bg-background p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-foreground">{item.title}</p>
                      <StatusBadge variant="info">{item.status}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Feedback items will appear here as launch ops logs them.</p>
              )}
            </div>
          </section>

          <section className="rounded-md border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-xl font-black text-foreground">Operational Notes</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>Promote every serious beta request before archiving it in the inbox.</li>
              <li>Use `qualified` only when the ICP and timing are real.</li>
              <li>Use `blocked` onboarding whenever the next step depends on us.</li>
              <li>Log actionable feedback here before it gets lost in chat or email.</li>
            </ul>
          </section>
        </aside>
      </div>
    </DashboardPageContainer>
  );
}

function formatDateInput(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}
