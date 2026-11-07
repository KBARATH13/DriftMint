import React, { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import contractsConfig from "../contracts/contractsConfig.json";
import "./FaucetSection.css";

export default function FaucetSection({ onNavigateToStore }) {
  const {
    account,
    asusToken,
    armory,
    canClaimFaucet,
    faucetCooldownSeconds,
    faucetAmount,
    armoryPoolBalance,
    connectWallet,
    refreshUserData,
    showToast,
    addTokenToMetaMask,
  } = useWeb3();

  const [isClaiming, setIsClaiming] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Buy Tokens State
  const [ethToSpend, setEthToSpend] = useState("0.1");
  const [isBuying, setIsBuying] = useState(false);

  // Transfer Tokens State
  const [recipientAddress, setRecipientAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Format seconds into HH:MM:SS
  const formatTime = (totalSeconds) => {
    if (totalSeconds <= 0) return "00:00:00";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}h ${minutes
      .toString()
      .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  };

  const handleClaim = async () => {
    if (!account) {
      connectWallet();
      return;
    }

    try {
      setIsClaiming(true);
      showToast("Initiating Faucet Claim: requesting 50 ROGUELUS tokens...", "info");

      const tx = await armory.claimFaucet();
      showToast("Transaction submitted to EVM mempool. Awaiting block confirmation...", "info", tx.hash);

      const receipt = await tx.wait();
      showToast("50 ROGUELUS tokens claimed successfully! Ready to forge hardware.", "success", receipt.hash);
      await refreshUserData();
    } catch (err) {
      console.error("Faucet claim error:", err);
      let errorMsg = err.reason || err.data?.message || err.message;
      if (errorMsg.includes("Faucet cooldown active")) {
        errorMsg = "24-Hour Cooldown is active. Please wait until timer finishes.";
      } else if (errorMsg.includes("Faucet pool is empty")) {
        errorMsg = "Faucet reserves are depleted. Contact protocol master.";
      }
      showToast(`Claim failed: ${errorMsg}`, "error");
    } finally {
      setIsClaiming(false);
    }
  };

  // Buy Roguelus Tokens with Test ETH
  const handleBuyTokens = async (e) => {
    e.preventDefault();
    if (!account) {
      connectWallet();
      return;
    }
    if (!ethToSpend || parseFloat(ethToSpend) <= 0) {
      showToast("Please enter a valid ETH amount", "error");
      return;
    }

    try {
      setIsBuying(true);
      const tokensWillGet = parseFloat(ethToSpend) * 1000;
      showToast(`Initiating purchase: ${ethToSpend} ETH for ~${tokensWillGet} ROGUELUS tokens...`, "info");

      const tx = await armory.buyTokens({
        value: ethers.parseEther(ethToSpend.toString()),
      });
      showToast("Purchase submitted. Awaiting block confirmation...", "info", tx.hash);

      const receipt = await tx.wait();
      showToast(`Successfully purchased ${tokensWillGet} ROGUELUS tokens!`, "success", receipt.hash);
      await refreshUserData();
    } catch (err) {
      console.error("Buy tokens error:", err);
      showToast(`Purchase failed: ${err.reason || err.message}`, "error");
    } finally {
      setIsBuying(false);
    }
  };

  // Transfer Roguelus Tokens directly to another address
  const handleTransferTokens = async (e) => {
    e.preventDefault();
    if (!account) {
      connectWallet();
      return;
    }
    if (!recipientAddress || !ethers.isAddress(recipientAddress)) {
      showToast("Please enter a valid 0x recipient Ethereum address", "error");
      return;
    }
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      showToast("Please enter a valid amount of ROGUELUS to send", "error");
      return;
    }

    try {
      setIsTransferring(true);
      showToast(`Sending ${transferAmount} ROGUELUS to ${recipientAddress.slice(0, 6)}...`, "info");

      const amountWei = ethers.parseEther(transferAmount.toString());
      const tx = await asusToken.transfer(recipientAddress, amountWei);
      showToast("Transfer submitted. Awaiting confirmation...", "info", tx.hash);

      const receipt = await tx.wait();
      showToast(`Successfully sent ${transferAmount} ROGUELUS!`, "success", receipt.hash);
      setTransferAmount("");
      setRecipientAddress("");
      await refreshUserData();
    } catch (err) {
      console.error("Transfer error:", err);
      showToast(`Transfer failed: ${err.reason || err.message}`, "error");
    } finally {
      setIsTransferring(false);
    }
  };

  const copyTokenAddress = () => {
    navigator.clipboard.writeText(contractsConfig.contracts.AsusToken.address);
    setCopiedToken(true);
    showToast("Roguelus Token Contract Address copied to clipboard!", "success");
    setTimeout(() => setCopiedToken(false), 2500);
  };

  return (
    <section className="faucet-container">
      {/* Background Cyber Grid Graphic */}
      <div className="faucet-glow-bg"></div>

      <div className="faucet-card">
        {/* Header Badge */}
        <div className="faucet-badge-header">
          <span className="live-reactor-pulse"></span>
          <span className="badge-text">ROGUELUS PROTOCOL POWER CORE // ON-CHAIN FAUCET</span>
        </div>

        <h1 className="faucet-headline">
          CLAIM 50 FREE <span className="highlight-text">ROGUELUS TOKENS</span>
        </h1>
        <p className="faucet-description">
          Equip your wallet with official Roguelus utility tokens to forge and mint authenticated
          ASUS ROG &amp; OnePlus hardware NFTs. Recharges every 24 hours per wallet address.
        </p>

        {/* Reactor Core Visual */}
        <div className="reactor-core-visual">
          <div className="core-outer-ring">
            <div className="core-inner-disk">
              <span className="core-amount">50</span>
              <span className="core-unit">ROGUELUS</span>
            </div>
          </div>
          <div className="core-particles"></div>
        </div>

        {/* Status / Cooldown Box */}
        <div className="faucet-status-card">
          <div className="status-metric">
            <span className="metric-label">Daily Allocation</span>
            <span className="metric-val">{faucetAmount} ROGUELUS</span>
          </div>
          <div className="status-metric">
            <span className="metric-label">Cooldown Interval</span>
            <span className="metric-val">24 Hours</span>
          </div>
          <div className="status-metric">
            <span className="metric-label">Armory Reserve Pool</span>
            <span className="metric-val highlight-green">
              {parseFloat(armoryPoolBalance).toLocaleString(undefined, { maximumFractionDigits: 0 })} ROGUELUS
            </span>
          </div>
        </div>

        {/* Action Button & Cooldown Timer */}
        <div className="faucet-actions">
          {!account ? (
            <button className="claim-faucet-btn rog-glow-btn" onClick={connectWallet}>
              ⚡ CONNECT WALLET TO CLAIM
            </button>
          ) : canClaimFaucet ? (
            <button
              className="claim-faucet-btn rog-glow-btn"
              onClick={handleClaim}
              disabled={isClaiming}
            >
              <span className="btn-glitch-effect"></span>
              {isClaiming ? "⚡ TRANSMITTING TO EVM..." : "⚡ CLAIM 50 ROGUELUS TOKENS NOW"}
            </button>
          ) : (
            <div className="cooldown-active-box">
              <div className="cooldown-timer-header">
                <span className="lock-icon">🔒</span>
                <span>COOLDOWN ACTIVE</span>
              </div>
              <div className="cooldown-timer-display">
                {faucetCooldownSeconds === null ? "Loading…" : formatTime(faucetCooldownSeconds)}
              </div>
              <p className="cooldown-note">
                Your wallet has claimed today. Next 50 ROGUELUS allocation unlocks when timer reaches zero.
              </p>
            </div>
          )}

          {/* Quick links & metadata */}
          <div className="faucet-footer-meta">
            <button className="meta-btn" onClick={copyTokenAddress}>
              {copiedToken ? "✓ COPIED ADDRESS" : "📋 COPY ROGUELUS TOKEN ADDRESS"}
            </button>
            <button className="meta-btn" onClick={addTokenToMetaMask}>
              🦊 ADD ROGUELUS TO METAMASK
            </button>
            {onNavigateToStore && (
              <button className="meta-btn store-link-btn" onClick={onNavigateToStore}>
                ⚔️ VISIT HARDWARE ARMORY &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Technical protocol breakdown */}
        <div className="faucet-specs-accordion">
          <div className="spec-row">
            <span className="spec-name">Token Contract (ERC-20):</span>
            <span className="spec-code">{contractsConfig.contracts.AsusToken.address}</span>
          </div>
          <div className="spec-row">
            <span className="spec-name">Armory Protocol (Spender):</span>
            <span className="spec-code">{contractsConfig.contracts.AsusArmory.address}</span>
          </div>
          <div className="spec-row">
            <span className="spec-name">Anti-Sybil Defense:</span>
            <span className="spec-val">Strict block.timestamp 86400s per EOA enforcement</span>
          </div>
        </div>

        {/* ========================================================
            UTILITY PANEL: 1. BUY TOKENS WITH ETH  |  2. SEND TOKENS
            ======================================================== */}
        <div className="faucet-utilities-grid">
          {/* Card 1: Instant Token Buy / DEX Swap */}
          <div className="utility-card buy-card">
            <div className="utility-header">
              <span className="utility-badge">INSTANT SWAP</span>
              <h3>BUY ROGUELUS TOKENS</h3>
            </div>
            <p className="utility-desc">
              Exchange your test ETH for Roguelus utility tokens instantly at <strong>1 ETH = 1,000 ROGUELUS</strong>.
            </p>
            <form onSubmit={handleBuyTokens} className="utility-form">
              <div className="input-group">
                <label>ETH Amount to Spend:</label>
                <div className="input-with-addon">
                  <input
                    type="number"
                    step="0.01"
                    min="0.001"
                    value={ethToSpend}
                    onChange={(e) => setEthToSpend(e.target.value)}
                    placeholder="0.1"
                    disabled={isBuying}
                  />
                  <span className="addon-text">ETH</span>
                </div>
              </div>
              <div className="conversion-preview">
                You will receive: <strong>{parseFloat(ethToSpend || 0) * 1000} ROGUELUS</strong>
              </div>
              <button
                type="submit"
                className="utility-btn buy-btn"
                disabled={isBuying || !account}
              >
                {isBuying ? "SWAPPING ON-CHAIN..." : "⚡ BUY ROGUELUS TOKENS"}
              </button>
            </form>
          </div>

          {/* Card 2: Transfer Tokens Direct */}
          <div className="utility-card transfer-card">
            <div className="utility-header">
              <span className="utility-badge transfer-badge">P2P TRANSFER</span>
              <h3>SEND ROGUELUS TOKENS</h3>
            </div>
            <p className="utility-desc">
              Transfer Roguelus tokens directly to any Ethereum address or your other MetaMask accounts.
            </p>
            <form onSubmit={handleTransferTokens} className="utility-form">
              <div className="input-group">
                <label>Recipient Address:</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                  disabled={isTransferring}
                />
              </div>
              <div className="input-group">
                <label>Amount of ROGUELUS:</label>
                <div className="input-with-addon">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="50"
                    disabled={isTransferring}
                  />
                  <span className="addon-text">ROGUELUS</span>
                </div>
              </div>
              <button
                type="submit"
                className="utility-btn transfer-btn"
                disabled={isTransferring || !account}
              >
                {isTransferring ? "SENDING TOKENS..." : "📤 SEND ROGUELUS TOKENS"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
