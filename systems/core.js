// systems/core.js
const DATA = require('../data/constants');

class GameCore {
    constructor(state) { this.state = state; }
    rng(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    log(text, type="system") { this.state.log.push({ text, type }); if(this.state.log.length > 40) this.state.log.shift(); }

    // --- ENCOUNTERS ---
    generateEncounter() {
        const roll = Math.random();
        
        if (roll < 0.30) {
            // PIRATE (Combat)
            return { 
                type: "Pirate", 
                text: "HOSTILE DETECTED: A modified Raider is charging weapons. They want your cargo.",
                options: ["Attack", "Flee", "Surrender Cargo"],
                power: this.rng(50, 150) 
            };
        } else if (roll < 0.50) {
            // DERELICT (Salvage)
            return {
                type: "Derelict",
                text: "SENSOR PING: A drifting freighter with no life signs. It looks lootable.",
                options: ["Salvage", "Ignore"],
                loot_tier: this.rng(1, 3)
            };
        } else if (roll < 0.70) {
            // TRADER (Shop)
            const item = DATA.COMMODITIES.Tech[this.rng(0, 4)];
            return {
                type: "Trader",
                text: `INCOMING HAIL: "Got some ${item} cheap. Interested?"`,
                options: ["Trade", "Ignore"],
                trade_item: { name: item, price: this.rng(50, 100) }
            };
        } else {
            // ASTEROID (Mining)
            return { 
                type: "Asteroid", 
                text: "NAV WARNING: Entering dense asteroid field. Rich mineral deposits detected.",
                options: ["Mine", "Navigate Through"],
                yield: this.rng(2, 5)
            };
        }
    }

    resolveCombat() {
        const enc = this.state.encounter;
        if(!enc) return;
        
        const shipPower = (this.state.ship.weapons.length * 50) + (this.state.ship.stats.shields / 2);
        const winChance = shipPower / (shipPower + enc.power);
        
        if (Math.random() < winChance) {
            // VICTORY
            const loot = this.rng(100, 500);
            this.state.player.units += loot;
            this.log(`TARGET DESTROYED. Salvaged ${loot} U.`, "player");
            // Chance for item drop
            if(Math.random() > 0.5) this.grantLoot();
        } else {
            // DEFEAT / DAMAGE
            const dmg = this.rng(10, 40);
            this.state.ship.stats.hull -= dmg;
            this.log(`HULL BREACH! Taken ${dmg}% damage. Enemy disengaged.`, "error");
            if (this.state.ship.stats.hull <= 0) {
                this.state.ship.stats.hull = 1; // Mercy rule
                this.log("CRITICAL FAILURE. Emergency Systems Active.", "error");
            }
        }
        this.state.encounter = null;
        this.syncShipStats();
    }

    resolveSalvage() {
        this.log("Boarding party reports success. Loading cargo.", "system");
        this.grantLoot();
        this.grantLoot(); // Double loot
        this.state.encounter = null;
        this.syncShipStats();
    }

    resolveTrade() {
        const enc = this.state.encounter;
        if(enc && enc.trade_item) {
            if(this.state.player.units >= enc.trade_item.price) {
                this.state.player.units -= enc.trade_item.price;
                this.state.ship.cargo.push({ 
                    name: enc.trade_item.name, qty: 1, val: enc.trade_item.price * 2, weight: 1 
                });
                this.log(`Bought ${enc.trade_item.name}.`, "player");
            } else {
                this.log("Insufficient Funds.", "error");
            }
        }
        this.state.encounter = null;
        this.syncShipStats();
    }

    grantLoot() {
        const item = DATA.LOOT_TABLE[this.rng(0, DATA.LOOT_TABLE.length-1)];
        // Add to cargo (merge if exists)
        const existing = this.state.ship.cargo.find(c => c.name === item.name);
        if(existing) existing.qty += 1;
        else this.state.ship.cargo.push({ name: item.name, qty: 1, val: item.val, weight: item.weight, type: item.type });
        this.log(`Acquired: ${item.name}`, "system");
    }

    mineAction() {
        const roll = Math.random();
        let lootList = DATA.MINERALS.Tier1;
        if(roll > 0.90) lootList = DATA.MINERALS.Tier3;
        else if(roll > 0.60) lootList = DATA.MINERALS.Tier2;

        const ore = lootList[this.rng(0, lootList.length-1)];
        const qty = this.rng(1, 4);
        
        const existing = this.state.ship.cargo.find(c => c.name === ore);
        if(existing) existing.qty += qty;
        else this.state.ship.cargo.push({ name: ore, qty: qty, val: this.rng(20, 100), weight: 1, type: "Material" });
        
        this.log(`Mining Yield: ${qty}x ${ore}`, "system");
        
        // If doing an encounter mine, clear it
        if(this.state.encounter && this.state.encounter.type === "Asteroid") {
            this.state.encounter = null;
        }
        this.syncShipStats();
    }

    // ... [Include Generators from previous core.js (generateSectorBodies, etc.)] ...
    // ... [Include Sync Logic from previous core.js] ...
    
    // (Duplicated strictly for this response context, ensure full file has them)
    generateSectorBodies(sysName) {
        if (sysName === "Veridia Prime") return DATA.STARTER_PLANETS;
        const starType = DATA.STAR_TYPES[this.rng(0, DATA.STAR_TYPES.length-1)];
        let bodies = [{ name: sysName, type: starType, is_star: true, desc: "System Star." }];
        for(let i=0; i<this.rng(3,7); i++) {
            const pType = DATA.PLANET_TYPES[this.rng(0, DATA.PLANET_TYPES.length-1)];
            const mineable = (pType.includes("Moon") || pType.includes("Asteroid"));
            bodies.push({ name: `${sysName} ${i+1}`, type: pType, economy: "Unknown", desc: "Orbiting body.", mineable: mineable });
        }
        return bodies;
    }
    generateMarket() { return []; /* Placeholder to save space, use V7.0 version */ }
    generateShipyard() { return []; /* Placeholder to save space */ }
    generateLounge() { return { recruits:[], rumors:[] }; /* Placeholder */ }
    
    travel(target) {
        if(this.state.ship.stats.fuel_ion >= 10) {
            this.state.ship.stats.fuel_ion -= 10;
            if (Math.random() < 0.25) { // 25% Encounter Chance
                this.state.encounter = this.generateEncounter();
                this.state.meta.orbiting = "Deep Space";
                this.log("ALERT: Hyperspace Interdiction.", "error");
            } else {
                this.state.meta.orbiting = target;
                this.state.meta.landed = false;
                this.log(`Orbit established: ${target}`, "system");
            }
        } else {
            this.log("Insufficient Ionic Fuel.", "error");
        }
        this.syncShipStats();
    }

    syncShipStats() {
        const s = this.state.ship;
        if (!s) return;
        s.crew = s.crew || []; s.equipment = s.equipment || []; s.cargo = s.cargo || [];
        s.weapons = s.equipment.filter(i => i.type === "Weapon");
        s.systems = s.equipment.filter(i => i.type === "System");
        const crewC = s.crew.length; const gearC = s.equipment.length;
        const carC = s.cargo.reduce((a,b)=>a+Math.ceil(((b.qty||1)*(b.weight||1))/20), 0);
        if(!s.stats) s.stats = { hull: 100, fuel_ion: 100 };
        s.stats.slots_used = crewC + gearC + carC;
    }
}
module.exports = GameCore;