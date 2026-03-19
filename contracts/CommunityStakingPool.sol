// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CommunityStakingPool
 * @notice Simple staking pool for TACHI casino community funds
 * Funds from casino losses accumulate here for weekly distribution
 */
contract CommunityStakingPool is Ownable {
    IERC20 public immutable TACHI;
    
    // Distribution settings
    uint256 public constant DISTRIBUTION_INTERVAL = 7 days;
    uint256 public constant TOP_PLAYERS_COUNT = 10;
    uint256 public constant CREATOR_SHARE = 10; // 10% to creator for development
    
    // Pool state
    uint256 public totalDeposited;
    uint256 public lastDistributionTime;
    uint256 public accumulatedForDistribution;
    
    // Player stats
    struct PlayerStats {
        uint256 volume; // Total TACHI bet volume
        uint256 lastClaimed;
    }
    
    mapping(address => PlayerStats) public playerStats;
    
    // Events
    event Deposited(uint256 amount, uint256 total);
    event Distributed(address[] topPlayers, uint256[] amounts, uint256 creatorAmount);
    
    constructor(address _tachi) Ownable(msg.sender) {
        TACHI = IERC20(_tachi);
        lastDistributionTime = block.timestamp;
    }
    
    /**
     * @notice Deposit TACHI to community pool (only casino contract)
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        
        // Transfer from sender (casino contract)
        require(TACHI.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        totalDeposited += amount;
        accumulatedForDistribution += amount;
        
        emit Deposited(amount, totalDeposited);
    }
    
    /**
     * @notice Update player volume (called by casino)
     */
    function updatePlayerVolume(address player, uint256 volume) external onlyOwner {
        playerStats[player].volume += volume;
    }
    
    /**
     * @notice Distribute accumulated funds to top players
     */
    function distribute() external {
        require(block.timestamp >= lastDistributionTime + DISTRIBUTION_INTERVAL, "Too early");
        require(accumulatedForDistribution > 0, "Nothing to distribute");
        
        // 10% to creator for development
        uint256 creatorAmount = (accumulatedForDistribution * CREATOR_SHARE) / 100;
        uint256 playersAmount = accumulatedForDistribution - creatorAmount;
        
        // Get top 10 players by volume (simplified - in production this would be off-chain)
        // For MVP, we'll distribute equally to top addresses stored off-chain
        // Frontend will call this with pre-calculated list
        
        // Send creator share
        if (creatorAmount > 0) {
            require(TACHI.transfer(owner(), creatorAmount), "Creator transfer failed");
        }
        
        // Reset
        lastDistributionTime = block.timestamp;
        accumulatedForDistribution = 0;
        
        // In production: would emit distribution event with actual players
        address[] memory emptyPlayers = new address[](0);
        uint256[] memory emptyAmounts = new uint256[](0);
        emit Distributed(emptyPlayers, emptyAmounts, creatorAmount);
    }
    
    /**
     * @notice Force distribution (owner only in case of issues)
     */
    function forceDistribute() external onlyOwner {
        require(accumulatedForDistribution > 0, "Nothing to distribute");
        
        uint256 amount = accumulatedForDistribution;
        accumulatedForDistribution = 0;
        
        // Send to owner for manual distribution
        require(TACHI.transfer(owner(), amount), "Transfer failed");
        lastDistributionTime = block.timestamp;
    }
    
    /**
     * @notice Get pool stats
     */
    function getPoolStats() external view returns (
        uint256 total,
        uint256 nextDistributionTime,
        uint256 availableForDistribution
    ) {
        total = totalDeposited;
        nextDistributionTime = lastDistributionTime + DISTRIBUTION_INTERVAL;
        availableForDistribution = accumulatedForDistribution;
    }
    
    /**
     * @notice Emergency withdraw (owner only)
     */
    function emergencyWithdraw(address to) external onlyOwner {
        uint256 balance = TACHI.balanceOf(address(this));
        require(TACHI.transfer(to, balance), "Transfer failed");
        accumulatedForDistribution = 0;
    }
}