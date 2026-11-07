import React from "react";

export default function HardwareArt({ itemId, code }) {
  // Category-based / Item-specific SVGs
  switch (itemId) {
    // 0: ROG Phone 8 Pro
    case 0:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="phoneBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1e28" />
              <stop offset="100%" stopColor="#0c0d12" />
            </linearGradient>
          </defs>
          <rect x="70" y="20" width="100" height="200" rx="16" fill="url(#phoneBody)" stroke="#ff0033" strokeWidth="2.5" />
          <rect x="76" y="32" width="88" height="176" rx="10" fill="#050508" stroke="#333" strokeWidth="1" />
          <g fill="#00f3ff" opacity="0.8">
            <circle cx="105" cy="110" r="2" /><circle cx="115" cy="110" r="2" /><circle cx="125" cy="110" r="2" /><circle cx="135" cy="110" r="2" />
            <circle cx="110" cy="120" r="2" /><circle cx="120" cy="120" r="2" /><circle cx="130" cy="120" r="2" />
          </g>
          <rect x="80" y="38" width="38" height="42" rx="6" fill="#161720" stroke="#ff0033" strokeWidth="1" />
          <circle cx="92" cy="50" r="6" fill="#0a0a0f" stroke="#00f3ff" strokeWidth="1.5" />
          <circle cx="106" cy="65" r="5" fill="#0a0a0f" stroke="#ff0033" strokeWidth="1" />
          <text x="120" y="185" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900">165Hz AMOLED</text>
        </svg>
      );

    // 1: ROG Ally X
    case 1:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 25 70 C 15 85 10 130 18 160 C 25 180 50 175 65 170 L 175 170 C 190 175 215 180 222 160 C 230 130 225 85 215 70 C 205 60 180 65 160 65 L 80 65 C 60 65 35 60 25 70 Z"
            fill="#12131a"
            stroke="#00f3ff"
            strokeWidth="2.5"
          />
          <rect x="75" y="75" width="90" height="75" rx="6" fill="#07080d" stroke="#ff0033" strokeWidth="1.5" />
          <text x="120" y="115" textAnchor="middle" fill="#00f3ff" fontSize="12" fontWeight="900">RYZEN Z1X</text>
          <circle cx="48" cy="98" r="14" fill="#111" stroke="#00f3ff" strokeWidth="2" />
          <circle cx="192" cy="135" r="14" fill="#111" stroke="#ff0033" strokeWidth="2" />
        </svg>
      );

    // 2: ROG Swift OLED XG32
    case 2:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <rect x="25" y="35" width="190" height="115" rx="4" fill="#0e0f17" stroke="#7a00ff" strokeWidth="2" />
          <rect x="30" y="40" width="180" height="105" fill="#050508" />
          <text x="120" y="100" textAnchor="middle" fill="#00f3ff" fontSize="11" fontWeight="900">4K 240Hz OLED</text>
          <path d="M 120 185 L 70 215 M 120 185 L 170 215 M 120 185 L 120 220" stroke="#ff0033" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    // 3: ROG Strix 5K
    case 3:
    case 15: // ROG Swift OLED PG49WCD (Super Ultrawide)
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <path d="M 15 50 Q 120 68 225 50 L 225 130 Q 120 148 15 130 Z" fill="#090a12" stroke="#00f3ff" strokeWidth="2.5" />
          <text x="120" y="98" textAnchor="middle" fill="#ff0033" fontSize="12" fontWeight="900">ULTRA-WIDE CURVED</text>
          <text x="120" y="112" textAnchor="middle" fill="#fff" fontSize="9">32:9 OLED • 1000R</text>
          <path d="M 80 215 L 120 190 L 160 215" stroke="#00f3ff" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    // 4: ROG Zephyrus G16
    // 17: ROG Zephyrus G14
    case 4:
    case 17:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <polygon points="45,40 195,40 185,130 55,130" fill="#1b1c26" stroke="#ffd700" strokeWidth="1.5" />
          <polygon points="52,46 188,46 180,124 60,124" fill="#07080e" />
          <text x="120" y="90" textAnchor="middle" fill="#ffd700" fontSize="11" fontWeight="900">ZEPHYRUS OLED</text>
          <polygon points="20,165 220,165 185,130 55,130" fill="#181822" stroke="#444" strokeWidth="1" />
          <line x1="50" y1="42" x2="190" y2="42" stroke="#ff0033" strokeWidth="2" />
        </svg>
      );

    // 5: ROG Strix SCAR 18
    // 18: ROG Flow X16
    case 5:
    case 18:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <polygon points="35,30 205,30 195,135 45,135" fill="#201018" stroke="#ff0033" strokeWidth="2.5" />
          <polygon points="42,37 198,37 190,128 50,128" fill="#060205" />
          <text x="120" y="85" textAnchor="middle" fill="#ff0033" fontSize="12" fontWeight="900">STRIX POWERHOUSE</text>
          <text x="120" y="105" textAnchor="middle" fill="#00f3ff" fontSize="9">RTX 4090 • 240Hz MINI-LED</text>
          <polygon points="12,175 228,175 195,135 45,135" fill="#1c161a" stroke="#ff0033" strokeWidth="1.5" />
          <line x1="12" y1="175" x2="228" y2="175" stroke="#ff0055" strokeWidth="4" />
        </svg>
      );

    // 6: ROG Cetra SpeedNova (Earbuds)
    case 6:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          {/* Earbuds Charging Case & Pods */}
          <rect x="55" y="80" width="130" height="90" rx="28" fill="#151722" stroke="#00f3ff" strokeWidth="2.5" />
          <line x1="55" y1="115" x2="185" y2="115" stroke="#ff0033" strokeWidth="1.5" />
          <circle cx="120" cy="140" r="14" fill="#0a0a0f" stroke="#00f3ff" strokeWidth="1" />
          <path d="M 115 135 L 125 140 L 115 145 Z" fill="#ff0033" />
          {/* Earbud stems */}
          <rect x="75" y="45" width="16" height="40" rx="8" fill="#252735" stroke="#00f3ff" strokeWidth="1.5" />
          <rect x="149" y="45" width="16" height="40" rx="8" fill="#252735" stroke="#00f3ff" strokeWidth="1.5" />
          <text x="120" y="200" textAnchor="middle" fill="#00f3ff" fontSize="11" fontWeight="900">2.4GHz LOW-LATENCY</text>
        </svg>
      );

    // 7: ROG Harpe Ace Aim Lab (Ultralight Mouse)
    case 7:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 85 45 C 95 30 145 30 155 45 C 168 65 170 140 160 185 C 150 215 90 215 80 185 C 70 140 72 65 85 45 Z"
            fill="#12131c"
            stroke="#00f3ff"
            strokeWidth="2.5"
          />
          <line x1="120" y1="40" x2="120" y2="95" stroke="#ff0033" strokeWidth="2" />
          <rect x="114" y="55" width="12" height="24" rx="4" fill="#00f3ff" />
          {/* Aim Lab emblem */}
          <polygon points="120,140 135,160 105,160" fill="#00f3ff" opacity="0.8" />
          <text x="120" y="185" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900">54g ULTRALIGHT</text>
        </svg>
      );

    // 8: ROG Tessen Mobile Controller
    case 8:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <rect x="30" y="70" width="65" height="100" rx="14" fill="#151722" stroke="#ff0033" strokeWidth="2" />
          <rect x="145" y="70" width="65" height="100" rx="14" fill="#151722" stroke="#00f3ff" strokeWidth="2" />
          <line x1="95" y1="120" x2="145" y2="120" stroke="#ffd700" strokeWidth="3" strokeDasharray="4,4" />
          <circle cx="62" cy="100" r="10" fill="#090a0f" stroke="#ff0033" strokeWidth="1.5" />
          <circle cx="178" cy="140" r="10" fill="#090a0f" stroke="#00f3ff" strokeWidth="1.5" />
          <text x="120" y="200" textAnchor="middle" fill="#ffd700" fontSize="11" fontWeight="900">FOLDABLE USB-C</text>
        </svg>
      );

    // 9: ROG Azoth Extreme (Keyboard)
    case 9:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <rect x="25" y="75" width="190" height="90" rx="8" fill="#151722" stroke="#00f3ff" strokeWidth="2.5" />
          {/* OLED Display on keyboard */}
          <rect x="165" y="85" width="40" height="18" rx="3" fill="#050508" stroke="#ff0033" strokeWidth="1" />
          <circle cx="175" cy="94" r="3" fill="#00f3ff" />
          {/* Key matrix */}
          <g fill="#242738">
            <rect x="35" y="90" width="12" height="10" rx="2" />
            <rect x="52" y="90" width="12" height="10" rx="2" />
            <rect x="69" y="90" width="12" height="10" rx="2" />
            <rect x="86" y="90" width="12" height="10" rx="2" />
            <rect x="103" y="90" width="12" height="10" rx="2" />
            <rect x="120" y="90" width="12" height="10" rx="2" />
            <rect x="137" y="90" width="12" height="10" rx="2" />
            {/* Row 2 */}
            <rect x="35" y="105" width="14" height="10" rx="2" fill="#ff0033" />
            <rect x="54" y="105" width="12" height="10" rx="2" />
            <rect x="71" y="105" width="12" height="10" rx="2" />
            <rect x="88" y="105" width="12" height="10" rx="2" />
            <rect x="105" y="105" width="12" height="10" rx="2" />
            <rect x="122" y="105" width="12" height="10" rx="2" />
            {/* Spacebar */}
            <rect x="70" y="135" width="65" height="12" rx="3" fill="#00f3ff" />
          </g>
          <text x="120" y="195" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900">8000Hz • OLED TOUCH</text>
        </svg>
      );

    // 10: ROG Delta S Animate (Headset)
    case 10:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <path d="M 60 120 C 60 50 180 50 180 120" fill="none" stroke="#252735" strokeWidth="8" strokeLinecap="round" />
          {/* Earcups */}
          <polygon points="40,110 75,100 70,165 35,155" fill="#151722" stroke="#ff0033" strokeWidth="2" />
          <polygon points="200,110 165,100 170,165 205,155" fill="#151722" stroke="#00f3ff" strokeWidth="2" />
          {/* Matrix lights */}
          <circle cx="55" cy="130" r="2" fill="#ff0033" /><circle cx="55" cy="140" r="2" fill="#ff0033" />
          <circle cx="185" cy="130" r="2" fill="#00f3ff" /><circle cx="185" cy="140" r="2" fill="#00f3ff" />
          <text x="120" y="195" textAnchor="middle" fill="#00f3ff" fontSize="11" fontWeight="900">ESS 9281 QUAD DAC</text>
        </svg>
      );

    // 11: ROG Ryujin III 360 (AIO Liquid Cooler)
    case 11:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <circle cx="120" cy="110" r="48" fill="#12131d" stroke="#ff0033" strokeWidth="3" />
          <rect x="95" y="85" width="50" height="50" rx="8" fill="#050508" stroke="#00f3ff" strokeWidth="1.5" />
          <text x="120" y="114" textAnchor="middle" fill="#00f3ff" fontSize="11" fontWeight="900">3.5" LCD</text>
          {/* Radiator tubes */}
          <path d="M 80 110 C 50 110 40 180 90 180" fill="none" stroke="#2a2d3d" strokeWidth="6" />
          <path d="M 160 110 C 190 110 200 180 150 180" fill="none" stroke="#2a2d3d" strokeWidth="6" />
          <text x="120" y="210" textAnchor="middle" fill="#ff0033" fontSize="10" fontWeight="900">ASETEK GEN8 PUMP</text>
        </svg>
      );

    // 12: ROG Rapture GT-BE98 Pro (WiFi 7 Router)
    case 12:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <polygon points="60,110 180,110 160,170 80,170" fill="#151722" stroke="#ff0033" strokeWidth="2.5" />
          {/* 8 Spider Antennas */}
          <line x1="60" y1="110" x2="30" y2="60" stroke="#00f3ff" strokeWidth="3.5" />
          <line x1="85" y1="110" x2="70" y2="40" stroke="#00f3ff" strokeWidth="3.5" />
          <line x1="155" y1="110" x2="170" y2="40" stroke="#00f3ff" strokeWidth="3.5" />
          <line x1="180" y1="110" x2="210" y2="60" stroke="#00f3ff" strokeWidth="3.5" />
          <circle cx="120" cy="140" r="14" fill="#0a0a0f" stroke="#ff0033" strokeWidth="1.5" />
          <text x="120" y="200" textAnchor="middle" fill="#00f3ff" fontSize="11" fontWeight="900">WIFI 7 • DUAL 10G</text>
        </svg>
      );

    // 13: ROG Swift Pro PG248QP (540Hz)
    case 13:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <rect x="35" y="45" width="170" height="105" rx="3" fill="#0b0c13" stroke="#00f3ff" strokeWidth="2" />
          <text x="120" y="105" textAnchor="middle" fill="#00f3ff" fontSize="18" fontWeight="900">540Hz</text>
          <text x="120" y="125" textAnchor="middle" fill="#ffd700" fontSize="9" fontWeight="700">ULMB 2 • G-SYNC</text>
          <path d="M 120 150 L 120 185 M 90 205 L 120 185 L 150 205" stroke="#ff0033" strokeWidth="3" />
        </svg>
      );

    // 14: ROG Maximus Z790 HERO (Motherboard)
    case 14:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <rect x="40" y="30" width="160" height="180" rx="8" fill="#12131d" stroke="#ffd700" strokeWidth="2.5" />
          {/* CPU Socket */}
          <rect x="95" y="60" width="50" height="50" fill="#202230" stroke="#ff0033" strokeWidth="1" />
          {/* Polymo Mirror */}
          <rect x="50" y="45" width="35" height="70" fill="#00f3ff" opacity="0.3" stroke="#00f3ff" strokeWidth="1" />
          {/* PCIe slots */}
          <line x1="55" y1="140" x2="185" y2="140" stroke="#ffd700" strokeWidth="3" />
          <line x1="55" y1="165" x2="185" y2="165" stroke="#444" strokeWidth="2" />
          <text x="120" y="195" textAnchor="middle" fill="#ffd700" fontSize="10" fontWeight="900">MAXIMUS HERO Z790</text>
        </svg>
      );

    // 16: ROG Flow Z13 Acronym (Tablet PC)
    case 16:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <rect x="45" y="40" width="150" height="140" rx="10" fill="#151722" stroke="#00f3ff" strokeWidth="2.5" />
          <rect x="52" y="47" width="136" height="126" rx="6" fill="#07080e" />
          <text x="120" y="105" textAnchor="middle" fill="#ff0033" fontSize="13" fontWeight="900">FLOW Z13</text>
          <text x="120" y="125" textAnchor="middle" fill="#00f3ff" fontSize="9">CORE i9 • RTX 4070</text>
          <text x="120" y="205" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700">ACRONYM CHASSIS</text>
        </svg>
      );

    // 19: ROG Hyperion GR701 (Chassis)
    case 19:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <polygon points="65,30 175,30 185,200 55,200" fill="#12131d" stroke="#ff0033" strokeWidth="3" />
          {/* Die-cast X-frame handles */}
          <line x1="45" y1="20" x2="85" y2="20" stroke="#00f3ff" strokeWidth="5" strokeLinecap="round" />
          <line x1="155" y1="20" x2="195" y2="20" stroke="#00f3ff" strokeWidth="5" strokeLinecap="round" />
          {/* Glass window */}
          <polygon points="75,50 165,50 172,180 68,180" fill="#00f3ff" opacity="0.15" stroke="#ff0033" strokeWidth="1" />
          <text x="120" y="125" textAnchor="middle" fill="#ffd700" fontSize="12" fontWeight="900">HYPERION GR701</text>
        </svg>
      );

    // 20: ROG Azoth Extreme Golden 1-of-1
    case 20:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <rect x="25" y="70" width="190" height="100" rx="8" fill="#12131a" stroke="#ffd700" strokeWidth="3" />
          <rect x="35" y="80" width="170" height="80" rx="4" fill="#07080c" />
          <circle cx="185" cy="95" r="8" fill="#ffd700" stroke="#fff" strokeWidth="1" />
          <text x="120" y="125" textAnchor="middle" fill="#ffd700" fontSize="11" fontWeight="900">AZOTH GOLDEN 1-OF-1</text>
          <text x="120" y="145" textAnchor="middle" fill="#00f3ff" fontSize="9">24K INLAID CHASSIS</text>
        </svg>
      );

    // OnePlus Items (21 - 40)
    // 21: OnePlus 12 Flagship / 22: OnePlus Open / 26: Keqing 1-of-1
    case 21:
    case 22:
    case 23:
    case 26:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="opPhoneBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1c1114" />
              <stop offset="100%" stopColor="#080304" />
            </linearGradient>
          </defs>
          <rect x="70" y="20" width="100" height="200" rx="18" fill="url(#opPhoneBody)" stroke={itemId === 26 ? "#ffd700" : "#eb0029"} strokeWidth={itemId === 26 ? "3" : "2"} />
          <rect x="76" y="28" width="88" height="184" rx="12" fill="#050203" />
          {/* Circular Hasselblad Camera Island */}
          <circle cx="120" cy="75" r="28" fill="#150a0d" stroke={itemId === 26 ? "#ffd700" : "#eb0029"} strokeWidth="1.5" />
          <circle cx="110" cy="68" r="7" fill="#000" stroke="#fff" strokeWidth="1" />
          <circle cx="130" cy="68" r="7" fill="#000" stroke="#fff" strokeWidth="1" />
          <circle cx="120" cy="85" r="8" fill="#000" stroke={itemId === 26 ? "#ffd700" : "#eb0029"} strokeWidth="1" />
          <text x="120" y="150" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900">{code}</text>
          <text x="120" y="170" textAnchor="middle" fill="#eb0029" fontSize="8" fontWeight="800">HASSELBLAD 4TH GEN</text>
          {itemId === 26 && (
            <text x="120" y="195" textAnchor="middle" fill="#ffd700" fontSize="8" fontWeight="900">★ 1-OF-1 KEQING ★</text>
          )}
        </svg>
      );

    // 24, 25: OnePlus Pad 2 / Pad Go
    case 24:
    case 25:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <rect x="40" y="45" width="160" height="150" rx="14" fill="#120c0e" stroke="#eb0029" strokeWidth="2.5" />
          <rect x="48" y="53" width="144" height="134" rx="8" fill="#080304" />
          <circle cx="120" cy="63" r="5" fill="#1e1014" stroke="#eb0029" strokeWidth="1" />
          <text x="120" y="125" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">{code}</text>
          <text x="120" y="145" textAnchor="middle" fill="#eb0029" fontSize="9">3K 144Hz 7:5 PROXDR</text>
        </svg>
      );

    // 27, 28, 29, 30: Displays / TVs
    case 27:
    case 28:
    case 29:
    case 30:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <rect x="25" y="40" width="190" height="120" rx="4" fill="#0e0709" stroke={itemId === 30 ? "#ffd700" : "#eb0029"} strokeWidth={itemId === 30 ? "3" : "2"} />
          <rect x="30" y="45" width="180" height="110" rx="2" fill="#040203" />
          {/* Dynaudio bar / stand */}
          <rect x="45" y="145" width="150" height="10" rx="2" fill="#eb0029" opacity="0.8" />
          <polygon points="120,160 100,200 140,200" fill="#221115" stroke="#eb0029" strokeWidth="1" />
          <line x1="85" y1="200" x2="155" y2="200" stroke="#eb0029" strokeWidth="3" />
          <text x="120" y="100" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900">{code}</text>
          <text x="120" y="120" textAnchor="middle" fill={itemId === 30 ? "#ffd700" : "#eb0029"} fontSize="8">
            {itemId === 30 ? "★ 85-INCH MINI-LED 1-OF-1 ★" : "4K QLED DYNAUDIO"}
          </text>
        </svg>
      );

    // 31, 32, 33: Laptops (OnePlus Book Pro / Studio 1-of-1)
    case 31:
    case 32:
    case 33:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <polygon points="45,40 195,40 185,145 55,145" fill="#140b0e" stroke={itemId === 33 ? "#ffd700" : "#eb0029"} strokeWidth={itemId === 33 ? "3" : "2"} />
          <polygon points="50,45 190,45 181,140 59,140" fill="#050203" />
          {/* Base Keyboard */}
          <polygon points="30,150 210,150 225,185 15,185" fill="#1f1115" stroke={itemId === 33 ? "#ffd700" : "#eb0029"} strokeWidth="1.5" />
          <rect x="95" y="165" width="50" height="15" rx="3" fill="#0d0507" />
          <text x="120" y="95" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900">{code}</text>
          <text x="120" y="115" textAnchor="middle" fill={itemId === 33 ? "#ffd700" : "#eb0029"} fontSize="8">
            {itemId === 33 ? "★ DUAL OLED WORKSTATION 1-OF-1 ★" : "CORE ULTRA 9 • CNC CHASSIS"}
          </text>
        </svg>
      );

    // 34, 35, 36, 37: Power / Battlestation Docks
    case 34:
    case 35:
    case 36:
    case 37:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <rect x="50" y="60" width="140" height="120" rx="16" fill="#150a0d" stroke={itemId === 37 ? "#ffd700" : "#eb0029"} strokeWidth={itemId === 37 ? "3" : "2"} />
          <circle cx="120" cy="110" r="30" fill="#070204" stroke={itemId === 37 ? "#ffd700" : "#eb0029"} strokeWidth="2" strokeDasharray="6,3" />
          <text x="120" y="115" textAnchor="middle" fill={itemId === 37 ? "#ffd700" : "#eb0029"} fontSize="12" fontWeight="900">
            {itemId === 37 ? "240W" : "SUPERVOOC"}
          </text>
          <text x="120" y="155" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="800">{code}</text>
          {itemId === 37 && (
            <text x="120" y="205" textAnchor="middle" fill="#ffd700" fontSize="9" fontWeight="900">★ CYBERGAN 1-OF-1 BATTLESTATION ★</text>
          )}
        </svg>
      );

    // 38, 39, 40: Peripherals (Buds Pro 3, Watch 2, Keyboard 81 Pro 1-of-1)
    case 38:
    case 39:
    case 40:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <rect x="35" y="75" width="170" height="90" rx="10" fill="#160c0f" stroke={itemId === 40 ? "#ffd700" : "#eb0029"} strokeWidth={itemId === 40 ? "3" : "2"} />
          <circle cx="75" cy="120" r="22" fill="#070304" stroke={itemId === 40 ? "#ffd700" : "#eb0029"} strokeWidth="2" />
          <circle cx="165" cy="120" r="22" fill="#070304" stroke={itemId === 40 ? "#ffd700" : "#eb0029"} strokeWidth="2" />
          <text x="120" y="125" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900">{code}</text>
          <text x="120" y="195" textAnchor="middle" fill={itemId === 40 ? "#ffd700" : "#eb0029"} fontSize="9">
            {itemId === 40 ? "★ MARBLE KEYCAPS 1-OF-1 ★" : "DYNAUDIO / WEAROS"}
          </text>
        </svg>
      );

    // Default Fallback
    default:
      return (
        <svg viewBox="0 0 240 240" className="device-svg" xmlns="http://www.w3.org/2000/svg">
          <rect x="30" y="70" width="180" height="90" rx="10" fill="#151722" stroke="#ff0033" strokeWidth="2" />
          <text x="120" y="120" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900">{code || "HARDWARE"}</text>
          <text x="120" y="140" textAnchor="middle" fill="#00f3ff" fontSize="9">PROTOCOL AUTHENTICATED</text>
        </svg>
      );
  }
}
