// server.js - Error Handler Edition
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const GameCore = require('./systems/core');
const DATA = require('./data/constants');

const app = express();
const PORT = 3000;

// --- CONFIGURATION ---
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.0-flash"; 

if (!API_KEY) { 
    console.error("CRITICAL ERROR: API Key missing. Check your .env file."); 
    process.exit(1); 
}

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); 

// --- ERROR HANDLING MIDDLEWARE ---
// Catches async errors to prevent server crashes
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// --- STATE MANAGEMENT ---
let gameState;
let core;

function loadState() {
    try {
        if (fs.existsSync('game_state.json')) {
            let s = JSON.parse(fs.readFileSync('game_state.json', 'utf8'));
            if (!s.meta) throw new Error("Corrupt State Detected");
            return s;
        }
        throw new Error("No Save Found");
    } catch (e) {
        console.log("Initializing Fresh State:", e.message);
        return createFreshState();
    }
}

function createFreshState() {
    return { 
        meta: { location: "Veridia Prime", date: "2400.01.01", landed: false, orbiting: "Veridia Prime" },
        player: { units: 1000 },
        ship: { 
            class: "Cutter",
            caps: { crew: 6, weapons: 2, cargo: 20, systems: 4 }, 
            stats: { hull: 100, shields: 100, fuel_ion: 100, fuel_warp: 2, slots_max: 32, slots_used: 0 },
            crew: [{ name: "Shepard", role: "Captain", salary: 0 }],
            equipment: [
                { name: "Mining Laser", type: "Weapon", tag: "LAS", weight: 2, price: 200 },
                { name: "Standard Fuel Tank", type: "System", tag: "TNK", weight: 5, price: 200 }
            ],
            cargo: [ { name: "Nutri-Paste Tubes", qty: 5, val: 5, weight: 0.5 } ]
        },
        map: { view_mode: "sector", neighbors: ["Sector 4", "The Void"], sector_bodies: DATA.STARTER_PLANETS },
        known_systems: { "Veridia Prime": DATA.STARTER_PLANETS }, 
        local_market: [], local_shipyard: [], local_lounge: [], encounter: null,
        log: [{ type: "system", text: "System Online." }]
    };
}

// Load and Sync
gameState = loadState();
core = new GameCore(gameState);
core.syncShipStats();
// Force map data if missing
if (!gameState.known_systems[gameState.meta.location]) {
    gameState.known_systems[gameState.meta.location] = core.generateSectorBodies(gameState.meta.location);
}
gameState.map.sector_bodies = gameState.known_systems[gameState.meta.location];

function save() { 
    // Backup previous save before writing
    // if (fs.existsSync('game_state.json')) fs.copyFileSync('game_state.json', 'game_state.bak');
    fs.writeFileSync('game_state.json', JSON.stringify(core.state, null, 2)); 
}

// --- ROUTER ---
app.post('/command', asyncHandler(async (req, res) => {
    const cmd = req.body.command;
    
    // Input Validation
    if (!cmd || typeof cmd !== 'string') {
        throw new Error("Invalid Command Format");
    }

    // 1. RESTART
    if (cmd === "RESTART_GAME") {
        if (fs.existsSync('game_state.json')) fs.unlinkSync('game_state.json');
        gameState = createFreshState();
        core = new GameCore(gameState);
        core.syncShipStats();
        save(); 
        return res.json(core.state);
    }

    // 2. HARD LOGIC HANDLERS
    let handled = false;

    if (cmd === "Scan Sector") {
        core.state.map.view_mode = "sector";
        const loc = core.state.meta.location;
        if (!core.state.known_systems[loc]) core.state.known_systems[loc] = core.generateSectorBodies(loc);
        core.state.map.sector_bodies = core.state.known_systems[loc];
        handled = true;
    }

    if (cmd === "Galaxy Map") {
        core.state.map.view_mode = "galaxy";
        if (core.state.map.neighbors.length < 3) core.state.map.neighbors = ["Alpha Centauri", "Proxima", "Wolf 359"];
        handled = true;
    }

    if (cmd.startsWith("Land")) {
        const target = cmd.replace("Land on ", "");
        if (core.state.meta.orbiting === target) {
            core.state.meta.landed = true;
            core.state.local_market = core.generateMarket();
            core.state.local_shipyard = core.generateShipyard();
            core.state.local_lounge = core.generateLounge();
        } else {
            core.log("ERROR: Must orbit target to land.", "error");
        }
        handled = true;
    }

    if (cmd.startsWith("Travel")) {
        core.travel(cmd.replace("Travel to ", ""));
        handled = true;
    }

    if (cmd.startsWith("Buy")) {
        // ... (Keep existing buy logic) ...
        const parts = cmd.split(" ");
        if(parts[1]==="Part") {
            const name = cmd.replace("Buy Part ", "");
            const part = core.state.local_shipyard.find(p=>p.name===name);
            if(part && core.state.player.units>=part.price) {
                core.state.player.units-=part.price;
                core.state.ship.equipment.push(part);
                core.state.local_shipyard = core.state.local_shipyard.filter(p=>p!==part);
            }
        } else {
            const qty = parseInt(parts[1]); const name = parts.slice(2).join(" ");
            const item = core.state.local_market.find(i=>i.name===name);
            if(item && core.state.player.units>=item.price*qty) {
                core.state.player.units-=item.price*qty;
                const ex = core.state.ship.cargo.find(c=>c.name===name);
                if(ex) ex.qty+=qty;
                else core.state.ship.cargo.push({name:name,qty:qty,val:item.price,weight:1,type:item.type});
                if(name.includes("Ionic Gel")) core.state.ship.stats.fuel_ion+=qty*10;
            }
        }
        handled = true;
    }
    
    if (cmd.startsWith("Sell ")) { /* ... same as before ... */ handled = true; }
    if (cmd.startsWith("Takeoff")) { core.state.meta.landed = false; handled = true; }
    if (cmd.startsWith("Mine ")) { core.mineAction(); handled = true; }

    // 3. AI FALLBACK (Only if not handled by hard logic)
    if (!handled) {
        try {
            const prompt = `Context: GM. State: ${JSON.stringify(core.state)} | Cmd: "${cmd}"`;
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json/g, '').replace(/```/g, '');
            const newState = JSON.parse(text);
            core.state = newState; 
        } catch (aiError) {
            console.error("AI Logic Failed:", aiError);
            core.log("Comms Interference. Command Unclear.", "error");
        }
    }

    // Final Sync & Save
    core.syncShipStats();
    save();
    res.json(core.state);
}));

// --- GLOBAL ERROR HANDLER ---
// This catches any crash in the routes above
app.use((err, req, res, next) => {
    console.error("SERVER CRASH:", err.stack);
    res.status(500).json({
        error: true,
        message: "Internal System Failure",
        log: [{ type: "error", text: `CRITICAL ERROR: ${err.message}` }]
    });
});

app.listen(PORT, () => console.log(`SECURE SYSTEM ONLINE: http://localhost:${PORT}`));