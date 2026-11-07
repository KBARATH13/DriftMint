import React from "react";
import { useWeb3 } from "../context/Web3Context";
import "./Navbar.css";

export default function Navbar({ activeTab, setActiveTab, onOpenVault }) {
  const {
    account,
    chainId,
    isConnecting,
    userEthBalance,
    userAsusBalance,
    userNftCount,
    connectWallet,
    disconnectWallet,
    switchToHardhatNetwork,
    addTokenToMetaMask,
  } = useWeb3();

  const isHardhat = chainId === 31337 || chainId === 1337;

  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <div className="rog-logo-group">
          {/* Dual Brand Emblem: ROG Eye + OnePlus Badge */}
          <div className="dual-logo-badge">
            <svg className="rog-eye-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 10 20 Q 55 5 90 40 Q 65 65 30 75 Q 45 55 40 45 Q 35 35 20 40 Z"
                fill="url(#navRogRed)"
              />
              <path
                d="M 50 60 Q 70 55 85 45 Q 75 70 50 85 Q 55 75 50 60 Z"
                fill="#00f3ff"
              />
              <defs>
                <linearGradient id="navRogRed" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff0033" />
                  <stop offset="100%" stopColor="#ff0077" />
                </linearGradient>
              </defs>
            </svg>
            <span className="logo-cross">×</span>
            <div className="oneplus-mini-badge" title="OnePlus Verified">
              <span className="oneplus-num">1</span>
              <span className="oneplus-plus">+</span>
            </div>
          </div>
          <div className="brand-text">
            <div className="brand-title">
              <span className="brand-drip">DRIP</span>
              <span className="brand-mint">MINT</span>
            </div>
            <div className="brand-subtitle">ROGUELUS TECH ARMORY</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === "store" ? "active" : ""}`}
            onClick={() => setActiveTab("store")}
          >
            <span className="tab-icon">⚔️</span>
            ARMORY STORE
          </button>
          <button
            className={`nav-tab-btn ${activeTab === "faucet" ? "active" : ""}`}
            onClick={() => setActiveTab("faucet")}
          >
            <span className="tab-icon">⚡</span>
            FAUCET
          </button>
          <button
            className={`nav-tab-btn ${activeTab === "vault" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("vault");
              if (onOpenVault) onOpenVault();
            }}
          >
            <span className="tab-icon">🛡️</span>
            INVENTORY
            {userNftCount > 0 && <span className="vault-badge">{userNftCount}</span>}
          </button>
        </nav>
      </div>

      <div className="navbar-right">
        {account ? (
          <>
            {/* Network indicator */}
            <div className="network-pill-group">
              {isHardhat ? (
                <div className="network-pill connected">
                  <span className="pulse-dot"></span>
                  <span className="network-label">Localhost 31337</span>
                </div>
              ) : (
                <button className="network-pill warning" onClick={switchToHardhatNetwork}>
                  ⚠️ Switch to Hardhat EVM
                </button>
              )}
            </div>

            {/* Token Balance Pill */}
            <div className="balance-pill" title="Click to add ROGUELUS to MetaMask" onClick={addTokenToMetaMask}>
              <span className="token-symbol">ROGUELUS</span>
              <span className="token-value">{parseFloat(userAsusBalance).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
              <span className="add-token-icon" title="Add to wallet">+</span>
            </div>

            {/* ETH Balance */}
            <div className="eth-pill">
              <span className="eth-symbol">Ξ</span>
              <span className="eth-value">{userEthBalance}</span>
            </div>

            {/* Account dropdown button */}
            <div className="account-pill" onClick={disconnectWallet} title="Click to Disconnect">
              <span className="account-dot"></span>
              <span className="account-address">
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </span>
              <span className="disconnect-hover-text">Disconnect</span>
            </div>
          </>
        ) : (
          <button
            className="connect-wallet-btn rog-glow-btn"
            onClick={connectWallet}
            disabled={isConnecting}
          >
            <span className="btn-glitch-effect"></span>
            {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
          </button>
        )}
      </div>
    </header>
  );
}

