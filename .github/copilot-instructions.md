<!-- Copilot/AI agent instructions for InterGalactic-Empires -->
# InterGalactic-Empires — AI Contributor Guide

## Purpose
Help AI coding agents be immediately productive in this small, PowerShell-first, Node.js + Express space game prototype.

## Project Structure
- **Primary entrypoint**: `misson_control.ps1` (root) — Windows PowerShell CLI helper for repository git workflows.
- **Backend**: `server.js` — Express.js app; loads/saves `game_state.json`; handles commands via `POST /command`; optional Generative AI client.
- **Game logic**: `systems/core.js` — Pure game-state mutators (GameCore class with generators and actions).
- **Data**: `data/constants.js` — Static tables (commodities, ship parts, planet/star types, starter planets).
- **Frontend**: `index.html`, `app.js`, `style.css` — Vanilla JS + DOM; renders map, UI, and sends commands.
- **Persistence**: `game_state.json` — single file-based save; created/loaded at startup.

## Key Patterns & Conventions

### Branching & Commits
- **Branch naming**: use `feature/<short-descriptor>` when creating a branch (driven by `misson_control.ps1`).
- **Commit flow**: script prompts for message, runs `git add .`, then `git commit -m "$msg"`.

### Environment Variables & Secrets
- **API Key (optional but enables AI)**:
  - Accepted names: `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `API_KEY`, `GEN_AI_KEY` (server tries each in order).
  - If missing: server logs a warning and runs in dev mode (no AI, game still playable).
  - **CRITICAL**: Never commit `.env` with real secrets. Use `.env.example` as template.
- **Optional overrides**:
  - `MODEL` or `MODEL_NAME`: Generative model name (defaults to `gemini-2.0-flash`).
  - `PORT`: Server port (defaults to `3000`).

### Developer Workflows

#### Run Locally (Windows PowerShell)
```powershell
# Check/set API key for this session
$env:GEMINI_API_KEY = 'your_api_key_or_leave_empty_for_dev_mode'

# Start server
node .\server.js

# Server will print:
#   - "SYSTEM ONLINE: http://localhost:3000"
#   - Warning if no API key (dev mode enabled)
#   - Startup status of AI model if key is present
```

#### Quick Health Check
```powershell
Invoke-RestMethod -Uri http://localhost:3000/ping -Method Get | ConvertTo-Json
# Response: { "ok": true, "ai": false/true, "model": "...", "location": "..." }
```

#### Test a Command (PowerShell)
```powershell
$body = @{ command = 'Scan Sector' } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/command -Method Post -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 5
```

### Server Command Handling
- Commands are case-insensitive and trimmed (e.g., "Scan Sector", "scan sector", "SCAN SECTOR" all work).
- Each command handler calls `respondState()` to sync ship stats, save state, and return current state to client.
- Logging: all commands are logged to console; unknown commands are logged to in-game log.
- Endpoints:
  - `POST /command` — main game command handler (returns full state).
  - `GET /state` — safe state retrieval (no mutations).
  - `GET /ping` — health check (shows AI availability and current location).

### Frontend
- **Init**: loads `game_state.json` on page load; if invalid, calls `RESTART_GAME`.
- **Rendering**: `render(data)` updates UI; `renderMap()` draws sector/galaxy view.
- **Error handling**: network or server errors are now surfaced in in-game log (visible to player).
- **Command sending**: `window.sendCmd(text)` sends to `/command` and updates UI.

### GameCore (Game Rules Engine)
All game logic mutations go through `GameCore` instance:
- `generateSectorBodies(sysName)` — returns array of planets/stars for a system.
- `generateMarket()` — random commodities for landing locations.
- `generateLounge()` — random recruits and rumors.
- `generateEncounter()` — random space events.
- `travel(target)` — move between planets; may trigger encounter.
- `mineAction()` — harvest resources.
- `resolveCombat()` — handle hostile encounters.
- `syncShipStats()` — compute cargo/crew slots used.

## Project-Specific Conventions

- **No external DB**: file-based persistence (simple, fast to iterate).
- **Vanilla frontend**: no build step, no framework; all static files served directly.
- **Single process**: synchronous I/O via `fs.writeFileSync` (fine for prototypes).
- **AI is optional**: server continues without AI if key is missing or initialization fails.
- **Command strings are plain English**: e.g., `"Scan Sector"`, `"Travel to Veridia Prime"`, `"Buy 5 Ionic Gel"`.

## Integration Points & Dependencies

### External
- `@google/generative-ai` — Generative AI client (optional; gracefully skipped if missing or key absent).
- `express`, `cors`, `body-parser`, `dotenv` — standard Node.js server stack.

### File I/O
- `fs.readFileSync`/`fs.writeFileSync` synchronous; blocks event loop but acceptable for single-process prototype.
- Errors during save are caught and logged; server does not exit.

## When Making Changes

### Add New Commands
1. Add handler in `/command` route (use lowercase/case-insensitive matching: `if (n.startsWith('mycommand'))`).
2. Call appropriate `core` method to mutate state.
3. Call `respondState()` to sync, save, and return.
4. Test with PowerShell `Invoke-RestMethod` or browser `/command` endpoint.

### Modify Game State Shape
- Edit `createFreshState()` if adding new top-level fields.
- Update `loadState()` to handle migrations if existing saves need upgrades.
- Test by deleting `game_state.json` and restarting server.

### Improve AI Integration
- AI initialization is in `initAI()` function; currently uses `@google/generative-ai` SDK.
- To extract AI to a module, create `services/ai.js` and import it; this decouples from `server.js`.
- Always wrap AI calls in try-catch; log errors, do not crash.

### Error Visibility
- Server errors: log to console and respond with JSON error details.
- Client errors: surface in in-game log and DevTools console.
- Use `core.log(message, type)` to add entries to in-game log; visible in-game.

## Key Files & Examples

| File | Purpose |
|------|---------|
| `server.js` | Express backend; command handlers; state loading/saving. |
| `systems/core.js` | Game logic engine; generators and actions. |
| `data/constants.js` | Static data (commodities, ship parts, planets, names, minerals). |
| `app.js` | Frontend JS; renders UI, sends commands. |
| `index.html` | Static HTML structure. |
| `style.css` | Cyberspace-themed styling. |
| `misson_control.ps1` | PowerShell git helper. |
| `.env.example` | Template for environment variables. |

## Common Issues & Solutions

### Server won't start / "CRITICAL: Missing .env API Key"
- **Old behavior**: server exited if `GEMINI_API_KEY` was missing.
- **New behavior**: server logs a warning and runs without AI (dev mode enabled).
- **Solution**: no action needed; server will start. Set `GEMINI_API_KEY` if you want AI.

### "Scan Sector" does nothing
- **Cause**: (previously fixed by this update) command wasn't recognized or error was silent.
- **Check**: look for `Command received: Scan Sector` in server console.
- **In-game**: network/server errors now appear in in-game log.

### API key rejected / model not found
- Check that key format is correct (should NOT start with "AIza" for Generative AI; those are REST keys).
- Verify model name is correct: `gemini-2.0-flash`, `gemini-1.5-flash`, or other available model.
- Set `MODEL` env var to override: `$env:MODEL = 'gemini-1.5-flash'`.

## If You Need More Context
- Ask the repository owner which remote workflows (push policies, protected branches) should be respected.
- For questions about specific game rules or balance, refer to `systems/core.js` and `data/constants.js`.
- For frontend rendering issues, trace through `renderMap()` and `render(data)` in `app.js`.

