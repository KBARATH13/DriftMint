// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AsusTechGear
 * @dev Official ERC-721 NFT for ASUS ROG Hardware items.
 * Inherits OpenZeppelin ERC721URIStorage and Ownable.
 * Supports designated minter addresses (e.g., AsusArmory protocol).
 */
contract AsusTechGear is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Mapping to track authorized minter addresses (e.g. AsusArmory contract)
    mapping(address => bool) public isMinter;

    // Mapping to track if a token is a protected 1-of-1 exclusive (unburnable)
    mapping(uint256 => bool) public isProtectedOneOfOne;

    event MinterStatusUpdated(address indexed minter, bool status);
    event TechGearMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        string tokenURI
    );

    modifier onlyMinter() {
        require(isMinter[msg.sender] || msg.sender == owner(), "Caller is not an authorized minter");
        _;
    }

    /**
     * @param initialOwner Address of the contract owner.
     */
    constructor(address initialOwner)
        ERC721("Roguelus Gear", "ROGUELUS")
        Ownable(initialOwner)
    {
        require(initialOwner != address(0), "Invalid initial owner");
    }

    /**
     * @notice Designate or revoke an address's minting authority.
     * @param minter Address to authorize/revoke.
     * @param status True to allow minting, false to revoke.
     */
    function setMinter(address minter, bool status) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        isMinter[minter] = status;
        emit MinterStatusUpdated(minter, status);
    }

    /**
     * @notice Mints a new ASUS ROG Hardware NFT to a user with specific metadata and exclusivity flag.
     * @param recipient Address receiving the minted NFT.
     * @param uri Metadata URI.
     * @param isOneOfOne Flag indicating if this is an immutable 1-of-1 exclusive (protected from burning).
     * @return tokenId The newly minted token ID.
     */
    function mintToUser(address recipient, string memory uri, bool isOneOfOne)
        public
        onlyMinter
        returns (uint256)
    {
        require(recipient != address(0), "Invalid recipient address");
        _nextTokenId++;
        uint256 tokenId = _nextTokenId;

        if (isOneOfOne) {
            isProtectedOneOfOne[tokenId] = true;
        }

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);

        emit TechGearMinted(recipient, tokenId, uri);
        return tokenId;
    }

    /**
     * @notice Overload for backward compatibility. Defaults isOneOfOne to false.
     */
    function mintToUser(address recipient, string memory uri)
        external
        onlyMinter
        returns (uint256)
    {
        return mintToUser(recipient, uri, false);
    }

    /**
     * @notice Burn (permanently destroy) an NFT you own.
     * @param tokenId The ID of the token to burn.
     *
     * 1-of-1 Exclusive NFTs are protected and CANNOT be burned.
     * Standard series NFTs can be burned, which permanently clears them from the blockchain.
     */
    function burn(uint256 tokenId) external {
        address tokenOwner = _requireOwned(tokenId);

        // Security check: 1-of-1 NFTs are immutable and cannot be burned accidentally
        require(!isProtectedOneOfOne[tokenId], "1-of-1 Exclusive NFTs are immutable and protected from burning!");

        // Only the owner or an approved address can burn
        require(
            tokenOwner == msg.sender ||
            isApprovedForAll(tokenOwner, msg.sender) ||
            getApproved(tokenId) == msg.sender,
            "Caller is not owner nor approved"
        );

        _burn(tokenId);
    }

    /**
     * @notice Returns total number of minted NFTs to date.
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }
}

