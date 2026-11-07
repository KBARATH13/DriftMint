// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AsusToken
 * @dev Official ERC-20 token for the ASUS ROG Hardware Armory ecosystem.
 * Inherits OpenZeppelin ERC20, ERC20Burnable, and Ownable.
 */
contract AsusToken is ERC20, ERC20Burnable, Ownable {
    uint8 private constant _DECIMALS = 18;

    /**
     * @param initialOwner Address of the contract owner and initial token recipient.
     * @param initialSupply Quantity of ASUS tokens to mint to initialOwner (in wei, 18 decimals).
     */
    constructor(
        address initialOwner,
        uint256 initialSupply
    ) ERC20("Roguelus Token", "ROGUELUS") Ownable(initialOwner) {
        require(initialOwner != address(0), "Invalid initial owner");
        _mint(initialOwner, initialSupply);
    }

    /**
     * @notice Allows contract owner to mint additional ASUS tokens (e.g. for ecosystem rewards).
     * @param to Recipient address.
     * @param amount Amount to mint.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

