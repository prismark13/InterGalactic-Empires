// data/constants.js

module.exports = {
    // --- ECONOMY ---
    COMMODITIES: {
        Food: ["Nutri-Paste", "Syn-Meat", "Algae Bars", "Luxury Wine", "Void-Crab Legs", "Moon-Dust Spices"],
        Tech: ["Fusion Cells", "Holoprojectors", "Nano-Weave", "Positronic Brains", "Grav-Plating"],
        Agri: ["Fertilizer", "Gene-Seeds", "Alien Timber", "Medicinal Moss", "Terraforming Bacteria"],
        Minerals: ["Titanium Ore", "Liquid Hydrogen", "Dark Matter", "Uncut Gemstones", "Radioactive Waste"],
        Medical: ["Stasis Pods", "Pan-Cure Serums", "Isotopes", "Mind-Clouders", "Clone Vats"]
    },
    
    SHIP_PARTS: [
        { name: "Mining Laser", type: "Weapon", tag: "LAS", price: 200, weight: 2 },
        { name: "Pulse Laser", type: "Weapon", tag: "LAS", price: 500, weight: 2 },
        { name: "Railgun", type: "Weapon", tag: "KIN", price: 1500, weight: 5 },
        { name: "Plasma Torpedo", type: "Weapon", tag: "MSL", price: 2500, weight: 4 },
        { name: "Shield Gen Mk1", type: "System", tag: "SHD", price: 1000, weight: 3 },
        { name: "Nav-Computer", type: "System", tag: "NAV", price: 800, weight: 1 },
        { name: "Hyperdrive", type: "System", tag: "WRP", price: 5000, weight: 8 },
        { name: "Scanner Array", type: "System", tag: "SCN", price: 1200, weight: 2 },
        { name: "Cargo Expander", type: "System", tag: "CGO", price: 500, weight: 2 },
        { name: "Standard Fuel Tank", type: "System", tag: "TNK", price: 300, weight: 5 }
    ],

    // --- ENCOUNTER REWARDS ---
    LOOT_TABLE: [
        { name: "Scrap Metal", val: 10, weight: 1, type: "Material" },
        { name: "Ship Parts", val: 150, weight: 2, type: "Tech" },
        { name: "Fuel Canister", val: 50, weight: 1, type: "Fuel" },
        { name: "Cipher Key", val: 500, weight: 0.1, type: "Artifact" },
        { name: "Rare Ore", val: 300, weight: 2, type: "Mineral" }
    ],

    // --- MINING TIERS ---
    MINERALS: {
        Tier1: ["Water Ice", "Iron Ore", "Carbon Silicates", "Copper Deposits"],
        Tier2: ["Titanium", "Cobalt", "Lithium", "Tungsten"],
        Tier3: ["Platinum", "Gold", "Palladium", "Void Opals"],
        Tier4: ["Neutronium", "Dark Matter", "Elerium-115", "Starheart"]
    },

    // --- ASTROPHYSICS ---
    STAR_TYPES: ["O-Type Blue", "G-Type Yellow", "M-Type Red", "Neutron Star", "Red Giant", "White Dwarf"],
    PLANET_TYPES: [
        "Gas Giant", "Ice Giant", "Hot Jupiter", "Silicate Planet", "Iron Planet", "Carbon Planet", 
        "Super-Earth", "Desert Planet", "Ocean Planet", "Ice Planet", "Lava Planet", 
        "Asteroid Belt", "Moon"
    ],
    
    // --- FLAVOR ---
    NAMES: ["Jork", "Tali", "Garrus", "Liara", "Wrex", "Mordin", "Thane"],
    ROLES: ["Pilot", "Engineer", "Marine", "Medic", "Scientist"],

    // --- STARTER ---
    STARTER_PLANETS: [
        { name: "Veridia Prime", type: "Terran", economy: "Agrarian", desc: "Sector capital.", x: 0, y: 0 },
        { name: "The Anvil", type: "Volcanic", economy: "Industrial", desc: "Smog world.", x: 200, y: -150 },
        { name: "Echo IV", type: "Gas Giant", economy: "Mining", desc: "Gas giant.", x: -180, y: 100 },
        { name: "Frostbite", type: "Ice World", economy: "Research", desc: "Frozen moon.", x: 50, y: 200 }
    ]
};