// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AsusToken.sol";
import "./AsusTechGear.sol";

/**
 * @title AsusArmory
 * @dev Main protocol contract managing the ASUS ROG Hardware Armory.
 * Handles:
 * 1. Faucet: 50 ASUS ERC-20 claim with 24-hour cooldown per address.
 * 2. Spend-to-Mint: Spend/Burn ASUS ERC-20 tokens to mint Tier 1, 2, 3 Hardware NFTs.
 */
contract AsusArmory is Ownable, ReentrancyGuard {
    enum HardwareTier {
        MobileHandheld, // Tier 1: Mobiles & Handhelds
        Monitor,        // Tier 2: Displays
        Laptop,         // Tier 3: Laptops
        Component,      // Tier 4: Extreme Components & Battlestation
        Peripheral      // Tier 5: Peripherals & Networking
    }

    struct GearItem {
        uint256 id;
        string name;
        HardwareTier tier;
        uint256 price; // in wei (18 decimals)
        string tokenURI;
        bool isActive;
        uint256 totalMinted;
        uint256 maxSupply; // 0 = unlimited, 1 = 1-of-1 exclusive, N = limited edition
    }

    AsusToken public immutable asusToken;
    AsusTechGear public immutable techGear;

    uint256 public faucetAmount = 50 * 10**18; // 50 ASUS tokens
    uint256 public faucetCooldown = 24 hours;   // 24-hour cooldown
    uint256 public tokensPerEth = 1000;         // 1 ETH = 1,000 ASUS tokens

    // User address => timestamp of last faucet claim
    mapping(address => uint256) public lastFaucetClaim;

    // List of catalog hardware items
    GearItem[] private _gearCatalog;

    // Events
    event FaucetClaimed(
        address indexed user,
        uint256 amount,
        uint256 timestamp,
        uint256 nextAvailableClaim
    );

    event GearMinted(
        address indexed user,
        uint256 indexed tokenId,
        uint256 indexed itemId,
        string itemName,
        HardwareTier tier,
        uint256 priceBurned
    );

    event GearItemAdded(uint256 indexed itemId, string name, HardwareTier tier, uint256 price);
    event GearItemUpdated(uint256 indexed itemId, string name, uint256 price, bool isActive);
    event FaucetConfigUpdated(uint256 newAmount, uint256 newCooldown);
    event TokensPurchased(address indexed buyer, uint256 ethSpent, uint256 asusReceived);

    /**
     * @param initialOwner Protocol owner address.
     * @param _token Address of deployed AsusToken contract.
     * @param _gear Address of deployed AsusTechGear contract.
     */
    constructor(
        address initialOwner,
        address _token,
        address _gear
    ) Ownable(initialOwner) {
        require(_token != address(0), "Invalid token address");
        require(_gear != address(0), "Invalid gear address");
        asusToken = AsusToken(_token);
        techGear = AsusTechGear(_gear);
    }

    // ==========================================
    // FAUCET LOGIC
    // ==========================================

    /**
     * @notice Allows user to claim 50 free ASUS ERC-20 tokens every 24 hours.
     */
    function claimFaucet() external nonReentrant {
        uint256 lastClaim = lastFaucetClaim[msg.sender];
        require(
            block.timestamp >= lastClaim + faucetCooldown,
            "Faucet cooldown active. Please wait 24 hours between claims."
        );
        require(
            asusToken.balanceOf(address(this)) >= faucetAmount,
            "Faucet pool is empty. Please contact the Armory master."
        );

        lastFaucetClaim[msg.sender] = block.timestamp;
        bool success = asusToken.transfer(msg.sender, faucetAmount);
        require(success, "Token transfer failed");

        emit FaucetClaimed(
            msg.sender,
            faucetAmount,
            block.timestamp,
            block.timestamp + faucetCooldown
        );
    }

    /**
     * @notice Allows users to buy ASUS tokens using test ETH (Rate: 1 ETH = 1,000 ASUS).
     */
    function buyTokens() external payable nonReentrant {
        require(msg.value > 0, "Must send ETH to purchase ASUS tokens");
        uint256 asusAmount = msg.value * tokensPerEth;
        require(
            asusToken.balanceOf(address(this)) >= asusAmount,
            "Armory reserve has insufficient ASUS tokens"
        );

        bool success = asusToken.transfer(msg.sender, asusAmount);
        require(success, "Token transfer failed");

        emit TokensPurchased(msg.sender, msg.value, asusAmount);
    }

    /**
     * @notice Updates the ETH-to-ASUS exchange rate.
     */
    function setTokensPerEth(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Rate must be greater than 0");
        tokensPerEth = newRate;
    }

    /**
     * @notice Withdraw accumulated ETH from token sales (Owner only).
     */
    function withdrawEth() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        (bool sent, ) = payable(owner()).call{value: balance}("");
        require(sent, "ETH withdrawal failed");
    }

    /**
     * @notice Check whether a user can claim from faucet and seconds remaining if not.
     * @param user Address to check.
     * @return canClaim True if cooldown has elapsed.
     * @return secondsRemaining Seconds until next claim is permitted (0 if canClaim is true).
     */
    function canClaimFaucet(address user)
        external
        view
        returns (bool canClaim, uint256 secondsRemaining)
    {
        uint256 lastClaim = lastFaucetClaim[user];
        if (lastClaim == 0 || block.timestamp >= lastClaim + faucetCooldown) {
            return (true, 0);
        } else {
            return (false, (lastClaim + faucetCooldown) - block.timestamp);
        }
    }

    // ==========================================
    // SPEND-TO-MINT (HARDWARE ARMORY) LOGIC
    // ==========================================

    /**
     * @notice Spend & burn ASUS ERC-20 tokens to mint an ASUS Hardware NFT.
     * Requires prior ERC-20 approval from msg.sender to AsusArmory contract.
     * @param itemId Catalog ID of the hardware item to forge.
     * @return tokenId The newly minted NFT token ID.
     */
    function mintGear(uint256 itemId) external nonReentrant returns (uint256) {
        require(itemId < _gearCatalog.length, "Invalid gear item ID");
        GearItem storage item = _gearCatalog[itemId];
        require(item.isActive, "Gear item is currently out of stock or disabled");
        if (item.maxSupply > 0) {
            require(item.totalMinted < item.maxSupply, "Item sold out! Max supply reached.");
        }

        uint256 price = item.price;

        // Burn the ASUS tokens directly from user's balance
        // Note: requires user to have called asusToken.approve(address(this), price)
        asusToken.burnFrom(msg.sender, price);

        // Mint the ERC-721 Hardware NFT to the user with the preconfigured metadata URI
        // 1-of-1 exclusive items (maxSupply == 1) are flagged as protected and unburnable
        bool isOneOfOne = (item.maxSupply == 1);
        uint256 tokenId = techGear.mintToUser(msg.sender, item.tokenURI, isOneOfOne);
        item.totalMinted++;

        emit GearMinted(
            msg.sender,
            tokenId,
            itemId,
            item.name,
            item.tier,
            price
        );

        return tokenId;
    }

    // ==========================================
    // CATALOG MANAGEMENT (OWNER ONLY)
    // ==========================================

    /**
     * @notice Adds a hardware item to the Armory catalog.
     * @param maxSupply 0 for unlimited, 1 for 1-of-1 exclusive, N for limited edition.
     */
    function addGearItem(
        string memory name,
        HardwareTier tier,
        uint256 price,
        string memory tokenURI,
        uint256 maxSupply
    ) external onlyOwner returns (uint256) {
        uint256 itemId = _gearCatalog.length;
        _gearCatalog.push(
            GearItem({
                id: itemId,
                name: name,
                tier: tier,
                price: price,
                tokenURI: tokenURI,
                isActive: true,
                totalMinted: 0,
                maxSupply: maxSupply
            })
        );

        emit GearItemAdded(itemId, name, tier, price);
        return itemId;
    }

    /**
     * @notice Updates existing item parameters.
     */
    function updateGearItem(
        uint256 itemId,
        string memory name,
        uint256 price,
        string memory tokenURI,
        bool isActive,
        uint256 maxSupply
    ) external onlyOwner {
        require(itemId < _gearCatalog.length, "Invalid item ID");
        GearItem storage item = _gearCatalog[itemId];
        item.name = name;
        item.price = price;
        item.tokenURI = tokenURI;
        item.isActive = isActive;
        item.maxSupply = maxSupply;

        emit GearItemUpdated(itemId, name, price, isActive);
    }

    /**
     * @notice Toggle gear item stock status.
     */
    function setGearItemActive(uint256 itemId, bool isActive) external onlyOwner {
        require(itemId < _gearCatalog.length, "Invalid item ID");
        _gearCatalog[itemId].isActive = isActive;
    }

    /**
     * @notice Update faucet rewards and cooldown period.
     */
    function configureFaucet(uint256 newAmount, uint256 newCooldown) external onlyOwner {
        faucetAmount = newAmount;
        faucetCooldown = newCooldown;
        emit FaucetConfigUpdated(newAmount, newCooldown);
    }

    /**
     * @notice Withdraw excess ERC-20 tokens if needed.
     */
    function emergencyWithdrawTokens(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).transfer(owner(), amount);
    }

    // ==========================================
    // VIEW FUNCTIONS
    // ==========================================

    /**
     * @notice Returns all items currently in the catalog.
     */
    function getAllGearItems() external view returns (GearItem[] memory) {
        return _gearCatalog;
    }

    /**
     * @notice Returns total number of hardware catalog items.
     */
    function getGearCatalogCount() external view returns (uint256) {
        return _gearCatalog.length;
    }

    /**
     * @notice Returns a single gear item by ID.
     */
    function getGearItem(uint256 itemId) external view returns (GearItem memory) {
        require(itemId < _gearCatalog.length, "Item does not exist");
        return _gearCatalog[itemId];
    }
}

