import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

export const statement = {
    ...defaultStatements,
    posts: ["create", "read", "update", "delete", "publish"],
    comments: ["create", "read", "update", "delete", "approve"],
    settings: ["read", "update"],
    users: ["read", "update", "delete", "ban"],
    webhooks: ["create", "read", "update", "delete"],
    analytics: ["read"],
} as const;

export const ac = createAccessControl(statement);

// reader: Can only read posts and create comments
export const reader = ac.newRole({
    posts: ["read"],
    comments: ["create", "read"],
});

// author: Can manage their own posts (logic for "own" is usually handled in the app layer)
export const author = ac.newRole({
    posts: ["create", "read", "update", "delete"],
    comments: ["create", "read"],
});

// editor: Can manage all posts and comments
export const editor = ac.newRole({
    posts: ["create", "read", "update", "delete", "publish"],
    comments: ["create", "read", "update", "delete", "approve"],
    analytics: ["read"],
});

// moderator: Focused on community management
export const moderator = ac.newRole({
    posts: ["read"],
    comments: ["read", "update", "delete", "approve"],
    users: ["read", "ban"],
});

// admin: Most permissions
export const admin = ac.newRole({
    ...adminAc.statements,
    posts: ["create", "read", "update", "delete", "publish"],
    comments: ["create", "read", "update", "delete", "approve"],
    settings: ["read", "update"],
    users: ["read", "update", "delete", "ban"],
    webhooks: ["create", "read", "update", "delete"],
    analytics: ["read"],
});

// super-admin: Everything
export const superAdmin = ac.newRole({
    posts: ["create", "read", "update", "delete", "publish"],
    comments: ["create", "read", "update", "delete", "approve"],
    settings: ["read", "update"],
    users: ["read", "update", "delete", "ban"],
    webhooks: ["create", "read", "update", "delete"],
    analytics: ["read"],
});
