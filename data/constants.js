module.exports = {
    // --- ECONOMY ---
    COMMODITIES: {
        Food: ["Nutri-Paste Tubes", "Zero-G Wheat", "Solar-Dried Kelp", "Synth-Meat Bricks", "Void-Crab Legs", "Moon-Dust Spices", "Nebula Nectar", "Cryo-Berries", "Insectoid Larvae", "Aged Earth Whiskey"],
        Tech: ["Fusion Cells", "Holoprojectors", "Nano-Weave Cloth", "Positronic Brains", "Grav-Plating", "Atmosphere Scrubbers", "Cybernetic Limbs", "FTL Drive Coils", "Shield Harmonics Chips", "Universal Translators"],
        Agri: ["Fertilizer Slurry", "Gene-Seed Vials", "Alien Timber", "Medicinal Moss", "Terraforming Bacteria", "Mega-Beast Leather", "Bioluminescent Algae", "Water Ice", "Spore Pods", "Livestock Embryos"],
        Cultural: ["Precursor Artifacts", "Religious Totems", "Data-Slates of Philosophy", "Sonic Sculptures", "Memory Crystals", "Battlefield Debris", "Xeno-Music Holotapes", "Ceremonial Robes", "Fossilized Eggs", "Planetary Soil Jars"],
        Minerals: ["Titanium Ore", "Liquid Hydrogen", "Dark Matter Traces", "Uncut Gemstones", "Radioactive Waste"],
        Contraband: ["Stim-Packs", "Stolen ID Chips", "Sentient Pets", "Hacked Weapon Firmware", "Black Market Organs"],
        Medical: ["Stasis Pods", "Pan-Cure Serums", "Experimental Isotopes", "Mind-Clouders", "Clone Vats"]
    },

    // --- SHIP PARTS ---
    SHIP_PARTS: [
        { name: "Pulse Laser", type: "Weapon", tag: "LAS", price: 500, weight: 2, desc: "Rapid-fire energy." },
        { name: "Beam Emitter", type: "Weapon", tag: "LAS", price: 1200, weight: 3, desc: "Continuous beam." },
        { name: "Plasma Cannon", type: "Weapon", tag: "PLA", price: 1800, weight: 5, desc: "Heavy bolts." },
        { name: "Autocannon", type: "Weapon", tag: "KIN", price: 900, weight: 4, desc: "Kinetic shredder." },
        { name: "Railgun", type: "Weapon", tag: "KIN", price: 2500, weight: 6, desc: "Long range slug." },
        { name: "Flak Battery", type: "Weapon", tag: "FLK", price: 800, weight: 4, desc: "Anti-missile." },
        { name: "Seeker Missiles", type: "Weapon", tag: "MSL", price: 1500, weight: 3, desc: "Heat seeking." },
        { name: "Torpedo Launcher", type: "Weapon", tag: "MSL", price: 3000, weight: 6, desc: "Heavy ordnance." },
        { name: "Ion Drive", type: "System", tag: "ENG", price: 800, weight: 3, desc: "Efficient engine." },
        { name: "Fusion Torch", type: "System", tag: "ENG", price: 2500, weight: 6, desc: "Military thrust." },
        { name: "Warp Core", type: "System", tag: "WRP", price: 5000, weight: 8, desc: "FTL Travel." },
        { name: "Solar Sails", type: "System", tag: "ENG", price: 400, weight: 1, desc: "Zero fuel." },
        { name: "Standard Fuel Tank", type: "System", tag: "TNK", price: 200, weight: 5, desc: "Basic capacity." },
        { name: "Extended Reserve", type: "System", tag: "TNK", price: 800, weight: 10, desc: "Long range." },
        { name: "Fuel Scoop", type: "System", tag: "UTL", price: 1500, weight: 2, desc: "Skim stars." },
        { name: "ECM Suite", type: "System", tag: "EWAR", price: 1200, weight: 2, desc: "Jammer." },
        { name: "Cloaking Field", type: "System", tag: "STL", price: 8000, weight: 5, desc: "Invisibility." },
        { name: "Deflector Shield", type: "System", tag: "SHD", price: 1000, weight: 3, desc: "Energy barrier." },
        { name: "Repair Nanites", type: "System", tag: "REP", price: 5000, weight: 1, desc: "Auto-repair." }
    ],

    // --- NAMES ---
    NAMES: {
        Spacer: ["Jace Rorke", "Kaelen Vance", "Mara Soveko", "Dutch Halloway", "Ryla Thorne", "Cade Garris", "Hana Ivers", "Jaxom Pyle", "Zane O’Malley", "Tove Jansen", "Brea Gallows", "Silas Vane", "Korbin Dallas", "Mags O’Reilly", "Flint Taggart"],
        HighBorn: ["Aveline Kross", "Aris Thorne", "Julian Vesper", "Lysandra Void", "Sebastian Hale", "Orion Pax", "Cassia Valerius", "Lucius Modine", "Vera Montrose", "Arthur Penhaligon"],
        Synthetic: ["Unit 734", "Echo-5", "Proxy", "A.R.I.A.", "Bishop-X", "Null", "Glitch", "Switchboard", "Mainframe", "K-250"],
        Alien: ["Xal’atath", "Thrax", "Volo’v", "Q'Ra", "Garrus", "Liara", "Zorg", "Kly’rak", "Nebula", "Oort", "Solas", "Vex", "Zyra", "Draxus", "Nyx"]
    },
    ROLES: ["Pilot", "Engineer", "Marine", "Medic", "Scientist"],

    // --- MINING ---
    MINERALS: {
        Tier1: ["Water Ice", "Iron Ore", "Carbon Silicates", "Copper Deposits"],
        Tier2: ["Titanium", "Cobalt", "Lithium", "Tungsten"],
        Tier3: ["Platinum", "Gold", "Palladium", "Void Opals"],
        Tier4: ["Neutronium", "Dark Matter", "Elerium-115", "Starheart"]
    },
    ORES: ["Iron Ore", "Titanium", "Gold", "Platinum", "Dark Matter"],
    RARES: ["Void Opal", "Alien Fossil", "Precursor Chip", "Starheart"],

    // --- ASTRO ---
    STAR_TYPES: ["O-Type Blue", "G-Type Yellow", "M-Type Red", "Neutron Star", "Red Giant", "White Dwarf", "Black Hole"],
    PLANET_TYPES: ["Gas Giant", "Ice World", "Volcanic", "Desert", "Terran", "Oceanic", "Asteroid Belt", "Moon", "Toxic", "Hot Jupiter", "Super-Earth"],

    // --- STARTER ---
    STARTER_PLANETS: [
        { name: "Veridia Prime", type: "Terran", economy: "Agrarian", desc: "Sector capital.", x: 0, y: 0 },
        { name: "The Anvil", type: "Volcanic", economy: "Industrial", desc: "Smog world.", x: 200, y: -150 },
        { name: "Echo IV", type: "Gas Giant", economy: "Mining", desc: "Gas giant.", x: -180, y: 100 },
        { name: "Frostbite", type: "Ice World", economy: "Research", desc: "Frozen moon.", x: 50, y: 200 }
    ]
};