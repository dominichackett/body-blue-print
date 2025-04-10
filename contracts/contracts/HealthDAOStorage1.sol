// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title HealthDAOGovernanceInterface
 * @notice Interface for interacting with HealthDAOGovernance contract.
 */
interface HealthDAOGovernanceInterface {
    struct Proposal {
        address proposer;
        string contentCID;
        uint256 totalVotes;
        bool approved;
        bool executed;
        uint256 price;
    }

    function daoToken() external view returns (address);
    function isMember(address account) external view returns (bool);
    function createProposal(string memory contentCID, uint256 price) external;
    function proposals(uint256 proposalId) external view returns (Proposal memory);
    function retrievalPrices(string memory contentCID) external view returns (uint256);
    function setRetrievalPrice(uint256 proposalId) external;
}

/**
 * @title HealthDAOStorage1
 * @author Karthik
 * @notice Manages content storage, retrieval, tipping, recommendations, and subscriptions in the Health DAO.
 * @dev Uses the Storage contract for on-chain data storage and includes subscription-based access logic.
 */
contract HealthDAOStorage1 {
    HealthDAOGovernanceInterface public governance; // Governance contract interface
    IStorage public storageContract; // On-chain storage contract
    IERC20 public daoToken; // 0-decimal DAO token (HDT)

    // Subscription fee in HDT (e.g., 10 HDT per month)
    uint256 public subscriptionFee = 10;
    // Subscription duration in seconds (e.g., 30 days)
    uint256 public subscriptionDuration = 30 days;

    // Mapping to track subscription expiration timestamp for each user
    mapping(address => uint256) public subscriptions;

    // Mapping to track stored content CIDs
    mapping(string => bool) public storedContent;
    // Mapping for member updates (personal posts)
    mapping(address => string[]) public memberUpdates;
    // Mapping for tips received per content CID
    mapping(string => uint256) public contentTips;
    // Mapping for recommendation counts per content CID
    mapping(string => uint256) public contentRecommendations;
    // Mapping for content owners (proposer or updater)
    mapping(string => address) public contentOwners;
    // List of all content CIDs (stored and updates)
    string[] public allContentCIDs;
    // Mapping to store bucket IDs per member (for content storage)
    mapping(address => bytes32) public memberBuckets;

    event ContentProposed(string contentCID, address indexed proposer);
    event ContentStored(string contentCID, bytes32 indexed fileId);
    event MemberUpdatePosted(address indexed member, string contentCID, bytes32 indexed fileId);
    event DataRetrieved(string contentCID, address indexed retriever);
    event ContentTipped(string contentCID, address indexed tipper, uint256 amount);
    event ContentRecommended(string contentCID, address indexed recommender);
    event Subscribed(address indexed subscriber, uint256 expiration);
    event SubscriptionRenewed(address indexed subscriber, uint256 expiration);

    modifier onlyMember() {
        require(governance.isMember(msg.sender), "Only members");
        _;
    }

    /**
     * @notice Initializes the storage contract.
     * @dev Links to governance and storage contracts; sets DAO token.
     * @param _governance Address of the HealthDAOGovernance contract.
     * @param _storageContract Address of the Storage contract.
     */
    constructor(address _governance, address _storageContract) {
        governance = HealthDAOGovernanceInterface(_governance);
        storageContract = IStorage(_storageContract);
        daoToken = IERC20(governance.daoToken());
    }

    /**
     * @notice Subscribes to the Health DAO for a fixed monthly fee.
     * @dev Transfers the subscription fee in HDT and sets the subscription expiration to 30 days from now.
     */
    function subscribe() external onlyMember {
        require(daoToken.transferFrom(msg.sender, address(this), subscriptionFee), "Subscription fee transfer failed");
        uint256 expiration = block.timestamp + subscriptionDuration;
        subscriptions[msg.sender] = expiration;
        emit Subscribed(msg.sender, expiration);
    }

    /**
     * @notice Renews an existing subscription by paying the fee again.
     * @dev Extends the subscription expiration by 30 days from the current expiration if active, or from now if expired.
     */
    function renewSubscription() external onlyMember {
        require(subscriptions[msg.sender] > 0, "No active or prior subscription");
        require(daoToken.transferFrom(msg.sender, address(this), subscriptionFee), "Subscription fee transfer failed");
        uint256 currentExpiration = subscriptions[msg.sender];
        uint256 newExpiration = (currentExpiration > block.timestamp) 
            ? currentExpiration + subscriptionDuration 
            : block.timestamp + subscriptionDuration;
        subscriptions[msg.sender] = newExpiration;
        emit SubscriptionRenewed(msg.sender, newExpiration);
    }

    /**
     * @notice Checks if a user's subscription is active.
     * @dev Compares the subscription expiration timestamp with the current block timestamp.
     * @param user Address of the user to check.
     * @return bool True if the subscription is active, false otherwise.
     */
    function isSubscribed(address user) public view returns (bool) {
        return subscriptions[user] > block.timestamp;
    }

    /**
     * @notice Proposes content for storage in the DAO.
     * @dev Forwards the proposal to the governance contract.
     * @param contentCID IPFS CID of the content to propose.
     * @param price Proposed retrieval price in HDT.
     */
    function proposeContent(string memory contentCID, uint256 price) external onlyMember {
        governance.createProposal(contentCID, price);
        emit ContentProposed(contentCID, msg.sender);
    }

    /**
     * @notice Stores approved content in the Storage contract.
     * @dev Creates a bucket if needed, adds a file, and commits it after approval.
     * @param proposalId ID of the approved proposal from governance.
     * @param contentCID IPFS CID of the content (used as file name).
     * @param encodedSize Total size of the content in bytes.
     * @param chunkCIDs Array of chunk CIDs (IPFS CIDs for content pieces).
     * @param chunkSizes Array of chunk sizes in bytes.
     */
    function storeContent(
        uint256 proposalId,
        string memory contentCID,
        uint256 encodedSize,
        bytes[] memory chunkCIDs,
        uint256[] memory chunkSizes
    ) external onlyMember {
        HealthDAOGovernanceInterface.Proposal memory proposal = governance.proposals(proposalId);
        require(proposal.proposer != address(0), "Proposal does not exist");
        require(proposal.approved, "Proposal not approved");
        require(!storedContent[contentCID], "Content already stored");
        require(keccak256(abi.encodePacked(proposal.contentCID)) == keccak256(abi.encodePacked(contentCID)), "CID mismatch");
        require(chunkCIDs.length == chunkSizes.length, "Array length mismatch");

        bytes32 bucketId = memberBuckets[msg.sender];
        if (bucketId == bytes32(0)) {
            string memory bucketName = string(abi.encodePacked("HealthDAO_", uint256(uint160(msg.sender))));
            bucketId = storageContract.createBucket(bucketName);
            memberBuckets[msg.sender] = bucketId;
        }

        bytes32 fileId = storageContract.createFile(bucketId, contentCID);
        for (uint256 i = 0; i < chunkCIDs.length; i++) {
            bytes32[] memory emptyCids = new bytes32[](0);
            uint256[] memory emptySizes = new uint256[](0);
            storageContract.addFileChunk(chunkCIDs[i], bucketId, contentCID, chunkSizes[i], emptyCids, emptySizes, i);
        }
        storageContract.commitFile(bucketId, contentCID, encodedSize, abi.encodePacked(contentCID));

        storedContent[contentCID] = true;
        contentOwners[contentCID] = proposal.proposer;
        allContentCIDs.push(contentCID);
        governance.setRetrievalPrice(proposalId);

        emit ContentStored(contentCID, fileId);
    }

    /**
     * @notice Posts a member’s status or photo update.
     * @dev Stores the update as a file in the member’s bucket without governance approval.
     * @param contentCID IPFS CID of the update.
     */
    function postUpdate(string memory contentCID) external onlyMember {
        bytes32 bucketId = memberBuckets[msg.sender];
        if (bucketId == bytes32(0)) {
            string memory bucketName = string(abi.encodePacked("HealthDAO_", uint256(uint160(msg.sender))));
            bucketId = storageContract.createBucket(bucketName);
            memberBuckets[msg.sender] = bucketId;
        }

        bytes32 fileId = storageContract.createFile(bucketId, contentCID);
        bytes[] memory chunkCIDs = new bytes[](1);
        uint256[] memory chunkSizes = new uint256[](1);
        chunkCIDs[0] = abi.encodePacked(contentCID);
        chunkSizes[0] = 1; // Placeholder size; adjust based on actual content
        bytes32[] memory emptyCids = new bytes32[](0);
        uint256[] memory emptySizes = new uint256[](0);
        storageContract.addFileChunk(chunkCIDs[0], bucketId, contentCID, chunkSizes[0], emptyCids, emptySizes, 0);
        storageContract.commitFile(bucketId, contentCID, chunkSizes[0], chunkCIDs[0]);

        memberUpdates[msg.sender].push(contentCID);
        contentOwners[contentCID] = msg.sender;
        allContentCIDs.push(contentCID);

        emit MemberUpdatePosted(msg.sender, contentCID, fileId);
    }

    /**
     * @notice Retrieves stored content, waiving the fee for active subscribers.
     * @dev Restricted to members; charges retrieval fee in HDT to governance if not subscribed.
     * @param contentCID IPFS CID of the content to retrieve.
     */
    function retrieveData(string memory contentCID) external onlyMember {
        require(contentOwners[contentCID] != address(0), "Content does not exist");
        uint256 price = governance.retrievalPrices(contentCID);
        require(price > 0, "Content not priced or stored");
        require(storedContent[contentCID], "Content not stored");

        if (!isSubscribed(msg.sender)) {
            require(daoToken.transferFrom(msg.sender, address(governance), price), "Payment failed");
        }

        emit DataRetrieved(contentCID, msg.sender);
    }

    /**
     * @notice Tips a content creator with HDT.
     * @dev Transfers HDT to this contract for later withdrawal.
     * @param contentCID IPFS CID of the content.
     * @param amount Amount of HDT to tip.
     */
    function tipContent(string memory contentCID, uint256 amount) external {
        require(contentOwners[contentCID] != address(0), "Content does not exist");
        require(amount > 0, "Tip amount must be greater than 0");
        require(daoToken.transferFrom(msg.sender, address(this), amount), "Tip transfer failed");

        contentTips[contentCID] += amount;
        emit ContentTipped(contentCID, msg.sender, amount);
    }

    /**
     * @notice Recommends content, incrementing its count.
     * @dev Only members can recommend existing content.
     * @param contentCID IPFS CID of the content.
     */
    function recommendContent(string memory contentCID) external onlyMember {
        require(contentOwners[contentCID] != address(0), "Content does not exist");
        contentRecommendations[contentCID] += 1;
        emit ContentRecommended(contentCID, msg.sender);
    }

    /**
     * @notice Withdraws accumulated tips for a content CID.
     * @dev Only the content owner can withdraw; transfers HDT.
     * @param contentCID IPFS CID of the content.
     */
    function withdrawTips(string memory contentCID) external {
        require(msg.sender == contentOwners[contentCID], "Only content owner");
        uint256 amount = contentTips[contentCID];
        require(amount > 0, "No tips to withdraw");
        contentTips[contentCID] = 0;
        require(daoToken.transfer(msg.sender, amount), "Withdrawal failed");
    }

    /**
     * @notice Retrieves a member’s list of update CIDs.
     * @dev Returns an array of CIDs posted by the member.
     * @param member Address of the member.
     * @return string[] Array of IPFS CIDs.
     */
    function getMemberUpdates(address member) external view returns (string[] memory) {
        return memberUpdates[member];
    }

    /**
     * @notice Retrieves the top N content CIDs by recommendation count.
     * @dev Uses bubble sort; not optimized for large datasets.
     * @param n Number of top items to return (capped at total count).
     * @return topCIDs Array of top CIDs.
     * @return recommendationCounts Array of recommendation counts.
     */
    function getTopRecommendedContent(uint256 n) external view returns (string[] memory topCIDs, uint256[] memory recommendationCounts) {
        uint256 contentCount = allContentCIDs.length;
        if (n > contentCount) n = contentCount;

        topCIDs = new string[](n);
        recommendationCounts = new uint256[](n);
        string[] memory tempCIDs = allContentCIDs;

        for (uint256 i = 0; i < contentCount; i++) {
            for (uint256 j = i + 1; j < contentCount; j++) {
                if (contentRecommendations[tempCIDs[i]] < contentRecommendations[tempCIDs[j]]) {
                    (tempCIDs[i], tempCIDs[j]) = (tempCIDs[j], tempCIDs[i]);
                }
            }
        }

        for (uint256 i = 0; i < n; i++) {
            topCIDs[i] = tempCIDs[i];
            recommendationCounts[i] = contentRecommendations[tempCIDs[i]];
        }
    }

    /**
     * @notice Retrieves the top N content CIDs by tip amount.
     * @dev Uses bubble sort; not optimized for large datasets.
     * @param n Number of top items to return (capped at total count).
     * @return topCIDs Array of top CIDs.
     * @return tipAmounts Array of tip amounts in HDT.
     */
    function getTopTippedContent(uint256 n) external view returns (string[] memory topCIDs, uint256[] memory tipAmounts) {
        uint256 contentCount = allContentCIDs.length;
        if (n > contentCount) n = contentCount;

        topCIDs = new string[](n);
        tipAmounts = new uint256[](n);
        string[] memory tempCIDs = allContentCIDs;

        for (uint256 i = 0; i < contentCount; i++) {
            for (uint256 j = i + 1; j < contentCount; j++) {
                if (contentTips[tempCIDs[i]] < contentTips[tempCIDs[j]]) {
                    (tempCIDs[i], tempCIDs[j]) = (tempCIDs[j], tempCIDs[i]);
                }
            }
        }

        for (uint256 i = 0; i < n; i++) {
            topCIDs[i] = tempCIDs[i];
            tipAmounts[i] = contentTips[tempCIDs[i]];
        }
    }

    /**
     * @notice Returns the total number of content items.
     * @dev Includes stored content and member updates.
     * @return uint256 Total count of content CIDs.
     */
    function getContentCount() external view returns (uint256) {
        return allContentCIDs.length;
    }
}