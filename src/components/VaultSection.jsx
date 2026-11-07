import React, { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import contractsConfig from "../contracts/contractsConfig.json";
import "./VaultSection.css";

export default function VaultSection({ onNavigateToStore }) {
  const { account, techGear, userNfts, userNftCount, connectWallet, refreshUserData, showToast } = useWeb3();
  const [selectedNft, setSelectedNft] = useState(null);

  // Burn feature state
  const [burnTarget, setBurnTarget] = useState(null);  // NFT pending burn confirmation
  const [isBurning, setIsBurning] = useState(false);

  // Transfer / Gift feature state
  const [transferTarget, setTransferTarget] = useState(null); // NFT pending P2P transfer
  const [transferRecipient, setTransferRecipient] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Helper to determine if an NFT is an exclusive 1-of-1 item
  const isExclusiveOneOfOne = (nft) => {
    const meta = nft?.metadata || {};
    const attrs = meta.attributes || [];
    return (
      meta.name?.toLowerCase().includes("1-of-1") ||
      attrs.some(
        (a) =>
          (a.trait_type === "Edition Type" && a.value === "1-of-1 Exclusive") ||
          (a.trait_type === "Max Supply" && String(a.value) === "1")
      )
    );
  };

  // Double-click handler – opens burn modal only if not 1-of-1
  const handleDoubleClick = (e, nft) => {
    e.stopPropagation();
    if (isExclusiveOneOfOne(nft)) {
      showToast(
        "🔒 1-of-1 Exclusive Masterpiece: This rare hardware NFT is permanent and protected from burning! (Use Transfer to gift it).",
        "info"
      );
      return;
    }
    setBurnTarget(nft);
  };

  // Single-click handler – opens the inspect modal
  const handleSingleClick = (nft) => {
    setSelectedNft(nft);
  };

  // Burn the NFT on-chain and remove from inventory
  const handleBurn = async () => {
    if (!burnTarget || !account) return;

    if (isExclusiveOneOfOne(burnTarget)) {
      showToast("❌ 1-of-1 Exclusive NFTs cannot be burned!", "error");
      setBurnTarget(null);
      return;
    }

    try {
      setIsBurning(true);
      showToast(
        `Initiating on-chain burn for NFT #${burnTarget.tokenId}…`,
        "info"
      );

      const tx = await techGear.burn(burnTarget.tokenId);
      showToast("Burn transaction submitted. Awaiting block confirmation…", "info", tx.hash);

      const receipt = await tx.wait();
      showToast(
        `🔥 NFT #${burnTarget.tokenId} permanently destroyed!`,
        "success",
        receipt.hash
      );

      // Close modals
      setBurnTarget(null);
      setSelectedNft(null);

      // Refresh all on-chain data (NFT list, balances, etc.)
      await refreshUserData();
    } catch (err) {
      console.error("Burn error:", err);
      const errorMsg = err.reason || err.data?.message || err.message;
      showToast(`Burn failed: ${errorMsg}`, "error");
    } finally {
      setIsBurning(false);
    }
  };

  // Transfer / Gift the NFT to another Ethereum address
  const handleTransfer = async (e) => {
    e?.preventDefault();
    if (!transferTarget || !account) return;

    const trimmedAddress = transferRecipient.trim();

    if (!trimmedAddress || !ethers.isAddress(trimmedAddress)) {
      showToast("Please enter a valid 0x recipient Ethereum address", "error");
      return;
    }

    if (trimmedAddress.toLowerCase() === account.toLowerCase()) {
      showToast("Recipient cannot be your own connected wallet address!", "error");
      return;
    }

    if (trimmedAddress === ethers.ZeroAddress) {
      showToast("Cannot transfer to zero address. (Standard NFTs can be burned instead).", "error");
      return;
    }

    try {
      setIsTransferring(true);
      showToast(
        `Initiating transfer of NFT #${transferTarget.tokenId} to ${trimmedAddress.slice(0, 6)}...${trimmedAddress.slice(-4)}`,
        "info"
      );

      // safeTransferFrom(from, to, tokenId)
      const tx = await techGear["safeTransferFrom(address,address,uint256)"](
        account,
        trimmedAddress,
        transferTarget.tokenId
      );
      showToast("Transfer transaction submitted to EVM. Awaiting block confirmation…", "info", tx.hash);

      const receipt = await tx.wait();
      showToast(
        `🎁 SUCCESS! NFT #${transferTarget.tokenId} transferred to ${trimmedAddress.slice(0, 6)}...${trimmedAddress.slice(-4)}!`,
        "success",
        receipt.hash
      );

      // Close modals and reset
      setTransferTarget(null);
      setTransferRecipient("");
      setSelectedNft(null);

      // Refresh inventory so the transferred NFT is removed from current wallet
      await refreshUserData();
    } catch (err) {
      console.error("NFT Transfer error:", err);
      const errorMsg = err.reason || err.data?.message || err.message;
      showToast(`Transfer failed: ${errorMsg}`, "error");
    } finally {
      setIsTransferring(false);
    }
  };

  if (!account) {
    return (
      <div className="vault-container">
        <div className="empty-vault-card">
          <div className="empty-icon">🔒</div>
          <h2>VAULT ACCESS RESTRICTED</h2>
          <p>Connect your Web3 wallet to inspect your authenticated Roguelus Hardware NFTs.</p>
          <button className="claim-faucet-btn rog-glow-btn" onClick={connectWallet}>
            CONNECT WALLET
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-container">
      {/* Header */}
      <div className="vault-header">
        <div className="banner-badge">
          <span className="live-reactor-pulse"></span>
          <span>ROGUELUS DIGITAL INVENTORY // PROOF OF HARDWARE OWNERSHIP</span>
        </div>
        <h1 className="store-title">
          ROGUELUS HARDWARE <span className="highlight-text">INVENTORY</span>
        </h1>
        <p className="store-tagline">
          Showcase of your owned ASUS ROG &amp; OnePlus hardware NFTs. Each item's specifications and trait attributes
          are parsed directly from on-chain Base64 metadata JSON.
        </p>

        <div className="vault-summary-pill">
          <span>Total Hardware Equipped: <strong>{userNftCount} NFTs</strong></span>
        </div>

        <p className="vault-hint">
          💡 <strong>Tip:</strong> Click an NFT to <strong>Inspect or Transfer / Gift</strong> it. Double-click standard NFTs to <strong>Burn</strong>. 1-of-1 Exclusives are <strong>transferable</strong> but <strong>permanently protected from burning</strong>.
        </p>
      </div>

      {/* NFT Grid or Empty state */}
      {userNfts.length === 0 ? (
        <div className="empty-vault-card">
          <div className="empty-icon">🛡️</div>
          <h2>YOUR ARMORY IS EMPTY</h2>
          <p>
            You have not forged any Roguelus Hardware NFTs yet. Use the Roguelus Faucet to claim
            50 free tokens and forge your first gaming powerhouse!
          </p>
          <button className="claim-faucet-btn rog-glow-btn" onClick={onNavigateToStore}>
            ⚔️ GO TO HARDWARE ARMORY
          </button>
        </div>
      ) : (
        <div className="vault-grid">
          {userNfts.map((nft) => {
            const meta = nft.metadata || {};
            const attributes = meta.attributes || [];
            const isOneOfOne = isExclusiveOneOfOne(nft);

            return (
              <div
                key={nft.tokenId}
                className={`vault-nft-card ${isOneOfOne ? "exclusive-card" : ""}`}
                onClick={() => handleSingleClick(nft)}
                onDoubleClick={(e) => handleDoubleClick(e, nft)}
              >
                {/* Image / SVG rendering */}
                <div className="vault-nft-image-box">
                  {meta.image ? (
                    <img src={meta.image} alt={meta.name} className="vault-nft-img" />
                  ) : (
                    <div className="nft-img-fallback">⚡ {meta.name}</div>
                  )}
                  <div className="vault-token-id">ID #{nft.tokenId}</div>

                  {isOneOfOne ? (
                    <div className="vault-badge-one-of-one">★ 1-OF-1 PROTECTED</div>
                  ) : null}
                </div>

                <div className="vault-nft-details">
                  <h3 className="vault-nft-title">{meta.name || `ASUS ROG NFT #${nft.tokenId}`}</h3>
                  <p className="vault-nft-desc">{meta.description || "Official Hardware NFT"}</p>

                  <div className="vault-traits-tags">
                    {attributes.slice(0, 3).map((attr, idx) => (
                      <span key={idx} className="trait-tag">
                        {attr.trait_type}: <strong>{attr.value}</strong>
                      </span>
                    ))}
                  </div>

                  <div className="card-action-row">
                    <button className="inspect-nft-btn">
                      INSPECT &amp; TRANSFER &rarr;
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================
          NFT DETAIL / INSPECT MODAL (single click)
          ================================================================ */}
      {selectedNft && (
        <div className="modal-backdrop" onClick={() => setSelectedNft(null)}>
          <div className="modal-content inspect-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-status">🛡️ HARDWARE NFT SPECIFICATION</span>
              <button className="close-btn" onClick={() => setSelectedNft(null)}>✕</button>
            </div>

            <div className="inspect-modal-body">
              <div className="inspect-image-panel">
                {selectedNft.metadata?.image && (
                  <img src={selectedNft.metadata.image} alt={selectedNft.metadata.name} />
                )}
                <div className="token-cert-badge">
                  VERIFIED BY ROGUELUS PROTOCOL
                </div>
                {isExclusiveOneOfOne(selectedNft) && (
                  <div className="modal-exclusive-pill">
                    ★ 1-OF-1 EXCLUSIVE MASTERPIECE
                  </div>
                )}
              </div>

              <div className="inspect-info-panel">
                <h2>{selectedNft.metadata?.name}</h2>
                <div className="token-id-banner">TOKEN ID #{selectedNft.tokenId}</div>
                <p className="inspect-desc">{selectedNft.metadata?.description}</p>

                <h4>ON-CHAIN ATTRIBUTES &amp; SPECS</h4>
                <div className="attributes-grid">
                  {selectedNft.metadata?.attributes?.map((attr, idx) => (
                    <div key={idx} className="attribute-item">
                      <span className="attr-type">{attr.trait_type}</span>
                      <span className="attr-val">{attr.value}</span>
                    </div>
                  ))}
                </div>

                <div className="contract-address-info">
                  <span className="ca-label">NFT Smart Contract:</span>
                  <span className="ca-value">{contractsConfig.contracts.AsusTechGear.address}</span>
                </div>

                {/* Action Buttons: Transfer + Burn */}
                <div className="inspect-actions-container">
                  <button
                    className="transfer-trigger-btn"
                    onClick={() => {
                      setTransferTarget(selectedNft);
                      setTransferRecipient("");
                    }}
                  >
                    🎁 TRANSFER / GIFT NFT
                  </button>

                  {isExclusiveOneOfOne(selectedNft) ? (
                    <div className="protected-burn-notice">
                      🔒 1-OF-1 EXCLUSIVE // IMMUTABLE &amp; UNBURNABLE
                    </div>
                  ) : (
                    <button
                      className="burn-btn-modal"
                      onClick={() => {
                        setBurnTarget(selectedNft);
                      }}
                    >
                      🔥 BURN THIS NFT
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          TRANSFER / GIFT MODAL
          ================================================================ */}
      {transferTarget && (
        <div className="modal-backdrop transfer-backdrop" onClick={() => !isTransferring && setTransferTarget(null)}>
          <div className="modal-content transfer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header transfer-modal-header">
              <span className="modal-status transfer-status">🎁 PEER-TO-PEER NFT TRANSFER</span>
              <button
                className="close-btn"
                onClick={() => !isTransferring && setTransferTarget(null)}
                disabled={isTransferring}
              >
                ✕
              </button>
            </div>

            <div className="transfer-modal-body">
              {/* NFT preview thumbnail */}
              <div className={`transfer-preview ${isExclusiveOneOfOne(transferTarget) ? "exclusive-preview" : ""}`}>
                {transferTarget.metadata?.image ? (
                  <img
                    src={transferTarget.metadata.image}
                    alt={transferTarget.metadata?.name}
                    className="transfer-preview-img"
                  />
                ) : (
                  <div className="nft-img-fallback">⚡ {transferTarget.metadata?.name}</div>
                )}
                {isExclusiveOneOfOne(transferTarget) && (
                  <div className="transfer-1of1-badge">★ 1-OF-1</div>
                )}
              </div>

              <div className="transfer-info">
                <h2 className="transfer-title">
                  {transferTarget.metadata?.name || `ASUS ROG NFT #${transferTarget.tokenId}`}
                </h2>
                <div className="transfer-token-id">TOKEN ID #{transferTarget.tokenId}</div>

                <div className="transfer-notice-box">
                  <span className="transfer-notice-icon">ℹ️</span>
                  <div>
                    <p className="transfer-notice-headline">ON-CHAIN CUSTODY TRANSFER</p>
                    <p className="transfer-notice-text">
                      Transferring moves <strong>full cryptographic ownership</strong> of this NFT to the recipient address. It will appear in their wallet and inventory immediately upon block confirmation.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleTransfer} className="transfer-form">
                  <div className="transfer-input-group">
                    <label>Recipient Ethereum Address (0x…):</label>
                    <input
                      type="text"
                      value={transferRecipient}
                      onChange={(e) => setTransferRecipient(e.target.value)}
                      placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                      disabled={isTransferring}
                      autoFocus
                    />
                  </div>

                  <div className="transfer-actions">
                    <button
                      type="submit"
                      className="transfer-confirm-btn"
                      disabled={isTransferring || !transferRecipient}
                    >
                      {isTransferring ? "TRANSFERRING ON-CHAIN…" : "🎁 CONFIRM TRANSFER"}
                    </button>
                    <button
                      type="button"
                      className="transfer-cancel-btn"
                      onClick={() => setTransferTarget(null)}
                      disabled={isTransferring}
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          BURN CONFIRMATION MODAL (shown on double-click OR from inspect)
          ================================================================ */}
      {burnTarget && (
        <div className="modal-backdrop burn-backdrop" onClick={() => !isBurning && setBurnTarget(null)}>
          <div className="modal-content burn-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header burn-modal-header">
              <span className="modal-status burn-status">⚠️ PERMANENT DESTRUCTION</span>
              <button
                className="close-btn"
                onClick={() => !isBurning && setBurnTarget(null)}
                disabled={isBurning}
              >
                ✕
              </button>
            </div>

            <div className="burn-modal-body">
              {/* NFT preview */}
              <div className="burn-preview">
                {burnTarget.metadata?.image ? (
                  <img
                    src={burnTarget.metadata.image}
                    alt={burnTarget.metadata?.name}
                    className="burn-preview-img"
                  />
                ) : (
                  <div className="nft-img-fallback">⚡ {burnTarget.metadata?.name}</div>
                )}
              </div>

              <div className="burn-info">
                <h2 className="burn-title">
                  {burnTarget.metadata?.name || `ASUS ROG NFT #${burnTarget.tokenId}`}
                </h2>
                <div className="burn-token-id">TOKEN ID #{burnTarget.tokenId}</div>

                <div className="burn-warning-box">
                  <span className="burn-warning-icon">🔥</span>
                  <div>
                    <p className="burn-warning-headline">THIS ACTION IS IRREVERSIBLE</p>
                    <p className="burn-warning-text">
                      Burning will permanently destroy <strong>this specific copy (Token ID #{burnTarget.tokenId})</strong> from the blockchain.
                      It will be removed from your wallet and inventory.
                      <br /><br />
                      <span className="burn-note-sub">
                        ℹ️ Note: This is a standard series NFT. You or any player can forge a new copy anytime from the Hardware Armory.
                      </span>
                    </p>
                  </div>
                </div>

                <div className="burn-actions">
                  <button
                    className="burn-confirm-btn"
                    onClick={handleBurn}
                    disabled={isBurning}
                  >
                    {isBurning ? "⛏️ DESTROYING ON-CHAIN…" : "🔥 CONFIRM BURN"}
                  </button>
                  <button
                    className="burn-cancel-btn"
                    onClick={() => setBurnTarget(null)}
                    disabled={isBurning}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
