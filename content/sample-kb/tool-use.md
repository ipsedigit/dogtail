---
type: concept
title: Tool Use
overview: "Calling external functions from an LLM"
from:
  - source: bigbang
    edge: "covers"
---

Tool use lets a language model call external functions during generation. The model emits a structured tool call; the host executes it and feeds the result back.

Key patterns:
- File read/write
- Shell execution
- Web search
- API calls
