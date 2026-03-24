# Functional Spec — Draft

> **Status: DRAFT** — macro level only. Details to be refined in future brainstorming sessions.

## Overview

A web application that lets users explore a collection of knowledge bases as interactive directed graphs, and export selected portions of their knowledge as a well-formatted, human-readable document.

## Core Features

### Knowledge Base Selection
- The app presents a list of available knowledge bases
- The user can select one to explore in isolation
- The user can also access a unified view that merges all knowledge bases into a single graph

### Graph Visualisation
- The main view is an interactive DAG (Directed Acyclic Graph)
- Nodes represent units of knowledge; edges represent typed, directed relationships between them
- Nodes are visually distinct by type
- Edges are visually distinct by type
- Cross-knowledge-base connections are visible in the unified view

### Node Interaction
- Clicking a node opens its content (rendered from markdown)
- From an open node, the user can navigate to connected nodes

### Export
- The user selects which node types and edge types to include in the export
- The app generates two different outputs from the filtered subset of the graph:
  - **Human format** — a well-formatted, readable document meant for human consumption
  - **Agent format** — a structured output optimized as context for an AI agent

### Additional Views
- Beyond the graph, the application will include other views with different interaction modes (TBD)

## Content

- Content is authored as markdown files with structured metadata (node type, incoming edges with labels)
- The application is read-only — users do not submit or edit content through the UI
- The framework is decoupled from the content, so different users can provide their own knowledge bases

## Open Questions

- What is the exact format of the human export? (PDF, markdown, HTML?)
- What is the exact format of the agent export? (JSON, XML, plain structured text?)
- What are the additional views beyond the graph?
- What node types exist? Are they fixed by the framework or user-defined?
- What edge types exist? Are they fixed by the framework or user-defined?
- Search and filtering capabilities?
