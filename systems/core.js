// systems/core.js
const DATA = require('../data/constants');

class GameCore {
    constructor(state) { this.state = state; }
    
    rng(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    log(text, type="system") { 
        if (!this.state.log) this.state.log = [];
        this.state.log.push({ text, type }); 
        if(this.state.log.length > 40) this.state.log.shift();
    }

    getUniqueItems(pool, count) {
        let array = [...pool];
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array.slice(0, count);
    }

    // --- GENERATORS ---
    generateSectorBodies(sysName) {
        if (sysName === "Veridia Prime") return DATA.STARTER_PLANETS;
        
        const starType = DATA.STAR_TYPES[this.rng(0, DATA.STAR_TYPES.length-1)];
        let bodies = [{ name: sysName, type: starType, is_star: true, desc: "System Star." }];
        
        const count = this.rng(3, 7);
        for(let i=0; i<count; i++) {
            const pType = DATA.PLANET_TYPES[this.rng(0, DATA.PLANET_TYPES.length-1)];
            const mineable = (pType.includes("Moon") || pType.includes("Asteroid") || pType.includes("Belt"));
            let eco = "Unknown";
            if(pType.includes("Gas")) eco = "Refinery";
            else if(pType.includes("Terran")) eco = "Agrarian";
            else if(pType.includes("Volcanic")) eco = "Industrial";
            else eco = "Research";

            bodies.push({ 
                name: `${sysName} ${['I','II','III','IV','V','VI'][i]}`, 
                type: pType, economy: eco, desc: `A ${pType} world.`, mineable: mineable 
            });
        }
        return bodies;
    }

    generateMarket() {
        let items = [];
        items.push({ name: "Ionic Gel", type: "Fuel", price: 10, qty: 200, rarity: {name:"Common", color:"#3b82f6"} });
        items.push({ name: "Hyper-Crystals", type: "Fuel", price: 500, qty: 5, rarity: {name:"Rare", color:"#a855f7"} });
        
        let pool = [];
        Object.keys(DATA.COMMODITIES).forEach(k => DATA.COMMODITIES[k].forEach(i => pool.push({name:i, type:k})));
        
        const selected = this.getUniqueItems(pool, 15);
        selected.forEach(p => {
            items.push({
                name: p.name, type: p.type,
                price: this.rng(20, 500), qty: this.rng(10, 100),
                rarity: {name:"Standard", color:"#fff"}
            });
        });
        return items;
    }

    generateShipyard() {
        return this.getUniqueItems(DATA.SHIP_PARTS, 8).map(p => ({...p}));
    }

    generateLounge() {
        let lounge = { recruits: [], rumors: ["The void is quiet.", "Pirates in Sector 7."] };
        for(let i=0; i<3; i++) {
            const role = DATA.ROLES[this.rng(0, DATA.ROLES.length-1)];
            // Fallback check if name list exists
            let nameList = DATA.NAMES.Spacer;
            if(DATA.NAMES.Spacer) {
                if(role==="Scientist") nameList = DATA.NAMES.HighBorn;
                else if(role==="Marine") nameList = [...DATA.NAMES.Spacer, ...DATA.NAMES.Alien];
                else if(role==="Engineer") nameList = [...DATA.NAMES.Spacer, ...DATA.NAMES.Synthetic];
            } else {
                nameList = ["Rookie"];
            }

            const name = nameList[this.rng(0, nameList.length-1)];
            lounge.recruits.push({ name: name, role: role, cost: this.rng(100, 600), desc: "Ready for hire." });
        }
        return lounge;
    }

    generateEncounter() {
        const roll = Math.random();
        if (roll < 0.3) return { type: "Pirate", text: "Pirate Interceptor detected.", hostile: true };
        if (roll < 0.5) return { type: "Trader", text: "A merchant vessel hails you.", hostile: false };
        return { type: "Asteroid", text: "Dense debris field.", hostile: false, mineable: true };
    }

    // --- ACTIONS ---
    mineAction() {
        const roll = Math.random();
        let lootList = DATA.MINERALS.Tier1;
        if(roll > 0.95) lootList = DATA.MINERALS.Tier4;
        else if(roll > 0.85) lootList = DATA.MINERALS.Tier3;
        else if(roll > 0.60) lootList = DATA.MINERALS.Tier2;

        const ore = lootList[this.rng(0, lootList.length-1)];
        const qty = this.rng(1, 4);
        
        const existing = this.state.ship.cargo.find(c => c.name === ore);
        if(existing) existing.qty += qty;
        else this.state.ship.cargo.push({ name: ore, qty: qty, val: this.rng(20, 500), weight: 1, type: "Material" });
        
        this.log(`Mining Yield: ${qty}x ${ore}`, "system");
        this.syncShipStats();
    }

    travel(target) {
        if(this.state.ship.stats.fuel_ion >= 10) {
            this.state.ship.stats.fuel_ion -= 10;
            if (Math.random() < 0.25) {
                this.state.encounter = this.generateEncounter();
                this.state.meta.orbiting = "Deep Space";
                this.log("ALERT: Anomaly Detected.", "error");
            } else {
                this.state.meta.orbiting = target;
                this.state.meta.landed = false;
                this.log(`Orbit established: ${target}`, "system");
            }
        } else {
            this.log("Insufficient Ionic Fuel.", "error");
        }
    }

    resolveCombat() {
        const enc = this.state.encounter;
        if(!enc) return;
        if (Math.random() > 0.4) {
            const loot = this.rng(100, 800);
            this.state.player.units += loot;
            this.log(`Target Neutralized. Salvaged ${loot} U.`, "player");
        } else {
            const dmg = this.rng(5, 20);
            this.state.ship.stats.hull -= dmg;
            this.log(`Taking Fire! Hull -${dmg}%`, "error");
        }
        this.state.encounter = null;
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