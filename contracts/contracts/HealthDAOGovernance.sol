// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title HealthDAOGovernance
 * @author Karthik
 * @notice Manages membership, voting, and pricing for the Health DAO using a 0-decimal DAO token.
 * @dev Membership requires holding a minimum number of whole HDT tokens; voting is weighted by whole tokens.
 */
contract HealthDAOGovernance {
    IERC20 public daoToken; // The 0-decimal ERC-20 token contract
    address public owner; // The contract deployer with special privileges
    uint256 public minTokensForMembership = 100; // Minimum whole HDT tokens for membership (e.g., 100 HDT)
    mapping(uint256 => Proposal) public proposals; // Proposal ID => Proposal details
    mapping(uint256 => mapping(address => uint256)) public votes; // Proposal ID => Voter => Token amount voted
    mapping(string => uint256) public retrievalPrices; // Content CID => Retrieval price in whole HDT
    uint256 public proposalCount; // Total number of proposals created

    struct Proposal {
        address proposer; // Address of the member who created the proposal
        string contentCID; // IPFS CID of the proposed content (meal plan, routine, etc.)
        uint256 totalVotes; // Total whole HDT tokens voted in favor
        bool approved; // Whether the proposal has been approved by majority vote
        bool executed; // Whether the proposal's price has been set and executed
        uint256 price; // Proposed retrieval price in whole HDT
    }

    event MemberStatus(address member, bool isMember);
    event ProposalCreated(uint256 proposalId, address proposer, string contentCID);
    event Voted(uint256 proposalId, address voter, uint256 tokenAmount);
    event ProposalApproved(uint256 proposalId);
    event RetrievalPriceSet(string contentCID, uint256 price);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyMember() {
        require(isMember(msg.sender), "Only members");
        _;
    }

    /**
     * @notice Constructor to initialize the governance contract with the DAO token address.
     * @dev Sets the deployer as the owner and links the 0-decimal DAO token contract.
     * @param _daoToken The address of the deployed DAOToken contract.
     */
    constructor(address _daoToken) {
        owner = msg.sender;
        daoToken = IERC20(_daoToken);
    }

    /**
     * @notice Checks if an address qualifies as a DAO member based on token balance.
     * @dev A member must hold at least minTokensForMembership whole HDT tokens.
     * @param account The address to check for membership.
     * @return bool True if the account is a member, false otherwise.
     */
    function isMember(address account) public view returns (bool) {
        return daoToken.balanceOf(account) >= minTokensForMembership;
    }

    /**
     * @notice Creates a new proposal for storing content in the DAO.
     * @dev Only members can create proposals. Increments proposalCount and stores the proposal.
     * @param contentCID The IPFS CID of the content being proposed (e.g., meal plan or routine).
     * @param price The proposed retrieval price in whole HDT for accessing the content.
     */
    function createProposal(string memory contentCID, uint256 price) external onlyMember {
        proposalCount++;
        proposals[proposalCount] = Proposal({
            proposer: msg.sender,
            contentCID: contentCID,
            totalVotes: 0,
            approved: false,
            executed: false,
            price: price
        });
        emit ProposalCreated(proposalCount, msg.sender, contentCID);
    }

    /**
     * @notice Allows a member to vote on a proposal using their whole HDT tokens.
     * @dev Voting power is proportional to tokenAmount. Approval requires >50% of total supply.
     * @param proposalId The ID of the proposal to vote on.
     * @param tokenAmount The number of whole HDT tokens to commit to the vote.
     */
    function vote(uint256 proposalId, uint256 tokenAmount) external onlyMember {
        require(tokenAmount > 0, "Must vote with tokens");
        require(votes[proposalId][msg.sender] == 0, "Already voted");
        require(!proposals[proposalId].executed, "Proposal already executed");
        require(daoToken.balanceOf(msg.sender) >= tokenAmount, "Insufficient tokens");

        votes[proposalId][msg.sender] = tokenAmount;
        proposals[proposalId].totalVotes += tokenAmount;

        emit Voted(proposalId, msg.sender, tokenAmount);

        uint256 totalSupply = daoToken.totalSupply();
        if (proposals[proposalId].totalVotes > totalSupply / 2) {
            proposals[proposalId].approved = true;
            emit ProposalApproved(proposalId);
        }
    }

    /**
     * @notice Sets the retrieval price for approved content.
     * @dev Can only be called after a proposal is approved and before it's executed.
     * @param proposalId The ID of the approved proposal to set the price for.
     */
    function setRetrievalPrice(uint256 proposalId) external onlyMember {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.approved, "Proposal not approved");
        require(!proposal.executed, "Price already set");

        retrievalPrices[proposal.contentCID] = proposal.price;
        proposal.executed = true;
        emit RetrievalPriceSet(proposal.contentCID, proposal.price);
    }

    /**
     * @notice Withdraws any ETH accidentally sent to the contract.
     * @dev Only callable by the owner. Transfers ETH to the owner's address.
     */
    function withdrawETH() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}