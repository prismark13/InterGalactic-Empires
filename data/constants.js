// data/constants.js - Standard V9.3 Content
module.exports = {
    // ... (Paste content from Patch V9.3 File 1 here)
    // Or keep your existing file if it has the full list.
    // Ensure NAMES is an object: { Spacer: [], ... }
    COMMODITIES: {
        Food: ["Nutri-Paste Tubes", "Zero-G Wheat", "Solar-Dried Kelp", "Synth-Meat Bricks", "Void-Crab Legs", "Moon-Dust Spices", "Nebula Nectar", "Cryo-Berries", "Insectoid Larvae", "Aged Earth Whiskey"],
        Tech: ["Fusion Cells", "Holoprojectors", "Nano-Weave Cloth", "Positronic Brains", "Grav-Plating", "Atmosphere Scrubbers", "Cybernetic Limbs", "FTL Drive Coils", "Shield Harmonics Chips", "Universal Translators"],
        Components: ["Gravity Coil", "Plasma Manifold", "Injector Valve", "Warp Core Casing", "Ion Thruster Nozzle", "Fusion Catalyst", "Inertial Dampener", "Heat Sink", "Magnetic Bottle", "Slipstream Gear", "Exhaust Vent", "Hydrogen Scoop", "Positronic Matrix", "Optical Chip", "Subspace Transceiver", "Quantum Bit", "Sensor Array Dish", "Targeting Logic Board", "Holographic Projector", "Encrypted Hard Drive", "Power Coupling", "Biometric Scanner", "Universal Translator Unit", "AI Core", "Tritanium Plate", "Viewport Glass", "Airlock Seal", "Hydraulic Piston", "Bulkhead Door", "Thermal Tile", "Docking Clamp", "Safety Railing", "Cargo Netting", "Life Support Scrubber", "Grav-Deck Plating", "Emergency Beacon", "Focusing Lens", "Magnetic Rail", "Plasma Cartridge", "Missile Guidance Fin", "Coolant Hose", "Particle Accelerator", "Firing Pin", "Energy Cell", "Shield Emitter", "Torque Flywheel", "Recoil Damper", "Warhead Trigger", "Living Gel-Circuit", "Void Compass"],
        Agri: ["Fertilizer Slurry", "Gene-Seed Vials", "Alien Timber", "Medicinal Moss", "Terraforming Bacteria", "Mega-Beast Leather", "Bioluminescent Algae", "Water Ice", "Spore Pods", "Livestock Embryos"],
        Cultural: ["Precursor Artifacts", "Religious Totems", "Data-Slates of Philosophy", "Sonic Sculptures", "Memory Crystals", "Battlefield Debris", "Xeno-Music Holotapes", "Ceremonial Robes", "Fossilized Eggs", "Planetary Soil Jars"],
        Minerals: ["Titanium Ore", "Liquid Hydrogen", "Dark Matter Traces", "Uncut Gemstones", "Radioactive Waste"],
        Contraband: ["Stim-Packs", "Stolen ID Chips", "Sentient Pets", "Hacked Weapon Firmware", "Black Market Organs"],
        Medical: ["Stasis Pods", "Pan-Cure Serums", "Experimental Isotopes", "Mind-Clouders", "Clone Vats"]
    },
    SHIP_PARTS: [
        { name: "Pulse Laser Turret", type: "Weapon", tag: "LAS", price: 500, weight: 2, desc: "Rapid-fire energy weapon." },
        { name: "Beam Emitter", type: "Weapon", tag: "LAS", price: 1200, weight: 3, desc: "Continuous stream." },
        { name: "Plasma Cannon", type: "Weapon", tag: "PLA", price: 1800, weight: 5, desc: "Heavy gas bolts." },
        { name: "Autocannon", type: "Weapon", tag: "KIN", price: 900, weight: 4, desc: "Shreds armor." },
        { name: "Railgun", type: "Weapon", tag: "KIN", price: 2500, weight: 6, desc: "Magnetic sniper." },
        { name: "Flak Battery", type: "Weapon", tag: "FLK", price: 800, weight: 4, desc: "Area denial." },
        { name: "Seeker Missile Rack", type: "Weapon", tag: "MSL", price: 1500, weight: 3, desc: "Heat seeking." },
        { name: "Torpedo Launcher", type: "Weapon", tag: "MSL", price: 3000, weight: 6, desc: "Capital ship killer." },
        { name: "Mine Layer", type: "Weapon", tag: "EXP", price: 1000, weight: 4, desc: "Rear defense." },
        { name: "Tractor Beam", type: "Weapon", tag: "UTL", price: 800, weight: 3, desc: "Hold enemy ships." },
        { name: "Ion Drive", type: "System", tag: "ENG", price: 800, weight: 3, desc: "High efficiency." },
        { name: "Fusion Torch", type: "System", tag: "ENG", price: 2500, weight: 6, desc: "Military thrust." },
        { name: "Warp Core", type: "System", tag: "WRP", price: 5000, weight: 8, desc: "FTL Travel." },
        { name: "Solar Sails", type: "System", tag: "ENG", price: 400, weight: 1, desc: "Zero fuel usage." },
        { name: "Standard Fuel Tank", type: "System", tag: "TNK", price: 200, weight: 5, desc: "Basic capacity." },
        { name: "Extended Reserve", type: "System", tag: "TNK", price: 800, weight: 10, desc: "Massive capacity." },
        { name: "Fuel Scoop", type: "System", tag: "UTL", price: 1500, weight: 2, desc: "Skim stars." },
        { name: "ECM Suite", type: "System", tag: "EWAR", price: 1200, weight: 2, desc: "Sensor jamming." },
        { name: "Cloaking Field", type: "System", tag: "STL", price: 8000, weight: 5, desc: "Invisibility." },
        { name: "Deflector Shield", type: "System", tag: "SHD", price: 1000, weight: 3, desc: "Energy bubble." },
        { name: "Repair Nanites", type: "System", tag: "REP", price: 5000, weight: 1, desc: "Auto-fix hull." }
    ],
    NAMES: {
        Spacer: ["Jace 'Spanner' Rorke", "Kaelen Vance", "Mara Soveko", "Dutch Halloway", "Ryla Thorne", "Cade Garris", "Hana 'Doc' Ivers", "Jaxom Pyle", "Zane O’Malley", "Tove Jansen", "Brea Gallows", "Silas Vane", "Korbin Dallas", "Mags O’Reilly", "Flint Taggart"],
        HighBorn: ["Director Aveline Kross", "Dr. Aris Thorne", "Julian Vesper", "Lysandra Void", "Sebastian Hale", "Orion Pax", "Cassia Valerius", "Lucius Modine", "Vera Montrose", "Arthur Penhaligon"],
        Synthetic: ["Unit 734 (Seven)", "Echo-5", "Proxy", "A.R.I.A.", "Bishop-X", "Null", "Glitch", "Switchboard", "Mainframe", "K-250 (Kay)"],
        Alien: ["Xal’atath", "Thrax the Destroyer", "Volo’v", "Q'Ra", "Garrus Vak", "Liara T’Soni", "Zorg", "Kly’rak", "Nebula", "Oort", "Solas", "Vex", "Zyra", "Draxus", "Nyx"]
    },
    ROLES: ["Pilot", "Engineer", "Marine", "Medic", "Scientist"],
    MINERALS: {
        Tier1: ["Water Ice", "Iron Ore", "Carbon Silicates", "Copper Deposits", "Aluminum Nodules", "Sulphur", "Ferrite Dust", "Regolith", "Lead", "Biomass Sludge"],
        Tier2: ["Titanium", "Cobalt", "Lithium", "Tungsten", "Neodymium", "Quartz Crystals", "Uranium Ore", "Graphene Sheets", "Poly-Textiles", "Obsidian"],
        Tier3: ["Platinum", "Gold", "Palladium", "Iridium", "Osmium", "Industrial Diamonds", "Helium-3", "Jadeite", "Void Opals", "Ancient Bones"],
        Tier4: ["Neutronium", "Dark Matter", "Elerium-115", "Living Crystal", "Zero-Point Condensate", "Chronal Shards", "Psionic Dust", "Antimatter", "Liquid Metal", "Starheart"]
    },
    ORES: ["Iron Ore", "Titanium", "Gold", "Platinum", "Dark Matter", "Cobalt", "Silver", "Uranium"],
    RARES: ["Void Opal", "Alien Fossil", "Precursor Chip", "Starheart"],
    STAR_TYPES: ["O-Type Blue Giant", "B-Type Blue-White", "A-Type White Star", "F-Type Yellow-White", "G-Type Yellow Dwarf", "K-Type Orange Dwarf", "M-Type Red Dwarf", "T-Tauri Star", "Red Giant", "Red Supergiant", "Blue Supergiant", "Yellow Hypergiant", "Wolf-Rayet Star", "Carbon Star", "S-Type Star", "L-Type Brown Dwarf", "T-Type Brown Dwarf", "Y-Type Brown Dwarf", "White Dwarf (DA)", "White Dwarf (DB)", "Neutron Star", "Pulsar", "Magnetar", "Stellar Black Hole", "Thorn-Zytkow Object"],
    PLANET_TYPES: ["Gas Giant", "Ice Giant", "Hot Jupiter", "Hot Neptune", "Puffy Planet", "Super-Puff", "Helium Planet", "Eccentric Jupiter", "Chthonian Planet", "Gas Dwarf", "Silicate Planet", "Iron Planet", "Carbon Planet", "Super-Earth", "Mega-Earth", "Protoplanet", "Coreless Planet", "Desert Planet", "Ocean Planet", "Ice Planet", "Lava Planet", "Hycean Planet", "Eyeball Planet", "Soot Planet", "Steam World", "Ammonia World", "Rogue Planet", "Circumbinary Planet", "Trojan Planet", "Double Planet", "Asteroid Belt", "Moon"],
    STARTER_PLANETS: [
        { name: "Veridia Prime", type: "Terran", economy: "Agrarian", desc: "Sector capital.", x: 0, y: 0 },
        { name: "The Anvil", type: "Volcanic", economy: "Industrial", desc: "Smog world.", x: 200, y: -150 },
        { name: "Echo IV", type: "Gas Giant", economy: "Mining", desc: "Gas giant.", x: -180, y: 100 },
        { name: "Frostbite", type: "Ice World", economy: "Research", desc: "Frozen moon.", x: 50, y: 200 }
    ]
};