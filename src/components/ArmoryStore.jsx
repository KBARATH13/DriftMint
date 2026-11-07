import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import HardwareArt from "./HardwareArt";
import contractsConfig from "../contracts/contractsConfig.json";
import "./ArmoryStore.css";

export default function ArmoryStore({ onNavigateToFaucet, onOpenVault }) {
  const {
    account,
    asusToken,
    armory,
    userAsusBalance,
    catalogItems,
    connectWallet,
    refreshUserData,
    showToast,
  } = useWeb3();

  const [selectedTier, setSelectedTier] = useState("all"); // "all" | "mobiles" | "monitors" | "laptops" | "components" | "peripherals"
  const [selectedBrand, setSelectedBrand] = useState("all"); // "all" | "asus" | "oneplus"
  const [selectedEdition, setSelectedEdition] = useState("all"); // "all" | "1of1" | "standard"
  const [allowance, setAllowance] = useState(0n);
  const [actionLoadingId, setActionLoadingId] = useState(null); // itemId currently in tx
  const [actionStep, setActionStep] = useState(""); // "approving" | "minting"
  const [forgedNftData, setForgedNftData] = useState(null);

  const armoryAddress = contractsConfig.contracts.AsusArmory.address;

  // Check current allowance for connected account
  const checkAllowance = async () => {
    if (!account || !asusToken) return;
    try {
      const allowed = await asusToken.allowance(account, armoryAddress);
      setAllowance(allowed);
    } catch (err) {
      console.warn("Could not read token allowance:", err);
    }
  };

  useEffect(() => {
    checkAllowance();
  }, [account, asusToken]);

  // Filter items by tier, brand, and edition
  const filteredItems = catalogItems.filter((item) => {
    // Brand filter
    if (selectedBrand === "asus" && item.brand !== "ASUS ROG") return false;
    if (selectedBrand === "oneplus" && item.brand !== "OnePlus") return false;

    // Edition filter
    if (selectedEdition === "1of1" && !item.isOneOfOne) return false;
    if (selectedEdition === "standard" && item.isOneOfOne) return false;

    // Tier filter
    if (selectedTier === "all") return true;
    if (selectedTier === "mobiles") return item.tier === 0;
    if (selectedTier === "monitors") return item.tier === 1;
    if (selectedTier === "laptops") return item.tier === 2;
    if (selectedTier === "components") return item.tier === 3;
    if (selectedTier === "peripherals") return item.tier === 4;
    return true;
  });

  // Approve ERC-20
  const handleApprove = async (item) => {
    if (!account) {
      connectWallet();
      return;
    }
    const priceWei = ethers.parseEther(item.price.toString());

    try {
      setActionLoadingId(item.id);
      setActionStep("approving");
      showToast(`Step 1/2: Approving ${item.price} ROGUELUS tokens to RoguelusArmory...`, "info");

      const tx = await asusToken.approve(armoryAddress, priceWei);
      showToast("Approval transaction submitted. Waiting for EVM confirmation...", "info", tx.hash);

      await tx.wait();
      await checkAllowance();
      showToast(`Approval confirmed! You can now forge ${item.name}.`, "success");
    } catch (err) {
      console.error("Approve error:", err);
      showToast(`Approval failed: ${err.reason || err.message}`, "error");
    } finally {
      setActionLoadingId(null);
      setActionStep("");
    }
  };

  // Spend-to-Mint NFT
  const handleMint = async (item) => {
    if (!account) {
      connectWallet();
      return;
    }

    const priceWei = ethers.parseEther(item.price.toString());
    const userBalanceWei = ethers.parseEther(userAsusBalance.toString());

    if (userBalanceWei < priceWei) {
      showToast(`Insufficient ROGUELUS balance! You have ${userAsusBalance} ROGUELUS, but need ${item.price} ROGUELUS.`, "error");
      return;
    }

    try {
      setActionLoadingId(item.id);

      // Step 1: Check if approval is needed first
      const currentAllowance = await asusToken.allowance(account, armoryAddress);
      if (currentAllowance < priceWei) {
        setActionStep("approving");
        showToast(`Step 1/2: Requesting approval to burn ${item.price} ROGUELUS tokens...`, "info");
        const approveTx = await asusToken.approve(armoryAddress, priceWei);
        await approveTx.wait();
        setAllowance(priceWei);
      }

      // Step 2: Mint Gear NFT
      setActionStep("minting");
      showToast(`Step 2/2: Burning ${item.price} ROGUELUS tokens & forging ${item.name} NFT...`, "info");

      const mintTx = await armory.mintGear(item.id);
      showToast("Minting transaction submitted to EVM. Forging hardware...", "info", mintTx.hash);

      const receipt = await mintTx.wait();

      // Extract Token ID from event logs
      let mintedTokenId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = armory.interface.parseLog(log);
          if (parsed && parsed.name === "GearMinted") {
            mintedTokenId = Number(parsed.args.tokenId);
            break;
          }
        } catch {
          // not this event
        }
      }

      showToast(`SUCCESS! ${item.name} NFT #${mintedTokenId || ""} forged and transferred to your wallet!`, "success", receipt.hash);

      setForgedNftData({
        item,
        tokenId: mintedTokenId,
        txHash: receipt.hash,
      });

      await checkAllowance();
      await refreshUserData();
    } catch (err) {
      console.error("Spend-to-Mint error:", err);
      showToast(`Forge failed: ${err.reason || err.message}`, "error");
    } finally {
      setActionLoadingId(null);
      setActionStep("");
    }
  };

  return (
    <section className="store-container">
      {/* Store Banner */}
      <div className="store-banner">
        <div className="banner-badge">
          <span className="live-reactor-pulse"></span>
          <span>SPEND-TO-MINT PROTOCOL // ROGUELUS HARDWARE FORGE ({catalogItems.length} ITEMS)</span>
        </div>
        <h1 className="store-title">
          ROGUELUS <span className="highlight-text">ARMORY</span>
        </h1>
        <p className="store-tagline">
          Burn Roguelus utility tokens on-chain to forge authenticated ASUS ROG &amp; OnePlus hardware NFTs.
          Featuring serialized production runs and <strong>rare 1-of-1 exclusive master editions</strong>!
        </p>

        {/* Brand & Edition Quick Filter Pills */}
        <div className="brand-edition-filter-bar">
          <div className="filter-group">
            <span className="filter-group-label">BRAND:</span>
            <button
              className={`brand-pill ${selectedBrand === "all" ? "active" : ""}`}
              onClick={() => setSelectedBrand("all")}
            >
              ALL BRANDS
            </button>
            <button
              className={`brand-pill asus ${selectedBrand === "asus" ? "active" : ""}`}
              onClick={() => setSelectedBrand("asus")}
            >
              ⚡ ASUS ROG
            </button>
            <button
              className={`brand-pill oneplus ${selectedBrand === "oneplus" ? "active" : ""}`}
              onClick={() => setSelectedBrand("oneplus")}
            >
              🔴 ONEPLUS
            </button>
          </div>

          <div className="filter-group">
            <span className="filter-group-label">EDITION:</span>
            <button
              className={`edition-pill ${selectedEdition === "all" ? "active" : ""}`}
              onClick={() => setSelectedEdition("all")}
            >
              ALL EDITIONS
            </button>
            <button
              className={`edition-pill gold ${selectedEdition === "1of1" ? "active" : ""}`}
              onClick={() => setSelectedEdition("1of1")}
            >
              ★ 1-OF-1 EXCLUSIVE
            </button>
            <button
              className={`edition-pill ${selectedEdition === "standard" ? "active" : ""}`}
              onClick={() => setSelectedEdition("standard")}
            >
              STANDARD SERIES
            </button>
          </div>
        </div>

        {/* Tier Filters */}
        <div className="tier-filter-bar">
          <button
            className={`tier-tab ${selectedTier === "all" ? "active" : ""}`}
            onClick={() => setSelectedTier("all")}
          >
            ALL HARDWARE ({catalogItems.length})
          </button>
          <button
            className={`tier-tab ${selectedTier === "mobiles" ? "active" : ""}`}
            onClick={() => setSelectedTier("mobiles")}
          >
            <span className="tier-indicator tier1"></span>
            MOBILES & TABLETS
          </button>
          <button
            className={`tier-tab ${selectedTier === "monitors" ? "active" : ""}`}
            onClick={() => setSelectedTier("monitors")}
          >
            <span className="tier-indicator tier2"></span>
            DISPLAYS & MONITORS
          </button>
          <button
            className={`tier-tab ${selectedTier === "laptops" ? "active" : ""}`}
            onClick={() => setSelectedTier("laptops")}
          >
            <span className="tier-indicator tier3"></span>
            LAPTOPS & CREATOR
          </button>
          <button
            className={`tier-tab ${selectedTier === "components" ? "active" : ""}`}
            onClick={() => setSelectedTier("components")}
          >
            <span className="tier-indicator tier-comp"></span>
            COMPONENTS & POWER
          </button>
          <button
            className={`tier-tab ${selectedTier === "peripherals" ? "active" : ""}`}
            onClick={() => setSelectedTier("peripherals")}
          >
            <span className="tier-indicator tier-periph"></span>
            PERIPHERALS & WEARABLES
          </button>
        </div>
      </div>

      {/* Hardware Grid */}
      <div className="hardware-grid">
        {filteredItems.map((item) => {
          const priceWei = ethers.parseEther(item.price.toString());
          const userBalanceWei = ethers.parseEther(userAsusBalance.toString());
          const hasEnoughBalance = userBalanceWei >= priceWei;
          const isApproved = allowance >= priceWei;
          const isProcessing = actionLoadingId === item.id;

          const isSoldOut = item.maxSupply > 0 && item.totalMinted >= item.maxSupply;

          let tierClass = "tier1-card";
          let tierBadgeColor = "tier-badge-1";
          let displayTierLabel = item.tierLabel || "Tier 1: Mobile";

          if (item.tier === 0) {
            tierClass = "tier1-card";
            tierBadgeColor = "tier-badge-1";
            displayTierLabel = "Tier 1: Mobile";
          } else if (item.tier === 1) {
            tierClass = "tier2-card";
            tierBadgeColor = "tier-badge-2";
            displayTierLabel = "Tier 2: Monitor";
          } else if (item.tier === 2) {
            tierClass = "tier3-card";
            tierBadgeColor = "tier-badge-3";
            displayTierLabel = "Tier 3: Laptop";
          } else if (item.tier === 3) {
            tierClass = "tier-comp-card";
            tierBadgeColor = "tier-badge-comp";
            displayTierLabel = "Tier 4: Component";
          } else if (item.tier === 4) {
            tierClass = "tier-periph-card";
            tierBadgeColor = "tier-badge-periph";
            displayTierLabel = "Tier 5: Peripheral";
          }

          const brandClass = item.brand === "OnePlus" ? "oneplus-card" : "asus-card";
          const exclusiveClass = item.isOneOfOne ? "one-of-one-card" : "";

          return (
            <div key={item.id} className={`hardware-card ${tierClass} ${brandClass} ${exclusiveClass}`}>
              {/* Corner decorative cyber markers */}
              <div className="corner-top-left"></div>
              <div className="corner-top-right"></div>
              <div className="corner-bottom-left"></div>
              <div className="corner-bottom-right"></div>

              {/* Card Header with Brand, Tier and Price */}
              <div className="card-top-bar">
                <div className="pills-container">
                  <span className={`brand-tag ${item.brand === "OnePlus" ? "op-tag" : "rog-tag"}`}>
                    {item.brand === "OnePlus" ? "🔴 ONEPLUS" : "⚡ ASUS ROG"}
                  </span>
                  <span className={`tier-pill ${tierBadgeColor}`}>
                    {displayTierLabel}
                  </span>
                  {item.isOneOfOne && (
                    <span className="one-of-one-pill">
                      ★ 1-OF-1
                    </span>
                  )}
                </div>
                <div className="price-tag">
                  <span className="price-num">{item.price}</span>
                  <span className="price-cur">ROGUELUS</span>
                </div>
              </div>

              {/* Hardware Preview Illustration */}
              <div className="hardware-art-wrapper">
                <HardwareArt itemId={item.id} code={item.code} />
                <div className="item-code-badge">{item.code}</div>
                {item.maxSupply > 0 && (
                  <div className="stock-counter-badge">
                    {item.totalMinted >= item.maxSupply ? "SOLD OUT" : `STOCK: ${item.totalMinted}/${item.maxSupply}`}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="card-info">
                <h3 className="item-name">{item.name}</h3>
                <div className="item-category">{item.category}</div>
                <p className="item-description">{item.description}</p>

                {/* Overclock Specs */}
                <div className="specs-box">
                  <span className="spec-icon">⚡</span>
                  <span className="spec-text">{item.overclockRating}</span>
                </div>

                {/* Card Minting Action */}
                <div className="card-action-box">
                  {!account ? (
                    <button className="card-btn rog-glow-btn" onClick={connectWallet}>
                      CONNECT WALLET TO FORGE
                    </button>
                  ) : isSoldOut ? (
                    <button className="card-btn sold-out-btn" disabled>
                      🔒 1-OF-1 CLAIMED (SOLD OUT)
                    </button>
                  ) : !hasEnoughBalance ? (
                    <button
                      className="card-btn insufficient-btn"
                      onClick={onNavigateToFaucet}
                      title="Claim free ROGUELUS from the faucet to afford this item"
                    >
                      <span className="insufficient-text">INSUFFICIENT ROGUELUS</span>
                      <span className="insufficient-sub">CLAIM FROM FAUCET &rarr;</span>
                    </button>
                  ) : !isApproved ? (
                    <button
                      className="card-btn approve-btn"
                      onClick={() => handleMint(item)}
                      disabled={isProcessing}
                    >
                      {isProcessing
                        ? actionStep === "approving"
                          ? "APPROVING ROGUELUS..."
                          : "FORGING ON-CHAIN..."
                        : `⚡ APPROVE & MINT NFT (${item.price} ROGUELUS)`}
                    </button>
                  ) : (
                    <button
                      className="card-btn forge-btn ready"
                      onClick={() => handleMint(item)}
                      disabled={isProcessing}
                    >
                      <span className="btn-glitch-effect"></span>
                      {isProcessing
                        ? "FORGING ON-CHAIN..."
                        : `⚔️ MINT NFT (BURN ${item.price} ROGUELUS)`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mint Celebration Modal */}
      {forgedNftData && (
        <div className="modal-backdrop" onClick={() => setForgedNftData(null)}>
          <div className="modal-content celebrate-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-status">⚡ PROTOCOL FORGE COMPLETE</span>
              <button className="close-btn" onClick={() => setForgedNftData(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="mint-success-icon">🏆</div>
              <h2>NFT FORGED SUCCESSFULLY!</h2>
              <p className="mint-congrats-sub">
                Congratulations! You burned <strong>{forgedNftData.item.price} ROGUELUS</strong> and minted:
              </p>

              <div className="minted-preview-card">
                <HardwareArt itemId={forgedNftData.item.id} code={forgedNftData.item.code} />
                <h3>{forgedNftData.item.name}</h3>
                <div className="token-id-badge">TOKEN ID #{forgedNftData.tokenId || "1"}</div>
                <div className="token-auth">ON-CHAIN AUTHENTICATED • ERC-721</div>
              </div>

              <div className="modal-actions">
                <button
                  className="modal-primary-btn"
                  onClick={() => {
                    setForgedNftData(null);
                    if (onOpenVault) onOpenVault();
                  }}
                >
                  🛡️ VIEW IN MY VAULT
                </button>
                <button
                  className="modal-secondary-btn"
                  onClick={() => setForgedNftData(null)}
                >
                  FORGE MORE HARDWARE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
