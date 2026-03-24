# Project Setup Workflow — Draft Spec

> **Status: DRAFT** — macro-steps only. Details to be defined in dedicated brainstorming sessions per step.

## Goal

Define a rational, ordered workflow for starting a side project from scratch with a focus on agentic coding. This workflow is both a learning vehicle for agentic development and a methodology to follow for this specific project.

## Macro-Steps

### 1. Brainstorming
Explore and define the concept in depth before touching any code or tooling. Covers: purpose, user needs, core concepts, architecture options, UI/UX direction. Output: a validated spec document.

### 2. Claude Code Configuration
Set up the agentic tooling. Covers: hooks, permissions, skills, MCP servers, memory setup, CLAUDE.md rules. Goal: make the agentic workflow smooth and consistent from the first line of code.

**Plugins installed:**
- `frontend-design`
- `superpowers`
- `code-review`
- `github`
- `code-simplifier`

### 3. Stack Decision
Choose the technologies that will be used. Covers: frontend framework, build tooling, deployment target, content parsing. Decisions should be informed by the architecture defined in step 1.

### 4. Workflow Definition
Define how the project will be developed day-to-day. Covers: branching strategy, commit conventions, PR process, how agentic sessions are structured, how learning is tracked alongside development.

---

*After all 4 steps are complete → proceed to implementation.*

## Open Questions

- Should each macro-step have its own brainstorming session?
- Does the configuration in step 4 live in the repo (shared with forks) or in personal global config?
