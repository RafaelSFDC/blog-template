# Beta Onboarding Playbook

## Goal

Take a qualified beta request from interest to launch-capable setup with a repeatable checklist.

## Qualification

Promote a request into Beta Ops when:

- the ICP matches creators, journalists, or small publications
- the team has a real launch or migration motion
- there is a concrete workflow pain around setup, newsletter, memberships, or editorial operations

Leave it as `new_lead` when fit is still unclear.

## Standard onboarding path

1. Promote the request from inbox into `/dashboard/beta-ops`.
2. Set:
   - `account_stage = qualified`
   - `onboarding_status = scheduled`
   - owner
   - next follow-up date
3. During kickoff, confirm:
   - publication type
   - current stack
   - launch timeline
   - monetization expectations
   - newsletter needs
4. Move to:
   - `account_stage = onboarding`
   - `onboarding_status = in_progress`
5. Verify the account can:
   - complete setup
   - create base pages
   - publish first content
   - configure newsletter basics
   - understand pricing/paywall flow
6. Move to:
   - `account_stage = active_beta`
   - `onboarding_status = completed`

## Blocked path

Use `blocked` when:

- setup cannot be completed
- publish or pricing is failing
- onboarding is waiting on Lumina changes
- the next step is not in the beta user’s control

When blocked:

1. Add or update a feedback item.
2. Write the blocking reason in account notes.
3. Set the next follow-up date.

## Done criteria

An onboarding is complete when:

- the account is not blocked
- the operator knows the next action without re-reading old chat
- feedback is logged if friction still exists
