// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title DAOToken
 * @author Karthik
 * @notice An ERC-20 token with 0 decimals for the Health DAO, used for membership, voting, pricing, and tipping.
 * @dev Extends OpenZeppelin's ERC20 with no fractional units (1 HDT is the smallest unit).
 */
contract DAOToken is ERC20 {
    /**
     * @notice Constructor to initialize the DAOToken with an initial supply.
     * @dev Mints the initial supply to the deployer (msg.sender) with 0 decimals.
     * @param initialSupply The total initial supply of tokens (e.g., 1000000 for 1M HDT).
     */
    constructor(uint256 initialSupply) ERC20("HealthDAO Token", "HDT") {
        _mint(msg.sender, initialSupply); // No scaling needed since decimals = 0
    }

    /**
     * @notice Returns the number of decimals used by the token.
     * @dev Overrides the default ERC-20 decimals to 0.
     * @return uint8 The number of decimals (always 0).
     */
    function decimals() public view virtual override returns (uint8) {
        return 0;
    }
}