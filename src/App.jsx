import React, { useState } from "react";
import { Web3Provider } from "./context/Web3Context";
import Navbar from "./components/Navbar";
import FaucetSection from "./components/FaucetSection";
import ArmoryStore from "./components/ArmoryStore";
import VaultSection from "./components/VaultSection";
import NotificationToast from "./components/NotificationToast";
import contractsConfig from "./contracts/contractsConfig.json";
import "./App.css";

function ArmoryApp() {
  const [activeTab, setActiveTab] = useState("store");

  return (
    <div className="app-layout">
      {/* Background Matrix & Cyber Gradients */}
      <div className="bg-cyber-grid"></div>
      <div className="bg-glow-orb red-orb"></div>
      <div className="bg-glow-orb cyan-orb"></div>

      {/* Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenVault={() => setActiveTab("vault")}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === "store" && (
          <ArmoryStore
            onNavigateToFaucet={() => setActiveTab("faucet")}
            onOpenVault={() => setActiveTab("vault")}
          />
        )}

        {activeTab === "faucet" && (
          <FaucetSection
            onNavigateToStore={() => setActiveTab("store")}
          />
        )}

        {activeTab === "vault" && (
          <VaultSection
            onNavigateToStore={() => setActiveTab("store")}
          />
        )}
      </main>

      {/* Global Notifications */}
      <NotificationToast />

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <span className="footer-logo">DRIPMINT // ROGUELUS TECH ARMORY</span>
            <span className="footer-copy">
              Decentralized EVM Web3 Protocol • ROG × OnePlus Alliance • Dare to Forge, Never Settle
            </span>
          </div>

          <div className="footer-right">
            <div className="contract-chips">
              <span className="chip" title="ERC-20 Utility Token">
                Roguelus Token: <code>{contractsConfig.contracts.AsusToken.address.slice(0, 6)}...{contractsConfig.contracts.AsusToken.address.slice(-4)}</code>
              </span>
              <span className="chip" title="ERC-721 Hardware NFT">
                Roguelus Gear NFT: <code>{contractsConfig.contracts.AsusTechGear.address.slice(0, 6)}...{contractsConfig.contracts.AsusTechGear.address.slice(-4)}</code>
              </span>
              <span className="chip" title="Armory Protocol">
                Armory: <code>{contractsConfig.contracts.AsusArmory.address.slice(0, 6)}...{contractsConfig.contracts.AsusArmory.address.slice(-4)}</code>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <ArmoryApp />
    </Web3Provider>
  );
}
