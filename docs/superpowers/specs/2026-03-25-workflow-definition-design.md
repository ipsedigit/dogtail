# Workflow Definition — Design

> **Status: APPROVED**

## Goal

Define how dogtail is developed day-to-day: branching, commits, PRs, agentic session structure, and spec conventions.

---

## Branching & Merging

- `main` is always stable. No direct commits except trivial housekeeping (e.g., CLAUDE.md updates).
- Feature branches follow `feat/<phase>/<topic>` — e.g., `feat/p1/build-script`, `feat/p1/graph-canvas`.
  - Phase maps to the implementation plan phase number; topic is a short descriptive slug.
  - Exception: `feat/initial-build` (existing branch) is grandfathered and does not follow this convention.
- One branch per task — each branch maps 1:1 to a task spec.
- When work is done: open a PR, self-review the diff, merge to `main`, delete the branch.

---

## Commits

- Commit messages are imperative plain English — e.g., `Add neighborhood filter to graph canvas`.
- Only the human commits. The agent writes code; the human stages, reviews, and commits.
- No enforced prefix convention. Clarity over format.
- Commit granularity is up to the human — one commit per PR is fine, more if it helps the diff story.

---

## PRs

- All work lands on `main` via self-reviewed PRs.
- Human opens the PR, reviews the diff, and merges.
- No external reviewers required for a solo project.

---

## Agentic Session Structure

- `CLAUDE.md` (project root) is the persistent context anchor. It must be created before the first implementation session. It contains: project overview, stack, constraints, active skills, and workflow rules. Creating CLAUDE.md is a prerequisite task, not covered by this spec.
- Every task has a spec (see Spec Creation below). The spec is what the agent reads to orient itself for that task.
- Session flow:
  1. Human points agent at a task spec
  2. Agent implements against the spec
  3. Human reviews the diff and commits
  4. Human opens a PR, self-reviews, and merges
- Chat is ephemeral and used to refine specs mid-session. The agent writes the refined spec to disk during the session; the human commits it after.
- Session handoff docs (like `2026-03-25-session-handoff.md`) were used during the project setup phase and are no longer needed going forward. The spec + CLAUDE.md replace them.

---

## Spec Creation

- Every task starts with a brainstorming session (`superpowers:brainstorming`) to define the design.
- The brainstorming session produces a spec file written to disk at `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` before the session ends.
- The spec is committed by the human after the session.
- Chat is ephemeral — the committed spec is the persistent record of every design decision.

---

## Learning Tracking

Deferred. Not in scope for the current workflow. Will be revisited once the first implementation tasks are underway and patterns become clearer.
