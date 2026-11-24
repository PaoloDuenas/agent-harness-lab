# agent-harness-lab
A reproducible lab for comparing Claude Code and Codex on real engineering tasks.

## First experiment

Two concurrent webhook requests carry the same event ID. Count the completed side effects in PostgreSQL: the same event should be processed once, while distinct events must still be processed independently.

Start with a failing integration test using synthetic events. Then run Claude Code and Codex in separate clean checkouts of the same commit. Record the model, task, tools, patch, elapsed time and test results for each run.
