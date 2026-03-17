import { randomBytes, createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "#/server/db/index";
import { invitations, user } from "#/server/db/schema";
import { getAuthSession } from "#/server/auth/session";
import { requireRoleAccess } from "#/server/editorial/access";
import { resend } from "#/server/integrations/resend";
import { resolveExternalBaseUrl } from "#/server/system/runtime-config";
import { logActivity } from "#/server/activity-log";
import { invitationAcceptSchema, invitationCreateSchema } from "#/schemas/system";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildInviteUrl(token: string) {
  const baseUrl = resolveExternalBaseUrl({
    envVarName: "BETTER_AUTH_URL",
    label: "BETTER_AUTH_URL",
  });
  return `${baseUrl}/auth/invite/${token}`;
}

async function sendInvitationEmail(input: {
  email: string;
  inviteUrl: string;
  role: string;
}) {
  await resend.emails.send({
    from: "Lumina <onboarding@resend.dev>",
    to: input.email,
    subject: "You were invited to Lumina",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 12px;">You were invited to join Lumina</h2>
        <p style="margin-bottom: 12px;">You were invited to join the editorial team as <strong>${input.role}</strong>.</p>
        <p style="margin-bottom: 24px;">Use the link below to accept the invitation and finish onboarding.</p>
        <p><a href="${input.inviteUrl}" style="background:#111827;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Accept invitation</a></p>
        <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">If you did not expect this invite, you can ignore this email.</p>
      </div>
    `,
  });
}

export const listInvitations = createServerFn({ method: "GET" }).handler(async () => {
  await requireRoleAccess(["admin", "super-admin"]);

  return db.query.invitations.findMany({
    orderBy: [desc(invitations.createdAt)],
  });
});

export const createInvitation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => invitationCreateSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireRoleAccess(["admin", "super-admin"]);
    const email = data.email.toLowerCase();

    const existingPending = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.email, email),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
      ),
      orderBy: [desc(invitations.createdAt)],
    });

    if (existingPending && existingPending.expiresAt && existingPending.expiresAt > new Date()) {
      throw new Error("There is already an active invitation for this email");
    }

    const token = randomBytes(24).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000);

    const [created] = await db
      .insert(invitations)
      .values({
        email,
        role: data.role,
        tokenHash,
        invitedBy: session.user.id,
        expiresAt,
        createdAt: new Date(),
      })
      .returning();

    const inviteUrl = buildInviteUrl(token);
    await sendInvitationEmail({
      email,
      inviteUrl,
      role: data.role,
    });

    await logActivity({
      actorUserId: session.user.id,
      entityType: "invitation",
      entityId: created.id,
      action: "invite.create",
      summary: `Invitation created for ${email}`,
      metadata: {
        role: data.role,
        expiresAt: expiresAt.toISOString(),
      },
    });

    return {
      invitation: created,
      inviteUrl,
    };
  });

export const revokeInvitation = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const session = await requireRoleAccess(["admin", "super-admin"]);

    const [updated] = await db
      .update(invitations)
      .set({
        revokedAt: new Date(),
      })
      .where(eq(invitations.id, data.id))
      .returning();

    if (!updated) {
      throw new Error("Invitation not found");
    }

    await logActivity({
      actorUserId: session.user.id,
      entityType: "invitation",
      entityId: updated.id,
      action: "invite.revoke",
      summary: `Invitation revoked for ${updated.email}`,
      metadata: {
        role: updated.role,
      },
    });

    return updated;
  });

export const getInvitationByToken = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => invitationAcceptSchema.parse(input))
  .handler(async ({ data }) => {
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.tokenHash, hashToken(data.token)),
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      revokedAt: invitation.revokedAt,
      isExpired: invitation.expiresAt ? invitation.expiresAt <= new Date() : true,
    };
  });

export const acceptInvitation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => invitationAcceptSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await getAuthSession();

    if (!session?.user) {
      throw new Error("You need to sign in before accepting this invitation");
    }

    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.tokenHash, hashToken(data.token)),
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.revokedAt) {
      throw new Error("Invitation has been revoked");
    }

    if (invitation.acceptedAt) {
      throw new Error("Invitation has already been used");
    }

    if (!invitation.expiresAt || invitation.expiresAt <= new Date()) {
      throw new Error("Invitation has expired");
    }

    if (session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error("Invitation email does not match the signed-in account");
    }

    await db.transaction(async (tx: typeof db) => {
      await tx
        .update(user)
        .set({
          role: invitation.role,
          updatedAt: new Date(),
        })
        .where(eq(user.id, session.user.id));

      await tx
        .update(invitations)
        .set({
          acceptedAt: new Date(),
        })
        .where(eq(invitations.id, invitation.id));
    });

    await logActivity({
      actorUserId: session.user.id,
      entityType: "invitation",
      entityId: invitation.id,
      action: "invite.accept",
      summary: `${session.user.email} accepted an invitation`,
      metadata: {
        role: invitation.role,
      },
    });

    return {
      role: invitation.role,
      email: invitation.email,
      accepted: true as const,
    };
  });

