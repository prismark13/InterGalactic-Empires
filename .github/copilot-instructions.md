<!-- Copilot/AI agent instructions for InterGalactic-Empires -->
# InterGalactic-Empires — AI Contributor Guide

Purpose: Help AI coding agents be immediately productive in this small, PowerShell-first repository.

- **Primary entrypoint**: `misson_control.ps1` (root). This is a Windows PowerShell CLI helper that drives repository workflows via direct `git` calls.

Key patterns and examples
- **Branching convention**: new work uses the `feature/` prefix. Example from script:
  - `git checkout -b "feature/$name"` — when creating a branch, follow `feature/<short-descriptor>`.
- **Commit flow**: the script prompts for a commit message and runs `git add .` then `git commit -m "$msg"`.
  - Note: the menu label says "Commit & Push" but the script currently only commits (no `git push`). Be cautious: pushing should be an explicit step.
- **Merging & cleanup**: the script merges the current feature branch into `main`, then deletes it (`git branch -d $current`). The abort path force-deletes (`git branch -D`).

Developer workflows (how humans run things)
- To run locally (Windows PowerShell):
  - `powershell.exe -ExecutionPolicy Bypass -File .\misson_control.ps1`
  - Or first run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` then `.\
misson_control.ps1`
- The script expects a local `git` CLI and Windows PowerShell environment. Do not assume Linux shell utilities are present.

Project-specific conventions and gotchas
- Repository is minimal and script-driven; prefer small, self-contained changes that keep PowerShell-first compatibility.
- Preserve the file name `misson_control.ps1` unless the user asks to rename—this name is user-visible and intentionally used by existing instructions.
- Preserve user-facing prompts and colorized output where possible (calls to `Write-Host -ForegroundColor`). These are part of the UX.
- Be explicit about pushes: if adding automation that pushes branches, document and prompt for explicit confirmation.

Integration points and external dependencies
- `git` CLI only. No CI files or package manifests are present in the repository root.
- Windows PowerShell core behavior is relied on (Read-Host, Write-Host, Clear-Host, exit). Test changes in a Windows PowerShell session.

When making changes
- Keep command examples exact and Windows-friendly. Use `powershell.exe` command samples in docs and PR descriptions.
- If you add automation or cross-platform scripts, update this file and include platform detection and instructions.
- If you modify branching/merge behavior, include tests or manual verification steps showing `git branch --show-current` behavior.

If you need more context
- Search the repo for additional scripts or READMEs; currently only `misson_control.ps1` exists at repository root.
- Ask the repository owner which remote workflows (push policies, protected branches) should be respected before adding automated pushes.

Feedback
- If anything in these notes is unclear or you need additional examples (hooks, CI, or new scripts), ask and I'll expand this guide.
