// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title TachiCasino
 * @notice Simple commit-reveal casino game with burn/staking mechanics
 * 
 * Game flow:
 * 1. User commits hash(secret, betAmount) with bet
 * 2. Keeper reveals serverSecret after user commitment
 * 3. Random seed = hash(userSecret, serverSecret, block.number)
 * 4. Determine win/lose via deterministic dice
 * 5. Payouts:
 *    - Win: 2× bet to player
 *    - Lose: 90% burned, 10% to community staking pool
 */
contract TachiCasino is Ownable {
    using ECDSA for bytes32;
    
    // TACHI token
    IERC20 public immutable TACHI;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    // Game settings
    uint256 public constant WIN_MULTIPLIER = 2; // 2× payout on win
    uint256 public constant BURN_PERCENT = 90; // 90% burned on loss
    uint256 public constant COMMUNITY_PERCENT = 10; // 10% to community pool
    
    // Game state
    struct Game {
        bytes32 commitment;
        uint256 betAmount;
        uint256 committedAt;
        bytes32 serverSecret;
        bool resolved;
        bool isWin;
    }
    
    mapping(address => Game) public activeGames;
    mapping(address => uint256) public totalWon;
    mapping(address => uint256) public totalLost;
    mapping(address => uint256) public totalContributed; // To community pool
    
    // Community pool (simple accumulation)
    uint256 public communityPoolBalance;
    
    // Events
    event GameCommitted(address indexed player, bytes32 commitment, uint256 betAmount);
    event GameRevealed(address indexed player, bytes32 serverSecret);
    event GameResolved(address indexed player, bool isWin, uint256 payout, uint256 burned, uint256 toCommunity);
    event CommunityWithdrawn(address indexed to, uint256 amount);
    
    constructor(address _tachi) Ownable(msg.sender) {
        TACHI = IERC20(_tachi);
    }
    
    /**
     * @notice Commit to a game with a secret and bet amount
     * @param commitment hash(playerSecret, betAmount)
     * @param betAmount Amount of TACHI to bet
     */
    function commitGame(bytes32 commitment, uint256 betAmount) external {
        require(activeGames[msg.sender].commitment == 0, "Active game exists");
        require(betAmount > 0, "Bet must be > 0");
        
        // Transfer tokens from player
        require(TACHI.transferFrom(msg.sender, address(this), betAmount), "Transfer failed");
        
        // Create game
        activeGames[msg.sender] = Game({
            commitment: commitment,
            betAmount: betAmount,
            committedAt: block.number,
            serverSecret: 0,
            resolved: false,
            isWin: false
        });
        
        emit GameCommitted(msg.sender, commitment, betAmount);
    }
    
    /**
     * @notice Reveal server secret (called by keeper)
     * @param player Player address
     * @param serverSecret Server's secret
     */
    function revealGame(address player, bytes32 serverSecret) external onlyOwner {
        Game storage game = activeGames[player];
        require(game.commitment != 0, "No active game");
        require(game.serverSecret == 0, "Already revealed");
        
        game.serverSecret = serverSecret;
        emit GameRevealed(player, serverSecret);
    }
    
    /**
     * @notice Resolve game with player's secret
     * @param playerSecret Player's original secret
     */
    function resolveGame(bytes32 playerSecret) external {
        address player = msg.sender;
        Game storage game = activeGames[player];
        
        require(game.commitment != 0, "No active game");
        require(game.serverSecret != 0, "Game not revealed");
        require(!game.resolved, "Game already resolved");
        
        // Verify commitment
        bytes32 calculatedCommitment = keccak256(abi.encodePacked(playerSecret, game.betAmount));
        require(calculatedCommitment == game.commitment, "Invalid secret");
        
        // Generate random seed
        bytes32 seed = keccak256(abi.encodePacked(playerSecret, game.serverSecret, game.committedAt));
        
        // Determine win/lose (50% chance)
        bool isWin = (uint256(seed) % 2) == 0;
        game.isWin = isWin;
        game.resolved = true;
        
        uint256 payout = 0;
        uint256 burned = 0;
        uint256 toCommunity = 0;
        
        if (isWin) {
            // Win: 2× payout
            payout = game.betAmount * WIN_MULTIPLIER;
            require(TACHI.transfer(player, payout), "Payout failed");
            totalWon[player] += payout;
        } else {
            // Lose: 90% burn, 10% community
            burned = (game.betAmount * BURN_PERCENT) / 100;
            toCommunity = (game.betAmount * COMMUNITY_PERCENT) / 100;
            
            // Burn
            require(TACHI.transfer(BURN_ADDRESS, burned), "Burn failed");
            
            // Add to community pool
            communityPoolBalance += toCommunity;
            totalContributed[player] += toCommunity;
            totalLost[player] += game.betAmount;
        }
        
        emit GameResolved(player, isWin, payout, burned, toCommunity);
        
        // Clean up
        delete activeGames[player];
    }
    
    /**
     * @notice Cancel game if not revealed within timeout (100 blocks)
     */
    function cancelGame() external {
        Game storage game = activeGames[msg.sender];
        require(game.commitment != 0, "No active game");
        require(game.serverSecret == 0, "Already revealed");
        require(block.number > game.committedAt + 100, "Too early");
        
        // Return bet
        require(TACHI.transfer(msg.sender, game.betAmount), "Refund failed");
        
        delete activeGames[msg.sender];
    }
    
    /**
     * @notice Withdraw from community pool (owner only - for staking/yield)
     */
    function withdrawCommunityPool(address to, uint256 amount) external onlyOwner {
        require(amount <= communityPoolBalance, "Insufficient pool");
        communityPoolBalance -= amount;
        require(TACHI.transfer(to, amount), "Transfer failed");
        emit CommunityWithdrawn(to, amount);
    }
    
    /**
     * @notice Get user stats
     */
    function getUserStats(address user) external view returns (
        uint256 won,
        uint256 lost,
        uint256 contributed,
        uint256 winRate
    ) {
        won = totalWon[user];
        lost = totalLost[user];
        contributed = totalContributed[user];
        
        uint256 totalGames = (won / WIN_MULTIPLIER) + lost;
        if (totalGames > 0) {
            uint256 winCount = won / WIN_MULTIPLIER;
            winRate = (winCount * 100) / totalGames;
        }
    }
    
    /**
     * @notice Get game state for frontend
     */
    function getGameState(address player) external view returns (
        bool hasActiveGame,
        uint256 betAmount,
        bool revealed,
        bool resolved
    ) {
        Game storage game = activeGames[player];
        hasActiveGame = game.commitment != 0;
        betAmount = game.betAmount;
        revealed = game.serverSecret != 0;
        resolved = game.resolved;
    }
}