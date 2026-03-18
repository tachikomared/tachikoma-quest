// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CommunityBurner
 * @notice Wrapper contract for $TACHI community burns
 * Since native burn() is locked, users send tokens here which are
 * forwarded to 0xdead. Tracks burns for badges and leaderboard.
 */
contract CommunityBurner is Ownable {
    IERC20 public immutable TACHI;
    
    // Burn tiers (in TACHI wei, 18 decimals)
    uint256[] public TIERS = [
        10_000 * 10**18,      // Bronze: 10K
        100_000 * 10**18,     // Silver: 100K
        1_000_000 * 10**18,   // Gold: 1M
        1_000_000_000 * 10**18 // Diamond: 1B
    ];
    
    mapping(address => uint256) public totalBurned;
    mapping(address => uint256) public badgeTier;
    mapping(uint256 => uint256) public tierHolders;
    
    uint256 public totalCommunityBurned;
    uint256 public totalBurners;
    
    // Events
    event Burn(address indexed user, uint256 amount, uint256 newTotal, uint256 timestamp);
    event BadgeUpgraded(address indexed user, uint256 oldTier, uint256 newTier);
    
    constructor(address _tachi) Ownable(msg.sender) {
        TACHI = IERC20(_tachi);
    }
    
    /**
     * @notice Burn $TACHI tokens (transfers to dead address)
     * @param amount Amount of TACHI to burn
     */
    function burn(uint256 amount) external {
        require(amount > 0, "Must burn something");
        require(TACHI.transferFrom(msg.sender, address(0xdead), amount), "Transfer failed");
        
        // Track burn stats
        if (totalBurned[msg.sender] == 0) {
            totalBurners++;
        }
        totalBurned[msg.sender] += amount;
        totalCommunityBurned += amount;
        
        // Check for badge upgrade
        _checkAndUpgradeBadge(msg.sender);
        
        emit Burn(msg.sender, amount, totalBurned[msg.sender], block.timestamp);
    }
    
    /**
     * @notice Check and upgrade user's badge tier based on total burned
     */
    function _checkAndUpgradeBadge(address user) internal {
        uint256 currentTier = badgeTier[user];
        uint256 newTier = currentTier;
        uint256 userBurn = totalBurned[user];
        
        for (uint256 i = TIERS.length; i > 0; i--) {
            if (userBurn >= TIERS[i-1] && i > newTier) {
                newTier = i;
                break;
            }
        }
        
        if (newTier > currentTier) {
            tierHolders[currentTier]--;
            tierHolders[newTier]++;
            badgeTier[user] = newTier;
            emit BadgeUpgraded(user, currentTier, newTier);
        }
    }
    
    /**
     * @notice Force badge recalculation (in case tiers change)
     */
    function recalculateBadge(address user) external {
        _checkAndUpgradeBadge(user);
    }
    
    /**
     * @notice Get user's current tier name
     */
    function getTierName(address user) external view returns (string memory) {
        uint256 tier = badgeTier[user];
        if (tier == 4) return "Diamond";
        if (tier == 3) return "Gold";
        if (tier == 2) return "Silver";
        if (tier == 1) return "Bronze";
        return "None";
    }
    
    /**
     * @notice Get burn leaderboard position (simplified - full leaderboard off-chain)
     */
    function getStats(address user) external view returns (
        uint256 burned,
        uint256 tier,
        uint256 nextTierAmount,
        uint256 globalRank
    ) {
        burned = totalBurned[user];
        tier = badgeTier[user];
        nextTierAmount = tier < TIERS.length ? TIERS[tier] : 0;
        // Note: globalRank requires off-chain indexing
        globalRank = 0;
    }
    
    /**
     * @notice Update tier thresholds (owner only)
     */
    function setTiers(uint256[] calldata newTiers) external onlyOwner {
        TIERS = newTiers;
    }
}
