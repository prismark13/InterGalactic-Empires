// server.js - V12.0 ROBUST (Complete Command Handlers + Error Handling)
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const GameCore = require('./systems/core');
const DATA = require('./data/constants');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || process.env.GEN_AI_KEY;
const MODEL_NAME = process.env.MODEL || process.env.MODEL_NAME || "gemini-2.0-flash";

// Global error handler - catch unhandled exceptions
process.on('uncaughtException', (err) => {
    console.error('CRITICAL ERROR:', err);
    // Server continues running; errors are logged
});

// Optional AI initialization - safe fallback if key missing
let model = null;
let aiEnabled = false;
if (API_KEY) {
    try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(API_KEY);
        model = genAI.getGenerativeModel({ model: MODEL_NAME });
        aiEnabled = true;
        console.log(`AI ENABLED: Model ${MODEL_NAME} loaded.`);
    } catch (e) {
        console.warn("AI initialization failed (dev mode enabled):", e.message);
    }
} else {
    console.warn("WARNING: No API key found. AI features disabled (dev mode enabled).");
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

let gameState;
let core;

function createFreshState() {
    return {
        meta: { location: "Veridia Prime", date: "2400.01.01", landed: false, orbiting: "Veridia Prime" },
        player: { units: 1000 },
        ship: {
            class: "Cutter",
            caps: { crew: 6, weapons: 2, cargo: 20, systems: 4 },
            stats: { hull: 100, shields: 100, fuel_ion: 100, fuel_warp: 2, slots_max: 32, slots_used: 0 },
            crew: [{ name: "Shepard", role: "Captain", salary: 0 }],
            weapons: [{ name: "Mining Laser", type: "Weapon", weight: 2, price: 200 }],
            systems: [{ name: "Standard Fuel Tank", type: "System", weight: 5, price: 200 }],
            cargo: [{ name: "Nutri-Paste Tubes", qty: 5, val: 5, weight: 0.5 }]
        },
        map: { view_mode: "sector", neighbors: ["Sector 4", "The Void"], sector_bodies: DATA.STARTER_PLANETS },
        known_systems: { "Veridia Prime": DATA.STARTER_PLANETS },
        local_market: [], local_shipyard: [], local_lounge: { recruits: [], rumors: [] },
        encounter: null,
        log: [{ type: "system", text: "System Initialized." }]
    };
}

function loadState() {
    try {
        if (!fs.existsSync('game_state.json')) throw new Error("No Save");
        const s = JSON.parse(fs.readFileSync('game_state.json', 'utf8'));
        if (!s.meta || !s.ship || !s.map || !s.meta.location || s.meta.location === "Unknown") {
            throw new Error("Invalid Location Data");
        }
        if (!s.local_lounge || Array.isArray(s.local_lounge)) s.local_lounge = { recruits: [], rumors: [] };
        return s;
    } catch (e) {
        console.log("Save Invalid. Creating New Universe...");
        return createFreshState();
    }
}

function save() {
    try {
        fs.writeFileSync('game_state.json', JSON.stringify(core.state, null, 2));
    } catch (e) {
        console.error("ERROR: Failed to save game state:", e.message);
        core.log("ERROR: Save failed. Progress may not persist.", "error");
    }
}

function sanitizeCommand(cmd) {
    if (!cmd || typeof cmd !== 'string') return '';
    return cmd.trim().toLowerCase();
}

function respondState() {
    core.syncShipStats();
    save();
    return core.state;
}

// Init
gameState = loadState();
core = new GameCore(gameState);
core.syncShipStats();
if (!gameState.known_systems[gameState.meta.location]) {
    gameState.known_systems[gameState.meta.location] = core.generateSectorBodies(gameState.meta.location);
}
gameState.map.sector_bodies = gameState.known_systems[gameState.meta.location];
save();

// --- ROUTES ---

app.get('/ping', (req, res) => {
    res.json({ ok: true, ai: aiEnabled, model: aiEnabled ? MODEL_NAME : null, location: gameState.meta.location });
});

app.get('/state', (req, res) => {
    res.json(gameState);
});

app.post('/command', async (req, res) => {
    try {
        let cmd = sanitizeCommand(req.body.command);
        console.log(`Command received: ${cmd}`);

        // RESTART_GAME
        if (cmd === "restart_game") {
            if (fs.existsSync('game_state.json')) fs.unlinkSync('game_state.json');
            gameState = createFreshState();
            core = new GameCore(gameState);
            core.log("Game restarted.", "system");
            return res.json(respondState());
        }

        // Scan Sector
        if (cmd === "scan sector") {
            gameState.map.view_mode = "sector";
            const loc = gameState.meta.location;
            if (!gameState.known_systems[loc] || gameState.known_systems[loc].length === 0) {
                gameState.known_systems[loc] = core.generateSectorBodies(loc);
            }
            gameState.map.sector_bodies = gameState.known_systems[loc];
            core.log("Sector scanned.", "system");
            return res.json(respondState());
        }

        // Galaxy Map
        if (cmd === "galaxy map") {
            gameState.map.view_mode = "galaxy";
            gameState.map.neighbors = gameState.map.neighbors || ["Alpha Centauri", "Proxima Station", "Kepler Outpost"];
            core.log("Galaxy map displayed.", "system");
            return res.json(respondState());
        }

        // Travel to <location>
        if (cmd.startsWith("travel to ")) {
            const target = req.body.command.substring(10).trim();
            if (!target) return res.json(respondState());
            gameState.meta.orbiting = target;
            if (!gameState.known_systems[target]) {
                gameState.known_systems[target] = core.generateSectorBodies(target);
            }
            gameState.map.sector_bodies = gameState.known_systems[target];
            gameState.meta.landed = false;
            core.log(`Traveled to ${target}.`, "system");
            return res.json(respondState());
        }

        // Land on <planet>
        if (cmd.startsWith("land on ")) {
            const planet = req.body.command.substring(8).trim();
            if (!planet) return res.json(respondState());
            gameState.meta.location = planet;
            gameState.meta.landed = true;
            gameState.local_market = core.generateMarket();
            gameState.local_shipyard = core.generateShipyard();
            gameState.local_lounge = core.generateLounge();
            core.log(`Landed on ${planet}.`, "system");
            return res.json(respondState());
        }

        // Takeoff
        if (cmd === "takeoff") {
            gameState.meta.landed = false;
            gameState.local_market = [];
            gameState.local_shipyard = [];
            gameState.local_lounge = { recruits: [], rumors: [] };
            core.log("Launched from surface.", "system");
            return res.json(respondState());
        }

        // Warp to <system>
        if (cmd.startsWith("warp to ")) {
            const system = req.body.command.substring(8).trim();
            if (!system) return res.json(respondState());
            gameState.meta.location = system;
            gameState.meta.orbiting = system;
            if (!gameState.known_systems[system]) {
                gameState.known_systems[system] = core.generateSectorBodies(system);
            }
            gameState.map.sector_bodies = gameState.known_systems[system];
            gameState.meta.landed = false;
            core.log(`Warped to ${system}.`, "system");
            return res.json(respondState());
        }

        // Mine <location>
        if (cmd.startsWith("mine ")) {
            const target = req.body.command.substring(5).trim();
            if (!target) return res.json(respondState());
            const ore = core.mineAction(target);
            if (ore) gameState.ship.cargo.push(ore);
            core.log(`Mined ${target} for resources.`, "success");
            return res.json(respondState());
        }

        // Mine Asteroid (generic)
        if (cmd === "mine asteroid") {
            const ore = { name: "Raw Ore", qty: 50, val: 100, weight: 1 };
            if (!gameState.ship.cargo.find(c => c.name === ore.name)) gameState.ship.cargo.push(ore);
            else gameState.ship.cargo.find(c => c.name === ore.name).qty += ore.qty;
            core.log("Asteroid mined successfully.", "success");
            return res.json(respondState());
        }

        // Buy <qty> <item>
        if (cmd.startsWith("buy ")) {
            const match = req.body.command.substring(4).match(/^(\d+)\s+(.+)$/);
            if (!match) return res.json(respondState());
            const [, qty, itemName] = match;
            const item = gameState.local_market.find(i => i.name.toLowerCase() === itemName.toLowerCase());
            if (!item) {
                core.log(`Item "${itemName}" not found in market.`, "error");
                return res.json(respondState());
            }
            const cost = item.price * qty;
            if (gameState.player.units < cost) {
                core.log("Insufficient funds.", "error");
                return res.json(respondState());
            }
            gameState.player.units -= cost;
            const existing = gameState.ship.cargo.find(c => c.name === item.name);
            if (existing) existing.qty += parseInt(qty);
            else gameState.ship.cargo.push({ ...item, qty: parseInt(qty) });
            core.log(`Purchased ${qty}x ${item.name}.`, "success");
            return res.json(respondState());
        }

        // Sell <qty> <item>
        if (cmd.startsWith("sell ")) {
            const match = req.body.command.substring(5).match(/^(\d+)\s+(.+)$/);
            if (!match) return res.json(respondState());
            const [, qty, itemName] = match;
            const cargoItem = gameState.ship.cargo.find(i => i.name.toLowerCase() === itemName.toLowerCase());
            if (!cargoItem || cargoItem.qty < qty) {
                core.log("Insufficient cargo to sell.", "error");
                return res.json(respondState());
            }
            const price = (cargoItem.val || 10) * 0.8 * qty;
            gameState.player.units += Math.floor(price);
            cargoItem.qty -= parseInt(qty);
            if (cargoItem.qty <= 0) gameState.ship.cargo = gameState.ship.cargo.filter(c => c !== cargoItem);
            core.log(`Sold ${qty}x ${cargoItem.name}.`, "success");
            return res.json(respondState());
        }

        // Buy Part <partName>
        if (cmd.startsWith("buy part ")) {
            const partName = req.body.command.substring(9).trim();
            const part = gameState.local_shipyard.find(p => p.name.toLowerCase() === partName.toLowerCase());
            if (!part) {
                core.log(`Part "${partName}" not found.`, "error");
                return res.json(respondState());
            }
            if (gameState.player.units < part.price) {
                core.log("Insufficient funds for part.", "error");
                return res.json(respondState());
            }
            gameState.player.units -= part.price;
            if (part.type === 'weapon') gameState.ship.weapons.push(part);
            else if (part.type === 'system') gameState.ship.systems.push(part);
            core.log(`Installed ${part.name}.`, "success");
            return res.json(respondState());
        }

        // Recruit <recruitName>
        if (cmd.startsWith("recruit ")) {
            const recruitName = req.body.command.substring(8).trim();
            const recruit = gameState.local_lounge.recruits.find(r => r.name.toLowerCase() === recruitName.toLowerCase());
            if (!recruit) {
                core.log(`Recruit "${recruitName}" not found.`, "error");
                return res.json(respondState());
            }
            if (gameState.player.units < recruit.cost) {
                core.log("Insufficient funds to hire.", "error");
                return res.json(respondState());
            }
            gameState.player.units -= recruit.cost;
            gameState.ship.crew.push(recruit);
            core.log(`Recruited ${recruit.name}.`, "success");
            return res.json(respondState());
        }

        // Attack
        if (cmd === "attack") {
            if (gameState.encounter) {
                core.log("Engaged with hostile!", "combat");
                gameState.encounter = null;
            }
            return res.json(respondState());
        }

        // Flee
        if (cmd === "flee") {
            if (gameState.encounter) {
                core.log("Fled from encounter.", "system");
                gameState.encounter = null;
            }
            return res.json(respondState());
        }

        // Ignore
        if (cmd === "ignore") {
            if (gameState.encounter) {
                core.log("Ignored encounter.", "system");
                gameState.encounter = null;
            }
            return res.json(respondState());
        }

        // Unknown command
        core.log(`Unknown command: "${req.body.command}".`, "error");
        return res.json(respondState());
    } catch (e) {
        console.error("Command error:", e);
        core.log("ERROR: Command processing failed.", "error");
        return res.json(respondState());
    }
});

// Global error handler - middleware
app.use((err, req, res, next) => {
    console.error("Express error:", err);
    res.status(500).json({ error: "Server error", state: gameState });
});

app.listen(PORT, () => console.log(`SYSTEM ONLINE: http://localhost:${PORT}`));