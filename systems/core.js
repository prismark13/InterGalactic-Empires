// systems/core.js - The Central Nervous System
const DATA = require('../data/constants');

class GameCore {
    constructor(state) {
        this.state = state;
    }

    // --- MAIN PIPELINE ---
    processCommand(cmd) {
        // 1. Clean Input
        const raw = cmd;
        cmd = cmd.trim();
        
        // 2. State-Based Routing
        // If in an encounter, restrict commands
        if (this.state.encounter) {
            this.handleEncounter(cmd);
            return;
        }

        // 3. Global Commands
        if (cmd.startsWith("Travel ")) this.handleTravel(cmd);
        else if (cmd.startsWith("Warp ")) this.handleWarp(cmd);
        else if (cmd.startsWith("Land")) this.handleLand(cmd);
        else if (cmd === "Takeoff") this.handleTakeoff();
        else if (cmd.startsWith("Buy ")) this.handleCommerce(cmd);
        else if (cmd.startsWith("Sell ")) this.handleCommerce(cmd); // Reuses logic
        else if (cmd.startsWith("Recruit ")) this.handleRecruit(cmd);
        else if (cmd.startsWith("Mine ")) this.handleMining(cmd);
        else if (cmd === "Scan Sector") this.handleScan();
        else if (cmd === "Galaxy Map") this.state.map.view_mode = "galaxy";
        
        // 4. Cleanup
        this.syncShipStats();
    }

    // --- SUB-SYSTEMS ---

    handleTravel(cmd) {
        const target = cmd.replace("Travel to ", "");
        if (this.state.ship.stats.fuel_ion < 10) {
            this.log("Insufficient Impulse Fuel.", "error");
            return;
        }
        
        this.state.ship.stats.fuel_ion -= 10;
        
        // 25% Chance of Random Event
        if (Math.random() < 0.25) {
            this.triggerEncounter();
        } else {
            this.state.meta.orbiting = target;
            this.state.meta.landed = false;
            this.log(`Orbit established: ${target}`);
        }
    }

    handleWarp(cmd) {
        const target = cmd.replace("Warp to ", "");
        if (this.state.ship.stats.fuel_warp < 1) {
            this.log("Warp Core: Fuel Depleted.", "error");
            return;
        }
        
        this.state.ship.stats.fuel_warp -= 1;
        this.state.meta.location = target;
        this.state.meta.orbiting = "Deep Space";
        this.state.meta.landed = false;
        this.state.map.view_mode = "sector";
        
        // Generate New System
        if (!this.state.known_systems[target]) {
            this.state.known_systems[target] = this.generateSectorBodies(target);
        }
        this.state.map.sector_bodies = this.state.known_systems[target];
        
        // Generate New Neighbors
        this.state.map.neighbors = ["Sector " + this.rng(1,99), "Nebula " + this.rng(1,99), "Void"];
        this.log(`Warp Jump Successful. Welcome to ${target}.`);
    }

    handleEncounter(cmd) {
        if (cmd === "Attack") {
            // Combat Logic Stub (To be expanded)
            if (Math.random() > 0.4) {
                const loot = this.rng(100, 800);
                this.state.player.units += loot;
                this.log(`Enemy neutralized. Salvaged ${loot} Credits.`, "gm");
            } else {
                const dmg = this.rng(5, 25);
                this.state.ship.stats.hull -= dmg;
                this.log(`Taking fire! Hull at ${this.state.ship.stats.hull}%`, "red");
            }
            this.state.encounter = null;
        } 
        else if (cmd === "Flee" || cmd === "Ignore") {
            this.state.encounter = null;
            this.log("Escaping combat zone.");
        }
        else if (cmd === "Mine Asteroid") {
            this.mineAction();
            this.state.encounter = null;
        }
        else if (cmd === "Trade") {
            // Simple Trade Stub
            this.log("Trade successful.", "player");
            this.state.encounter = null;
        }
    }

    handleLand(cmd) {
        const target = cmd.replace("Land on ", "");
        if (this.state.meta.orbiting !== target) {
            this.log("ERROR: Must be in orbit to land.", "error");
            return;
        }
        this.state.meta.landed = true;
        // Regenerate Local Economy
        this.state.local_market = this.generateMarket();
        this.state.local_shipyard = this.generateShipyard();
        this.state.local_lounge = this.generateLounge();
    }

    handleTakeoff() {
        this.state.meta.landed = false;
        this.log("Liftoff successful.");
    }

    handleCommerce(cmd) {
        const parts = cmd.split(" ");
        const type = parts[0]; // Buy or Sell
        const isPart = parts[1] === "Part";

        if (isPart && type === "Buy") {
            const name = cmd.replace("Buy Part ", "");
            const part = this.state.local_shipyard.find(p => p.name === name);
            if (part && this.state.player.units >= part.price) {
                this.state.player.units -= part.price;
                this.state.ship.equipment.push({ ...part }); // Clone
                this.state.local_shipyard = this.state.local_shipyard.filter(p => p !== part);
            }
        } 
        else if (type === "Buy") {
            const qty = parseInt(parts[1]);
            const name = parts.slice(2).join(" ");
            const item = this.state.local_market.find(i => i.name === name);
            if (item && this.state.player.units >= item.price * qty) {
                this.state.player.units -= item.price * qty;
                const ex = this.state.ship.cargo.find(c => c.name === name);
                if (ex) ex.qty += qty;
                else this.state.ship.cargo.push({ name: name, qty: qty, val: item.price, weight: 1, type: item.type });
                
                // Refuel Checks
                if (name.includes("Ionic Gel")) this.state.ship.stats.fuel_ion += (qty * 10);
                if (name.includes("Hyper-Crystals")) this.state.ship.stats.fuel_warp += qty;
            }
        }
        else if (type === "Sell") {
            const qty = parseInt(parts[1]);
            const name = parts.slice(2).join(" ");
            const idx = this.state.ship.cargo.findIndex(c => c.name === name);
            if (idx > -1 && this.state.ship.cargo[idx].qty >= qty) {
                const item = this.state.ship.cargo[idx];
                this.state.player.units += Math.floor(item.val * 0.8 * qty);
                item.qty -= qty;
                if (item.qty <= 0) this.state.ship.cargo.splice(idx, 1);
            }
        }
    }

    handleRecruit(cmd) {
        const name = cmd.replace("Recruit ", "");
        const r = this.state.local_lounge.recruits.find(x => x.name === name);
        if (r && this.state.player.units >= r.cost) {
            this.state.player.units -= r.cost;
            this.state.ship.crew.push(r);
            this.state.local_lounge.recruits = this.state.local_lounge.recruits.filter(x => x !== r);
        }
    }

    handleMining(cmd) {
        this.mineAction();
    }

    handleScan() {
        this.state.map.view_mode = "sector";
        const loc = this.state.meta.location;
        // Ensure Data Exists
        if (!this.state.known_systems[loc] || this.state.known_systems[loc].length === 0) {
            this.state.known_systems[loc] = this.generateSectorBodies(loc);
        }
        this.state.map.sector_bodies = this.state.known_systems[loc];
        this.log("Sector Analysis Complete.");
    }

    // --- UTILITIES ---
    rng(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    
    log(text, type="system") { 
        this.state.log.push({ text, type }); 
        if(this.state.log.length > 50) this.state.log.shift();
    }

    // --- GENERATORS ---
    initializeSystem() {
        const loc = this.state.meta.location;
        if (!this.state.known_systems[loc]) {
            this.state.known_systems[loc] = this.generateSectorBodies(loc);
        }
        this.state.map.sector_bodies = this.state.known_systems[loc];
    }

    generateSectorBodies(sysName) {
        if (sysName.includes("Veridia")) return DATA.STARTER_PLANETS;
        
        const starType = DATA.STAR_TYPES[this.rng(0, DATA.STAR_TYPES.length-1)];
        let bodies = [{ name: sysName, type: starType, is_star: true, desc: "System Star." }];
        
        const count = this.rng(3, 7);
        for(let i=0; i<count; i++) {
            const pType = DATA.PLANET_TYPES[this.rng(0, DATA.PLANET_TYPES.length-1)];
            const mineable = (pType.includes("Moon") || pType.includes("Asteroid"));
            let eco = "Unknown";
            if(pType.includes("Gas")) eco = "Refinery";
            else if(pType.includes("Terran")) eco = "Agrarian";
            else eco = "Colony";

            bodies.push({ 
                name: `${sysName} ${['I','II','III','IV','V'][i]}`, 
                type: pType, economy: eco, desc: `A ${pType} world.`, mineable: mineable 
            });
        }
        return bodies;
    }

    generateMarket() {
        let items = [];
        items.push({ name: "Ionic Gel", type: "Fuel", price: 10, qty: 200, rarity: {name:"Common", color:"#3b82f6"} });
        
        // Shuffle Commodities
        let pool = [];
        Object.keys(DATA.COMMODITIES).forEach(k => DATA.COMMODITIES[k].forEach(i => pool.push({name:i, type:k})));
        
        for(let i=0; i<15; i++) {
            const item = pool[this.rng(0, pool.length-1)];
            items.push({ name: item.name, type: item.type, price: this.rng(20, 400), qty: this.rng(5, 50), rarity: {name:"Standard", color:"#fff"} });
        }
        return items;
    }

    generateShipyard() {
        // Shuffle Parts
        let pool = [...DATA.SHIP_PARTS];
        let stock = [];
        for(let i=0; i<6; i++) {
            if(pool.length === 0) break;
            const idx = this.rng(0, pool.length-1);
            stock.push({ ...pool[idx] }); // Clone
            pool.splice(idx, 1);
        }
        return stock;
    }

    generateLounge() {
        let lounge = { recruits: [], rumors: ["Quiet today.", "Check the asteroids."] };
        for(let i=0; i<3; i++) {
            const role = DATA.ROLES[this.rng(0, DATA.ROLES.length-1)];
            // Simple name picker for now
            const nameList = DATA.NAMES.Spacer || ["Rookie"];
            const name = nameList[this.rng(0, nameList.length-1)];
            lounge.recruits.push({ name: name, role: role, cost: this.rng(100, 500), desc: "Available." });
        }
        return lounge;
    }

    generateEncounter() {
        const roll = Math.random();
        if (roll < 0.3) return { type: "Pirate", text: "Pirate attack imminent!", hostile: true };
        if (roll < 0.5) return { type: "Trader", text: "A trader hails you.", hostile: false };
        return { type: "Asteroid", text: "Dense mineral field.", hostile: false, mineable: true };
    }

    triggerEncounter() {
        this.state.encounter = this.generateEncounter();
        this.state.meta.orbiting = "Deep Space";
        this.log("ALERT: Interdiction detected!", "error");
    }

    mineAction() {
        const roll = Math.random();
        let list = DATA.MINERALS.Tier1;
        if (roll > 0.9) list = DATA.MINERALS.Tier3;
        else if (roll > 0.7) list = DATA.MINERALS.Tier2;

        const ore = list[this.rng(0, list.length-1)];
        const qty = this.rng(1, 5);
        
        const existing = this.state.ship.cargo.find(c => c.name === ore);
        if(existing) existing.qty += qty;
        else this.state.ship.cargo.push({ name: ore, qty: qty, val: this.rng(20, 100), weight: 1, type: "Material" });
        
        this.log(`Mining Yield: ${qty}x ${ore}`, "system");
    }

    syncShipStats() {
        const s = this.state.ship;
        if (!s) return;
        s.crew = s.crew || []; s.equipment = s.equipment || []; s.cargo = s.cargo || [];
        s.weapons = s.equipment.filter(i => i.type === "Weapon");
        s.systems = s.equipment.filter(i => i.type === "System" || i.type === "Engine" || i.type === "Sensor");
        const crewC = s.crew.length;
        const gearC = s.equipment.length;
        const carC = s.cargo.reduce((a,b)=>a+Math.ceil(((b.qty||1)*(b.weight||1))/20), 0);
        if(!s.stats) s.stats = { hull: 100, fuel_ion: 100 };
        s.stats.slots_used = crewC + gearC + carC;
    }
}

module.exports = GameCore;