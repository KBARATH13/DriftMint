import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import contractsConfig from "../contracts/contractsConfig.json";

const Web3Context = createContext(null);

export const HARDHAT_CHAIN_ID = "0x7a69"; // 31337 in hex
export const HARDHAT_NETWORK_CONFIG = {
  chainId: HARDHAT_CHAIN_ID,
  chainName: "Hardhat Local EVM",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["http://127.0.0.1:8545"],
};

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Contract instances
  const [asusToken, setAsusToken] = useState(null);
  const [techGear, setTechGear] = useState(null);
  const [armory, setArmory] = useState(null);

  // Protocol state & balances
  const [userEthBalance, setUserEthBalance] = useState("0.0");
  const [userAsusBalance, setUserAsusBalance] = useState("0");
  const [armoryPoolBalance, setArmoryPoolBalance] = useState("0");
  const [userNftCount, setUserNftCount] = useState(0);
  const [userNfts, setUserNfts] = useState([]);
  const [catalogItems, setCatalogItems] = useState(contractsConfig.catalogConfig || []);

  // Faucet state
  const [canClaimFaucet, setCanClaimFaucet] = useState(true);
  const [faucetCooldownSeconds, setFaucetCooldownSeconds] = useState(null);
  const [faucetAmount, setFaucetAmount] = useState("50");

  // Notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info", txHash = null) => {
    setToast({ message, type, txHash, id: Date.now() });
  };

  const clearToast = () => {
    setToast(null);
  };

  // Initialize read-only provider if wallet not connected yet
  const initReadOnlyProvider = useCallback(async () => {
    try {
      let rpcProvider;
      if (window.ethereum) {
        rpcProvider = new ethers.BrowserProvider(window.ethereum);
      } else {
        rpcProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      }
      setProvider(rpcProvider);

      const tokenContract = new ethers.Contract(
        contractsConfig.contracts.AsusToken.address,
        contractsConfig.contracts.AsusToken.abi,
        rpcProvider
      );
      const gearContract = new ethers.Contract(
        contractsConfig.contracts.AsusTechGear.address,
        contractsConfig.contracts.AsusTechGear.abi,
        rpcProvider
      );
      const armoryContract = new ethers.Contract(
        contractsConfig.contracts.AsusArmory.address,
        contractsConfig.contracts.AsusArmory.abi,
        rpcProvider
      );

      setAsusToken(tokenContract);
      setTechGear(gearContract);
      setArmory(armoryContract);

      // Fetch armory pool balance
      const poolBal = await tokenContract.balanceOf(contractsConfig.contracts.AsusArmory.address);
      setArmoryPoolBalance(ethers.formatEther(poolBal));

      // Fetch catalog items from contract or fallback configuration
      try {
        // Use static catalog configuration directly (instant load with fast Base64 metadata)
        // and fetch live totalMinted / isActive status per item without gas-choking EVM call
        const count = Number(await armoryContract.getGearCatalogCount());
        if (count > 0 && contractsConfig.catalogConfig?.length > 0) {
          // Fetch live stock counts for items
          const itemsWithStock = await Promise.all(
            contractsConfig.catalogConfig.map(async (cfgItem, idx) => {
              if (idx < count) {
                try {
                  const onChainItem = await armoryContract.getGearItem(idx);
                  return {
                    ...cfgItem,
                    price: ethers.formatEther(onChainItem.price),
                    totalMinted: Number(onChainItem.totalMinted || 0),
                    maxSupply: Number(onChainItem.maxSupply || cfgItem.maxSupply || 0),
                    isActive: Boolean(onChainItem.isActive)
                  };
                } catch {
                  return cfgItem;
                }
              }
              return cfgItem;
            })
          );
          setCatalogItems(itemsWithStock);
        }
      } catch (catErr) {
        // Fallback safely to generated configuration
        if (contractsConfig.catalogConfig?.length > 0) {
          setCatalogItems(contractsConfig.catalogConfig);
        }
      }
    } catch (err) {
      console.warn("Read-only provider init note:", err.message);
    }
  }, []);

  // Refresh user data (balances, faucet cooldown, inventory)
  const refreshUserData = useCallback(async (currentAccount, currentSigner) => {
    if (!currentAccount || !contractsConfig.contracts) return;

    try {
      const activeProvider = currentSigner?.provider || provider || new ethers.BrowserProvider(window.ethereum);

      const tokenContract = new ethers.Contract(
        contractsConfig.contracts.AsusToken.address,
        contractsConfig.contracts.AsusToken.abi,
        currentSigner || activeProvider
      );
      const gearContract = new ethers.Contract(
        contractsConfig.contracts.AsusTechGear.address,
        contractsConfig.contracts.AsusTechGear.abi,
        currentSigner || activeProvider
      );
      const armoryContract = new ethers.Contract(
        contractsConfig.contracts.AsusArmory.address,
        contractsConfig.contracts.AsusArmory.abi,
        currentSigner || activeProvider
      );

      // 1. User ETH balance
      const ethBal = await activeProvider.getBalance(currentAccount);
      setUserEthBalance(parseFloat(ethers.formatEther(ethBal)).toFixed(4));

      // 2. User ASUS token balance
      const asusBal = await tokenContract.balanceOf(currentAccount);
      setUserAsusBalance(ethers.formatEther(asusBal));

      // 3. Armory pool balance
      const poolBal = await tokenContract.balanceOf(contractsConfig.contracts.AsusArmory.address);
      setArmoryPoolBalance(ethers.formatEther(poolBal));

      // 4. Faucet cooldown check
      const [eligible, remaining] = await armoryContract.canClaimFaucet(currentAccount);
      setCanClaimFaucet(eligible);
      setFaucetCooldownSeconds(Number(remaining));

      // 5. User NFT Count & Inventory
      const nftBal = await gearContract.balanceOf(currentAccount);
      const totalOwned = Number(nftBal);
      setUserNftCount(totalOwned);

      // Scan user NFTs
      if (totalOwned > 0) {
        const totalMinted = Number(await gearContract.totalMinted());
        const ownedItems = [];

        for (let tokenId = 1; tokenId <= totalMinted; tokenId++) {
          try {
            const ownerOfToken = await gearContract.ownerOf(tokenId);
            if (ownerOfToken.toLowerCase() === currentAccount.toLowerCase()) {
              const rawUri = await gearContract.tokenURI(tokenId);
              let metadata = null;

              if (rawUri.startsWith("data:application/json;base64,")) {
                const base64Data = rawUri.replace("data:application/json;base64,", "");
                const decoded = atob(base64Data);
                metadata = JSON.parse(decoded);
              } else if (rawUri.startsWith("data:application/json,")) {
                metadata = JSON.parse(decodeURIComponent(rawUri.replace("data:application/json,", "")));
              }

              ownedItems.push({
                tokenId,
                rawUri,
                metadata: metadata || { name: `ASUS ROG NFT #${tokenId}`, description: "Verified Hardware NFT" }
              });
            }
          } catch {
            // Token might not exist or burned, ignore
          }
        }
        setUserNfts(ownedItems);
      } else {
        setUserNfts([]);
      }
    } catch (err) {
      console.error("Error refreshing Web3 state:", err);
    }
  }, [provider]);

  // Connect Wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      showToast("MetaMask or Web3 wallet extension not detected. Please install MetaMask.", "error");
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const activeAccount = accounts[0];
      const network = await browserProvider.getNetwork();
      const currentSigner = await browserProvider.getSigner();

      setAccount(activeAccount);
      setProvider(browserProvider);
      setSigner(currentSigner);
      setChainId(Number(network.chainId));

      const tokenContract = new ethers.Contract(
        contractsConfig.contracts.AsusToken.address,
        contractsConfig.contracts.AsusToken.abi,
        currentSigner
      );
      const gearContract = new ethers.Contract(
        contractsConfig.contracts.AsusTechGear.address,
        contractsConfig.contracts.AsusTechGear.abi,
        currentSigner
      );
      const armoryContract = new ethers.Contract(
        contractsConfig.contracts.AsusArmory.address,
        contractsConfig.contracts.AsusArmory.abi,
        currentSigner
      );

      setAsusToken(tokenContract);
      setTechGear(gearContract);
      setArmory(armoryContract);

      await refreshUserData(activeAccount, currentSigner);
      showToast(`Connected: ${activeAccount.slice(0, 6)}...${activeAccount.slice(-4)}`, "success");
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setError(err.message);
      showToast(`Connection failed: ${err.message}`, "error");
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch / Add Hardhat Local Network
  const switchToHardhatNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_CHAIN_ID }],
      });
    } catch (switchError) {
      // 4902 code indicates chain is not added yet
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [HARDHAT_NETWORK_CONFIG],
          });
        } catch (addError) {
          showToast(`Failed to add network: ${addError.message}`, "error");
        }
      } else {
        showToast(`Failed to switch network: ${switchError.message}`, "error");
      }
    }
  };

  // Add Roguelus Token to MetaMask
  const addTokenToMetaMask = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: contractsConfig.contracts.AsusToken.address,
            symbol: "ROGUELUS",
            decimals: 18,
            image: "https://rog.asus.com/media/1594966757827.jpg",
          },
        },
      });
      showToast("Roguelus Token added to MetaMask asset list!", "success");
    } catch (err) {
      console.error(err);
    }
  };

  // Disconnect
  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setUserEthBalance("0.0");
    setUserAsusBalance("0");
    setUserNftCount(0);
    setUserNfts([]);
    initReadOnlyProvider();
    showToast("Wallet disconnected", "info");
  };

  // Listen to provider events (accountChanged, chainChanged)
  // Also silently re-hydrate state if MetaMask is already connected on page load
  useEffect(() => {
    initReadOnlyProvider();

    if (window.ethereum) {
      // --- Silent reconnect on page reload ---
      // eth_accounts (no prompt) returns accounts if the user already authorised this site.
      // We use this to restore faucet cooldown & balances without forcing a MetaMask pop-up.
      const restoreSession = async () => {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const network = await browserProvider.getNetwork();
            const currentSigner = await browserProvider.getSigner();
            const activeAccount = accounts[0];

            setAccount(activeAccount);
            setProvider(browserProvider);
            setSigner(currentSigner);
            setChainId(Number(network.chainId));

            const tokenContract = new ethers.Contract(
              contractsConfig.contracts.AsusToken.address,
              contractsConfig.contracts.AsusToken.abi,
              currentSigner
            );
            const gearContract = new ethers.Contract(
              contractsConfig.contracts.AsusTechGear.address,
              contractsConfig.contracts.AsusTechGear.abi,
              currentSigner
            );
            const armoryContract = new ethers.Contract(
              contractsConfig.contracts.AsusArmory.address,
              contractsConfig.contracts.AsusArmory.abi,
              currentSigner
            );

            setAsusToken(tokenContract);
            setTechGear(gearContract);
            setArmory(armoryContract);

            // Fetch on-chain faucet cooldown so it survives page refresh
            await refreshUserData(activeAccount, currentSigner);
          }
        } catch (err) {
          // Not fatal — user may not be connected yet
          console.warn("Silent session restore skipped:", err.message);
        }
      };

      restoreSession();

      // --- MetaMask event listeners ---
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          const freshAccount = accounts[0];
          setAccount(freshAccount);
          // Instantly reset stale cooldown while querying on-chain state for the new account
          setFaucetCooldownSeconds(0);
          setCanClaimFaucet(true);

          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          browserProvider.getSigner().then((freshSigner) => {
            setSigner(freshSigner);

            const tokenContract = new ethers.Contract(
              contractsConfig.contracts.AsusToken.address,
              contractsConfig.contracts.AsusToken.abi,
              freshSigner
            );
            const gearContract = new ethers.Contract(
              contractsConfig.contracts.AsusTechGear.address,
              contractsConfig.contracts.AsusTechGear.abi,
              freshSigner
            );
            const armoryContract = new ethers.Contract(
              contractsConfig.contracts.AsusArmory.address,
              contractsConfig.contracts.AsusArmory.abi,
              freshSigner
            );

            setAsusToken(tokenContract);
            setTechGear(gearContract);
            setArmory(armoryContract);

            refreshUserData(freshAccount, freshSigner);
          });
        } else {
          disconnectWallet();
        }
      };

      const handleChainChanged = (newChainId) => {
        setChainId(parseInt(newChainId, 16));
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, []);

  // Cooldown timer interval — runs once when cooldown is set, ticks every second
  useEffect(() => {
    // If cooldown is not yet loaded, do nothing
    if (faucetCooldownSeconds === null) {
      return;
    }

    if (faucetCooldownSeconds <= 0) {
      // Only flip canClaimFaucet to true if it was false (avoid infinite re-render)
      setCanClaimFaucet((prev) => (prev ? prev : true));
      return;
    }

    // Run a single long-lived interval; do NOT depend on faucetCooldownSeconds
    // (that would restart the interval on every tick)
    const timer = setInterval(() => {
      setFaucetCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClaimFaucet(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faucetCooldownSeconds > 0 ? "active" : "idle"]);

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        chainId,
        isConnecting,
        error,
        asusToken,
        techGear,
        armory,
        userEthBalance,
        userAsusBalance,
        armoryPoolBalance,
        userNftCount,
        userNfts,
        catalogItems,
        canClaimFaucet,
        faucetCooldownSeconds,
        faucetAmount,
        toast,
        connectWallet,
        disconnectWallet,
        switchToHardhatNetwork,
        addTokenToMetaMask,
        refreshUserData: () => refreshUserData(account, signer),
        showToast,
        clearToast,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}

