import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically locate workspace root
function getProjectRoot() {
  let curr = __dirname;
  while (curr && curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, "client")) && fs.existsSync(path.join(curr, "backend"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return path.resolve(__dirname, "../..");
}

// Helper to generate self-contained on-chain SVG & Base64 JSON token URI for Hardware (ASUS & OnePlus)
function generateHardwareTokenURI(item) {
  const isOnePlus = item.brand === "OnePlus";
  const brandPrimary = isOnePlus ? "#eb0029" : "#ff0033";
  const brandSecondary = isOnePlus ? "#ffffff" : "#00f3ff";
  const brandAccent = item.isOneOfOne ? "#ffd700" : (isOnePlus ? "#ff4d6d" : "#ff3366");
  const bgStop1 = isOnePlus ? "#110809" : "#0a0a0f";
  const bgStop2 = isOnePlus ? "#200e12" : "#141420";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgStop1}"/>
      <stop offset="50%" stop-color="${bgStop2}"/>
      <stop offset="100%" stop-color="#050508"/>
    </linearGradient>
    <linearGradient id="brandNeon" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${brandPrimary}"/>
      <stop offset="50%" stop-color="${brandAccent}"/>
      <stop offset="100%" stop-color="${brandPrimary}"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  
  <!-- Cyber Background Frame -->
  <rect width="500" height="500" rx="20" fill="url(#bgGrad)" stroke="${item.isOneOfOne ? "#ffd700" : brandPrimary}" stroke-width="${item.isOneOfOne ? "4" : "2"}"/>
  
  <!-- Grid Pattern -->
  <path d="M 30,50 L 470,50 M 30,450 L 470,450 M 50,30 L 50,470 M 450,30 L 450,470" stroke="${brandPrimary}" stroke-opacity="0.15" stroke-width="1" stroke-dasharray="6,6"/>
  
  <!-- Corner Accents -->
  <polygon points="30,30 60,30 30,60" fill="${brandPrimary}"/>
  <polygon points="470,30 440,30 470,60" fill="${brandSecondary}"/>
  <polygon points="30,470 60,470 30,440" fill="${brandSecondary}"/>
  <polygon points="470,470 440,470 470,440" fill="${brandPrimary}"/>
  
  ${item.isOneOfOne ? `
  <!-- 1-of-1 EXCLUSIVE BADGE -->
  <rect x="160" y="22" width="180" height="26" rx="13" fill="#ffd700" stroke="#fff" stroke-width="1" filter="url(#glow)"/>
  <text x="250" y="40" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="12" fill="#000" letter-spacing="2">
    ★ 1-OF-1 EXCLUSIVE ★
  </text>
  ` : ""}

  <!-- Center Emblem -->
  <g transform="translate(250, 150)">
    <circle r="60" fill="rgba(255, 255, 255, 0.03)" stroke="${item.isOneOfOne ? "#ffd700" : brandPrimary}" stroke-width="2"/>
    <text text-anchor="middle" y="8" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20" fill="${brandSecondary}" letter-spacing="2">
      ${isOnePlus ? "1+" : "ROG"}
    </text>
  </g>

  <!-- Hardware Silhouette & Code -->
  <g transform="translate(250, 270)">
    <text text-anchor="middle" y="5" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="28" fill="#ffffff" letter-spacing="2">
      ${item.code}
    </text>
    <text text-anchor="middle" y="32" font-family="'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="13" fill="${brandSecondary}" letter-spacing="3">
      [ ${item.tierLabel.toUpperCase()} • ${item.brand.toUpperCase()} ]
    </text>
  </g>

  <!-- Product Title & Stats -->
  <text x="250" y="390" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="20" fill="#ffffff">
    ${item.name}
  </text>
  
  <rect x="100" y="415" width="300" height="30" rx="6" fill="rgba(0, 0, 0, 0.5)" stroke="${item.isOneOfOne ? "#ffd700" : brandPrimary}" stroke-width="1"/>
  <text x="250" y="435" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="13" fill="${item.isOneOfOne ? "#ffd700" : "#fff"}" letter-spacing="1.5">
    COST: ${item.priceEth} ROGUELUS • ${item.isOneOfOne ? "1-OF-1 EDITION" : "PROTOCOL VERIFIED"}
  </text>
</svg>`;

  const svgBase64 = Buffer.from(svg).toString("base64");
  const imageUri = `data:image/svg+xml;base64,${svgBase64}`;

  const metadata = {
    name: item.name,
    description: item.description,
    image: imageUri,
    attributes: [
      { trait_type: "Brand", value: item.brand },
      { trait_type: "Hardware Tier", value: item.tierLabel },
      { trait_type: "Cost in ROGUELUS", value: `${item.priceEth} ROGUELUS` },
      { trait_type: "Model ID", value: item.code },
      { trait_type: "Overclock Profile", value: item.overclockRating },
      { trait_type: "Armory Category", value: item.category },
      { trait_type: "Edition Type", value: item.isOneOfOne ? "1-of-1 Exclusive" : "Standard Series" },
      { trait_type: "Max Supply", value: item.maxSupply === 1 ? "1" : "Unlimited" }
    ]
  };

  const jsonString = JSON.stringify(metadata);
  const jsonBase64 = Buffer.from(jsonString).toString("base64");
  return `data:application/json;base64,${jsonBase64}`;
}

export const GEAR_ITEMS_CONFIG = [
  // ==========================================
  // ASUS ROG HARDWARE ITEMS (21 Items)
  // ==========================================
  // Tier 1: Mobiles / Handhelds
  {
    name: "ROG Phone 8 Pro",
    tier: 0,
    priceEth: "150",
    code: "ROG-PH8P",
    tierLabel: "Tier 1: Mobile",
    category: "Mobile Device",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Snapdragon 8 Gen 3 3.3GHz Extreme",
    description: "Flagship gaming smartphone with AniMe Vision matrix display, Snapdragon 8 Gen 3, and 165Hz AMOLED."
  },
  {
    name: "ROG Ally X",
    tier: 0,
    priceEth: "150",
    code: "ROG-ALLY-X",
    tierLabel: "Tier 1: Handheld",
    category: "Handheld Console",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "AMD Ryzen Z1 Extreme 24GB LPDDR5X",
    description: "Windows 11 handheld console powered by AMD Z1 Extreme, 80Wh extended battery, and improved ergonomics."
  },
  {
    name: "ROG Phone 8 Pro Ultimate 1-of-1",
    tier: 0,
    priceEth: "450",
    code: "ROG-PH8P-1OF1",
    tierLabel: "Tier 1: Mobile",
    category: "Mobile Device",
    brand: "ASUS ROG",
    isOneOfOne: true,
    maxSupply: 1, // ★ 1-of-1
    overclockRating: "Custom Gold Titanium Binned Silicon",
    description: "World exclusive 1-of-1 ROG Phone 8 Pro chassis forged from gold-plated titanium with personalized signature."
  },
  // Tier 2: Monitors
  {
    name: "ROG Swift OLED XG32",
    tier: 1,
    priceEth: "250",
    code: "ROG-XG32-OLED",
    tierLabel: "Tier 2: Monitor",
    category: "OLED Display",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "4K UHD 240Hz 0.03ms GTG",
    description: "32-inch 4K QD-OLED gaming monitor with blisteringly fast 240Hz refresh rate and custom heatsink."
  },
  {
    name: "ROG Strix 5K",
    tier: 1,
    priceEth: "250",
    code: "ROG-STRIX-5K",
    tierLabel: "Tier 2: Monitor",
    category: "Ultra-Wide Display",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "5K DQHD 165Hz Curved HDR1000",
    description: "Dual QHD ultra-wide curvature with DisplayHDR 1000 and ASUS Extreme Low Motion Blur."
  },
  {
    name: "ROG Swift PG32UCDM 1-of-1 Master",
    tier: 1,
    priceEth: "600",
    code: "ROG-PG32-1OF1",
    tierLabel: "Tier 2: Monitor",
    category: "OLED Display",
    brand: "ASUS ROG",
    isOneOfOne: true,
    maxSupply: 1, // ★ 1-of-1
    overclockRating: "Factory Color Calibrated Delta E < 0.5",
    description: "Master display reference unit hand-calibrated for pro esports champions. Only 1 in existence."
  },
  // Tier 3: Laptops
  {
    name: "ROG Zephyrus G16",
    tier: 2,
    priceEth: "500",
    code: "ROG-G16-ZEPH",
    tierLabel: "Tier 3: Laptop",
    category: "Ultra-Slim Gaming Laptop",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Intel Core Ultra 9 + RTX 4090",
    description: "CNC aluminum chassis, Slash Lighting array, ROG Nebula OLED 240Hz display, and vapor chamber cooling."
  },
  {
    name: "ROG Strix SCAR 18",
    tier: 2,
    priceEth: "500",
    code: "ROG-SCAR-18",
    tierLabel: "Tier 3: Laptop",
    category: "Extreme Gaming Laptop",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Core i9 14900HX 175W TGP RTX 4090",
    description: "Unrivaled desktop-grade performance in an 18-inch Mini LED form factor with Conductonaut Extreme liquid metal."
  },
  {
    name: "ROG Zephyrus G16 Platinum 1-of-1",
    tier: 2,
    priceEth: "1200",
    code: "ROG-G16-1OF1",
    tierLabel: "Tier 3: Laptop",
    category: "Ultra-Slim Gaming Laptop",
    brand: "ASUS ROG",
    isOneOfOne: true,
    maxSupply: 1, // ★ 1-of-1
    overclockRating: "Max Overclock Unlocked BIOS 6.0GHz",
    description: "Custom engraved Platinum Edition Zephyrus G16 with unlocked power delivery firmware. Strictly 1-of-1."
  },
  // Tier 4: Components
  {
    name: "ROG Ryujin III 360",
    tier: 3,
    priceEth: "200",
    code: "ROG-RYUJIN-3",
    tierLabel: "Tier 4: Component",
    category: "AIO Liquid Cooler",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "3.5 inch Full-Color LCD Asetek 8th Gen",
    description: "Flagship all-in-one liquid CPU cooler equipped with 3.5-inch LCD screen and Noctua iPPC fans."
  },
  {
    name: "ROG Maximus Z790 HERO",
    tier: 3,
    priceEth: "350",
    code: "ROG-MAX-Z790",
    tierLabel: "Tier 4: Component",
    category: "Motherboard",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "20+1 Power Stages DDR5-7800+ PCIe 5.0",
    description: "Extreme enthusiast ATX motherboard with Polymo lighting and robust VRM power architecture."
  },
  {
    name: "ROG Hyperion GR701",
    tier: 3,
    priceEth: "400",
    code: "ROG-HYPERION",
    tierLabel: "Tier 4: Component",
    category: "Battlestation Chassis",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Dual 420mm Radiator Support",
    description: "Full-tower gaming chassis with die-cast aluminum handles and integrated ARGB controller."
  },
  {
    name: "ROG Matrix RTX 4090",
    tier: 3,
    priceEth: "750",
    code: "ROG-MATRIX-4090",
    tierLabel: "Tier 4: Component",
    category: "Graphics Card",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Liquid Metal Cooled 2700MHz Boost",
    description: "The apex of graphics power featuring liquid metal thermal compound and 360mm custom magnetic radiator."
  },
  {
    name: "ROG Matrix RTX 4090 Carbon 1-of-1",
    tier: 3,
    priceEth: "1500",
    code: "ROG-RTX4090-1OF1",
    tierLabel: "Tier 4: Component",
    category: "Graphics Card",
    brand: "ASUS ROG",
    isOneOfOne: true,
    maxSupply: 1, // ★ 1-of-1
    overclockRating: "Silicon Lottery Top 0.01% Bin 3.1GHz Unlocked",
    description: "The absolute crown jewel of the Armory. Hand-binned top 0.01% silicon encased in real aerospace carbon fiber."
  },
  // Tier 5: Peripherals
  {
    name: "ROG Cetra SpeedNova",
    tier: 4,
    priceEth: "80",
    code: "ROG-CETRA-SN",
    tierLabel: "Tier 5: Peripheral",
    category: "Gaming Earbuds",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "ROG SpeedNova 2.4GHz Ultra-Low Latency",
    description: "True wireless gaming in-ears featuring dual-mode wireless 2.4 GHz and Bluetooth with ANC."
  },
  {
    name: "ROG Harpe Ace Aim Lab",
    tier: 4,
    priceEth: "100",
    code: "ROG-HARPE-ACE",
    tierLabel: "Tier 5: Peripheral",
    category: "Ultralight Mouse",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "54g Ultralight AimPoint 36,000 DPI",
    description: "Co-developed with Aim Lab pro esports players. 54-gram featherlight gaming mouse."
  },
  {
    name: "ROG Tessen Controller",
    tier: 4,
    priceEth: "100",
    code: "ROG-TESSEN",
    tierLabel: "Tier 5: Peripheral",
    category: "Mobile Controller",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Foldable Mechanical Switches Zero Latency USB-C",
    description: "Compact foldable mobile controller turning your smartphone into an authentic console experience."
  },
  {
    name: "ROG Azoth Extreme",
    tier: 4,
    priceEth: "150",
    code: "ROG-AZOTH-EXT",
    tierLabel: "Tier 5: Peripheral",
    category: "Mechanical Keyboard",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Carbon Fiber Positioning Plate 8000Hz Polling",
    description: "Custom 75% mechanical gaming keyboard with aluminum chassis, full-color OLED touchscreen, and gasket mount."
  },
  {
    name: "ROG Delta S Animate",
    tier: 4,
    priceEth: "160",
    code: "ROG-DELTA-S",
    tierLabel: "Tier 5: Peripheral",
    category: "Gaming Headset",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "ESS 9281 Quad DAC AniMe Matrix Displays",
    description: "Hi-Res gaming headset with customizable AniMe Matrix ear-cup displays and AI Noise-Canceling mic."
  },
  {
    name: "ROG Rapture GT-BE98",
    tier: 4,
    priceEth: "220",
    code: "ROG-RAPTURE-BE98",
    tierLabel: "Tier 5: Peripheral",
    category: "WiFi 7 Router",
    brand: "ASUS ROG",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Quad-Band WiFi 7 25,000 Mbps Dual 10G Ports",
    description: "World's first quad-band WiFi 7 gaming router delivering uncompromised speed and low latency."
  },
  {
    name: "ROG Azoth Extreme Golden 1-of-1",
    tier: 4,
    priceEth: "500",
    code: "ROG-AZOTH-1OF1",
    tierLabel: "Tier 5: Peripheral",
    category: "Mechanical Keyboard",
    brand: "ASUS ROG",
    isOneOfOne: true,
    maxSupply: 1, // ★ 1-of-1
    overclockRating: "Hand-Lubed Crystal Switches 24K Gold Accent",
    description: "One-of-a-kind ROG Azoth keyboard with 24K gold inlaid chassis and individually hand-tuned switches."
  },

  // ==========================================
  // ONEPLUS HARDWARE ITEMS (20 New Items)
  // ==========================================
  // OnePlus Tier 1: Mobiles & Handhelds (Phones & Tablets)
  {
    name: "OnePlus 12 Flagship",
    tier: 0,
    priceEth: "160",
    code: "OP-12-FLAG",
    tierLabel: "Tier 1: Mobile",
    category: "Mobile Device",
    brand: "OnePlus",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Snapdragon 8 Gen 3 16GB RAM 5400mAh",
    description: "Smooth Beyond Belief. 4th Gen Hasselblad Camera, 2K 120Hz ProXDR display, and 100W SUPERVOOC charging."
  },
  {
    name: "OnePlus Open Foldable",
    tier: 0,
    priceEth: "220",
    code: "OP-OPEN-FOLD",
    tierLabel: "Tier 1: Mobile",
    category: "Foldable Smartphone",
    brand: "OnePlus",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Flexion Hinge Dual 120Hz ProXDR Displays",
    description: "Open for Everything. Featherweight foldable smartphone with Hasselblad imaging and Canvas multi-tasking."
  },
  {
    name: "OnePlus 12R Performance",
    tier: 0,
    priceEth: "120",
    code: "OP-12R-PERF",
    tierLabel: "Tier 1: Mobile",
    category: "Mobile Device",
    brand: "OnePlus",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Snapdragon 8 Gen 2 5500mAh 100W",
    description: "Performance in Overdrive. 4th-Gen LTPO 120Hz display with massive 5,500mAh battery for all-day gaming."
  },
  {
    name: "OnePlus Pad 2",
    tier: 0,
    priceEth: "140",
    code: "OP-PAD-2",
    tierLabel: "Tier 1: Handheld",
    category: "Tablet Console",
    brand: "OnePlus",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Snapdragon 8 Gen 3 3K 144Hz 7:5 Display",
    description: "Life Made Smooth. Large 3K 144Hz screen with Open Canvas split-screen productivity and Hi-Res 6-speaker audio."
  },
  {
    name: "OnePlus Pad Go",
    tier: 0,
    priceEth: "90",
    code: "OP-PAD-GO",
    tierLabel: "Tier 1: Handheld",
    category: "Tablet Console",
    brand: "OnePlus",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "2.4K 90Hz Display 8000mAh Battery",
    description: "All-day entertainment tablet with eye-care certified 2.4K screen and quad Dolby Atmos speakers."
  },
  {
    name: "OnePlus 12 Genshin Keqing 1-of-1",
    tier: 0,
    priceEth: "550",
    code: "OP-KEQING-1OF1",
    tierLabel: "Tier 1: Mobile",
    category: "Custom Smartphone",
    brand: "OnePlus",
    isOneOfOne: true,
    maxSupply: 1, // ★ 1-of-1
    overclockRating: "Electro-Violet Custom AG Glass & OS Theme",
    description: "Official 1-of-1 Collector Edition OnePlus 12 crafted with Electro-Violet AG glass and custom Lightning Stiletto case."
  },

  // OnePlus Tier 2: Displays & Smart TVs
  {
    name: "OnePlus TV Q2 Pro 65",
    tier: 1,
    priceEth: "240",
    code: "OP-TV-Q2-65",
    tierLabel: "Tier 2: Monitor",
    category: "QLED Smart Display",
    brand: "OnePlus",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "4K QLED 120Hz DLG 70W Dynaudio Bar",
    description: "65-inch 4K QLED master display with 120Hz refresh rate, Gamma Engine Ultra, and integrated Dynaudio soundbar."
  },
  {
    name: "OnePlus Monitor X 27",
    tier: 1,
    priceEth: "200",
    code: "OP-MON-X27",
    tierLabel: "Tier 2: Monitor",
    category: "Gaming Monitor",
    brand: "OnePlus",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "2K QHD 165Hz IPS Type-C 65W PD",
    description: "27-inch 2K fast IPS esports monitor with 165Hz, DisplayHDR 400, and single-cable Type-C power delivery."
  },
  {
    name: "OnePlus Monitor E 24",
    tier: 1,
    priceEth: "110",
    code: "OP-MON-E24",
    tierLabel: "Tier 2: Monitor",
    category: "Productivity Monitor",
    brand: "OnePlus",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "FHD 75Hz Ultra-Slim 4.87mm Frame",
    description: "Sleek 24-inch IPS monitor with 3-side bezel-less design and TÜV Rheinland low blue light certification."
  },
  {
    name: "OnePlus QLED Ultra 85 Studio 1-of-1",
    tier: 1,
    priceEth: "700",
    code: "OP-QLED-85-1OF1",
    tierLabel: "Tier 2: Monitor",
    category: "Studio Display",
    brand: "OnePlus",
    isOneOfOne: true,
    maxSupply: 1, // ★ 1-of-1
    overclockRating: "85-inch 4K Mini-LED 144Hz 2000 Nits",
    description: "Studio reference 85-inch Mini-LED display with motorized Dynaudio sound system. Exactly 1 copy forged."
  },

  // OnePlus Tier 3: Laptops & Creative Workstations
  {
    name: "OnePlus Book Pro 16",
    tier: 2,
    priceEth: "480",
    code: "OP-BOOK-PRO16",
    tierLabel: "Tier 3: Laptop",
    category: "Creator Laptop",
    brand: "OnePlus",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Core Ultra 9 185H 32GB RAM 3.2K 165Hz",
    description: "Premium CNC unibody ultra-laptop featuring seamless multi-screen collaboration with OnePlus devices."
  },
  {
    name: "OnePlus Book 14 Air",
    tier: 2,
    priceEth: "380",
    code: "OP-BOOK-AIR14",
    tierLabel: "Tier 3: Laptop",
    category: "Ultraportable Laptop",
    brand: "OnePlus",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Ryzen 7 8845HS 1.2kg Magnesium Chassis",
    description: "Ultra-thin and lightweight 14-inch productivity notebook delivering 18 hours of continuous battery life."
  },
  {
    name: "OnePlus Creator Studio Pro 1-of-1",
    tier: 2,
    priceEth: "1100",
    code: "OP-STUDIO-1OF1",
    tierLabel: "Tier 3: Laptop",
    category: "Creator Laptop",
    brand: "OnePlus",
    isOneOfOne: true,
    maxSupply: 1, // ★ 1-of-1
    overclockRating: "Dual OLED Touchscreens 64GB 4TB PCIe 5.0",
    description: "Concept creative workstation with dual 16-inch 4K OLED touchscreens. Numbered #001 prototype."
  },

  // OnePlus Tier 4: Components & Power Battlestation
  {
    name: "OnePlus 100W SUPERVOOC GaN Dock",
    tier: 3,
    priceEth: "150",
    code: "OP-100W-GAN",
    tierLabel: "Tier 4: Component",
    category: "Power Architecture",
    brand: "OnePlus",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Dual Type-C + USB-A GaN 100W Output",
    description: "Ultra-compact Gallium Nitride dual-port flash charger capable of powering high-demand laptops and phones."
  },
  {
    name: "OnePlus 50W AIRVOOC Magnetic Base",
    tier: 3,
    priceEth: "130",
    code: "OP-50W-AIR",
    tierLabel: "Tier 4: Component",
    category: "Power Architecture",
    brand: "OnePlus",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "50W Wireless Flash Active Liquid Fan Cooling",
    description: "High-speed wireless charging dock with integrated aerodynamic twin turbo fan for heat dissipation."
  },
  {
    name: "OnePlus 80W SUPERVOOC Car Hub",
    tier: 3,
    priceEth: "110",
    code: "OP-80W-CAR",
    tierLabel: "Tier 4: Component",
    category: "Power Architecture",
    brand: "OnePlus",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "80W Dual Port Fast Charge Surge Protection",
    description: "High-voltage vehicle power hub delivering SUPERVOOC speeds on the road without overheating."
  },
  {
    name: "OnePlus CyberGaN 240W Battlestation 1-of-1",
    tier: 3,
    priceEth: "800",
    code: "OP-240W-1OF1",
    tierLabel: "Tier 4: Component",
    category: "Power Architecture",
    brand: "OnePlus",
    isOneOfOne: true,
    maxSupply: 1, // ★ 1-of-1
    overclockRating: "240W Quad GaN Power Supply Real-Time OLED Wattmeter",
    description: "Extreme desktop power delivery console with digital real-time voltage monitoring OLED. Strictly 1-of-1."
  },

  // OnePlus Tier 5: Peripherals & Audio
  {
    name: "OnePlus Buds Pro 3",
    tier: 4,
    priceEth: "90",
    code: "OP-BUDS-P3",
    tierLabel: "Tier 5: Peripheral",
    category: "Pro Wireless Earbuds",
    brand: "OnePlus",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Dual Drivers Co-Created with Dynaudio 50dB ANC",
    description: "Audiophile-grade earbuds featuring dual DACs, LHDC 5.0 24-bit audio, and personalized Spatial Audio."
  },
  {
    name: "OnePlus Watch 2 WearOS",
    tier: 4,
    priceEth: "130",
    code: "OP-WATCH-2",
    tierLabel: "Tier 5: Peripheral",
    category: "Smart Wearable",
    brand: "OnePlus",
    isOneOfOne: false,
    maxSupply: 0,
    overclockRating: "Dual-Engine Architecture 100-Hour Battery",
    description: "Stainless steel chassis with sapphire crystal glass, Snapdragon W5 + BES2700 hybrid architecture."
  },
  {
    name: "OnePlus Keyboard 81 Pro 1-of-1",
    tier: 4,
    priceEth: "400",
    code: "OP-KB81-1OF1",
    tierLabel: "Tier 5: Peripheral",
    category: "Mechanical Keyboard",
    brand: "OnePlus",
    isOneOfOne: true,
    maxSupply: 1, // ★ 1-of-1
    overclockRating: "Marble-mallow Keycaps Gasket Mount Custom Rotary",
    description: "1-of-1 mechanical masterpiece with customized crystal rotary dial and exclusive Red Alert resonance damping."
  }
];

async function main() {
  console.log("====================================================");
  console.log(" DEPLOYING DRIPMINT: ROGUELUS PROTOCOL (ROG x ONEPLUS) ");
  console.log("====================================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with master address: ${deployer.address}`);

  // 1. DEPLOY AsusToken (ERC-20)
  console.log("\n--> Step 1: Deploying Roguelus Token (ERC-20)...");
  const INITIAL_SUPPLY = hre.ethers.parseEther("1000000"); // 1,000,000 ROGUELUS tokens
  const AsusTokenFactory = await hre.ethers.getContractFactory("AsusToken");
  const asusToken = await AsusTokenFactory.deploy(deployer.address, INITIAL_SUPPLY);
  await asusToken.waitForDeployment();
  const tokenAddress = await asusToken.getAddress();
  console.log(`✅ Roguelus Token deployed to: ${tokenAddress}`);

  // 2. DEPLOY AsusTechGear (ERC-721 NFT)
  console.log("\n--> Step 2: Deploying Roguelus Gear (ERC-721)...");
  const AsusTechGearFactory = await hre.ethers.getContractFactory("AsusTechGear");
  const techGear = await AsusTechGearFactory.deploy(deployer.address);
  await techGear.waitForDeployment();
  const gearAddress = await techGear.getAddress();
  console.log(`✅ Roguelus Gear deployed to: ${gearAddress}`);

  // 3. DEPLOY AsusArmory (Protocol Manager)
  console.log("\n--> Step 3: Deploying Roguelus Armory Protocol Contract...");
  const AsusArmoryFactory = await hre.ethers.getContractFactory("AsusArmory");
  const armory = await AsusArmoryFactory.deploy(deployer.address, tokenAddress, gearAddress);
  await armory.waitForDeployment();
  const armoryAddress = await armory.getAddress();
  console.log(`✅ Roguelus Armory deployed to: ${armoryAddress}`);

  // Grant AsusArmory contract minter role on AsusTechGear
  const setMinterTx = await techGear.setMinter(armoryAddress, true);
  await setMinterTx.wait();
  console.log(`✅ Minter role successfully granted to Roguelus Armory (${armoryAddress})`);

  // 4. PRE-FUND AsusArmory WITH INITIAL TOKENS FOR FAUCET
  console.log("\n--> Step 4: Pre-funding Roguelus Armory faucet pool...");
  const FAUCET_FUND = hre.ethers.parseEther("200000"); // 200,000 ROGUELUS
  const fundTx = await asusToken.transfer(armoryAddress, FAUCET_FUND);
  await fundTx.wait();
  console.log(`✅ Roguelus Armory faucet pool pre-funded with ${hre.ethers.formatEther(FAUCET_FUND)} ROGUELUS tokens`);

  // Seed Catalog Hardware Items (Total 41 items: 21 ROG + 20 OnePlus)
  console.log(`\n--> Populating Combined Hardware Catalog (${GEAR_ITEMS_CONFIG.length} items)...`);
  for (let i = 0; i < GEAR_ITEMS_CONFIG.length; i++) {
    const item = GEAR_ITEMS_CONFIG[i];
    const uri = generateHardwareTokenURI(item);
    const priceWei = hre.ethers.parseEther(item.priceEth);

    const tx = await armory.addGearItem(item.name, item.tier, priceWei, uri, item.maxSupply);
    await tx.wait();
    console.log(`+ Added Item [${i}]: ${item.name} (${item.brand}) -> Price: ${item.priceEth} ROGUELUS [${item.isOneOfOne ? "1-OF-1" : "Standard"}]`);
  }

  // Export Deployed Configuration to Frontend
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  const tokenArtifact = await hre.artifacts.readArtifact("AsusToken");
  const techGearArtifact = await hre.artifacts.readArtifact("AsusTechGear");
  const armoryArtifact = await hre.artifacts.readArtifact("AsusArmory");

  const contractsConfig = {
    chainId: chainId,
    chainName: chainId === 31337 ? "Hardhat Local EVM" : network.name,
    contracts: {
      AsusToken: {
        address: tokenAddress,
        abi: tokenArtifact.abi
      },
      AsusTechGear: {
        address: gearAddress,
        abi: techGearArtifact.abi
      },
      AsusArmory: {
        address: armoryAddress,
        abi: armoryArtifact.abi
      }
    },
    catalogConfig: GEAR_ITEMS_CONFIG.map((item, idx) => ({
      id: idx,
      name: item.name,
      tier: item.tier,
      tierLabel: item.tierLabel,
      price: item.priceEth,
      code: item.code,
      brand: item.brand,
      isOneOfOne: item.isOneOfOne,
      maxSupply: item.maxSupply,
      category: item.category,
      overclockRating: item.overclockRating,
      description: item.description
    }))
  };

  const projectRoot = getProjectRoot();
  const clientContractsDir = path.join(projectRoot, "client/src/contracts");
  if (!fs.existsSync(clientContractsDir)) {
    fs.mkdirSync(clientContractsDir, { recursive: true });
  }

  const clientConfigFile = path.join(clientContractsDir, "contractsConfig.json");
  fs.writeFileSync(clientConfigFile, JSON.stringify(contractsConfig, null, 2));
  console.log(`\nExported frontend config to: ${clientConfigFile}`);

  const backendConfigFile = path.join(projectRoot, "backend/deployedAddresses.json");
  fs.writeFileSync(backendConfigFile, JSON.stringify(contractsConfig, null, 2));
  console.log(`Exported backend config to: ${backendConfigFile}`);

  console.log("\n====================================================");
  console.log(" DRIPMINT ROGUELUS TECH ARMORY PROTOCOL INITIALIZED & READY TO FORGE ");
  console.log("====================================================");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
