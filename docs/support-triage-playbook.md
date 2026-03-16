# Support and Triage Playbook

## Intake sources

- `/dashboard/messages` for contact and inbound beta requests
- `/dashboard/beta-ops` for tracked beta accounts and feedback
- Sentry, logs, and smoke checks for operational incidents

## Message classification

### General

Use for:

- reader questions
- partnership or generic contact messages
- support requests not tied to beta launch ops

### Beta request

Use for:

- inbound requests from `/lumina/beta`
- launch conversations that may become active beta accounts

## Triage steps

1. Identify message type.
2. If it is a serious beta request, promote it into Beta Ops.
3. If it is support, respond or archive only after the next step is clear.
4. If the issue reveals product friction, log feedback before closing the loop.

## Response expectations

- acknowledge the issue or request clearly
- state the next action
- avoid promising timelines unless the owner has confirmed them
- capture any repeated pain in feedback, not only in chat

## Common cases

### Pricing confusion

1. Explain current beta-vs-paid expectation.
2. Log feedback if the confusion came from product copy or flow.

### Setup confusion

1. Confirm where the user is blocked.
2. Check setup and Beta Ops state.
3. Convert the issue to `blocked` onboarding if Lumina must act.

### Publish or newsletter issue

1. Confirm whether it is operational or product friction.
2. Check readiness, logs, and queue health when relevant.
3. Record a feedback item if the issue should influence roadmap or docs.
