// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DealClient.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title HealthDAOGovernanceInterface
 * @notice Interface for interacting with HealthDAOGovernance.
 * @dev Defines necessary functions and the Proposal struct.
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
 * @title HealthDAOStorage
 * @author Karthik
 * @notice Manages content storage, retrieval, tipping, and recommendations in the Health DAO.
 * @dev Integrates with Filecoin via DealClient and uses HDT for payments.
 */
contract HealthDAOStorage {
    HealthDAOGovernanceInterface public governance; // Governance contract interface
    DealClient public dealClient; // Filecoin deal client
    IERC20 public daoToken; // 0-decimal DAO token
    mapping(string => bool) public storedContent; // CID => Stored status
    mapping(address => string[]) public memberUpdates; // Member => Update CIDs
    mapping(string => uint256) public contentTips; // CID => Total HDT tips
    mapping(string => uint256) public contentRecommendations; // CID => Recommendation count
    mapping(string => address) public contentOwners; // CID => Creator address
    string[] public allContentCIDs; // All stored CIDs

    /**
     * @notice Struct to group parameters for storeContent function.
     * @dev Reduces stack usage by encapsulating deal parameters.
     */
    struct StoreContentParams {
        bytes pieceCid;
        uint64 pieceSize;
        bool verifiedDeal;
        string label;
        uint64 startEpoch;
        uint64 endEpoch;
        uint256 storagePricePerEpoch;
        uint256 providerCollateral;
        uint256 clientCollateral;
        uint64 extraParamsVersion;
        bytes extraParams;
    }

    event ContentProposed(string contentCID, address indexed proposer);
    event ContentStored(string contentCID, uint256 dealId);
    event MemberUpdatePosted(address indexed member, string contentCID);
    event DataRetrieved(string contentCID, address indexed retriever);
    event ContentTipped(string contentCID, address indexed tipper, uint256 amount);
    event ContentRecommended(string contentCID, address indexed recommender);

    modifier onlyMember() {
        require(governance.isMember(msg.sender), "Only members");
        _;
    }

    /**
     * @notice Constructs the storage contract.
     * @dev Links governance and deal client contracts; sets DAO token.
     * @param _governance Address of HealthDAOGovernance contract.
     * @param _dealClient Address of DealClient contract.
     */
    constructor(address _governance, address _dealClient) {
        governance = HealthDAOGovernanceInterface(_governance);
        dealClient = DealClient(_dealClient);
        daoToken = IERC20(governance.daoToken());
    }

    /**
     * @notice Proposes content for storage in the DAO.
     * @dev Forwards proposal to governance contract.
     * @param contentCID IPFS CID of the content.
     * @param price Proposed retrieval price in HDT.
     */
    function proposeContent(string memory contentCID, uint256 price) external onlyMember {
        governance.createProposal(contentCID, price);
        emit ContentProposed(contentCID, msg.sender);
    }

    /**
     * @notice Stores approved content on Filecoin.
     * @dev Uses a struct to reduce stack usage; requires proposal approval.
     * @param proposalId The ID of the approved proposal.
     * @param params Deal parameters for Filecoin storage.
     */
    function storeContent(uint256 proposalId, StoreContentParams memory params) external onlyMember payable {
        HealthDAOGovernanceInterface.Proposal memory proposal = governance.proposals(proposalId);
        require(proposal.approved, "Proposal not approved");
        require(!storedContent[proposal.contentCID], "Content already stored");

        DealClient.DealRequest memory deal = DealClient.DealRequest({
            pieceCid: params.pieceCid,
            pieceSize: params.pieceSize,
            verifiedDeal: params.verifiedDeal,
            label: params.label,
            startEpoch: params.startEpoch,
            endEpoch: params.endEpoch,
            storagePricePerEpoch: params.storagePricePerEpoch,
            providerCollateral: params.providerCollateral,
            clientCollateral: params.clientCollateral,
            extraParamsVersion: params.extraParamsVersion,
            extraParams: params.extraParams
        });

        uint256 dealId = dealClient.makeDealProposal{value: msg.value}(deal);
        storedContent[proposal.contentCID] = true;
        contentOwners[proposal.contentCID] = proposal.proposer;
        allContentCIDs.push(proposal.contentCID);
        governance.setRetrievalPrice(proposalId);
        emit ContentStored(proposal.contentCID, dealId);
    }

    /**
     * @notice Posts a member's status or photo update.
     * @dev Adds CID to member updates and global list.
     * @param contentCID IPFS CID of the update.
     */
    function postUpdate(string memory contentCID) external onlyMember {
        memberUpdates[msg.sender].push(contentCID);
        contentOwners[contentCID] = msg.sender;
        allContentCIDs.push(contentCID);
        emit MemberUpdatePosted(msg.sender, contentCID);
    }

    /**
     * @notice Retrieves stored content by paying the price.
     * @dev Transfers HDT to governance contract.
     * @param contentCID IPFS CID of the content.
     */
    function retrieveData(string memory contentCID) external {
        uint256 price = governance.retrievalPrices(contentCID);
        require(price > 0, "Content not priced or stored");
        require(storedContent[contentCID], "Content not stored");
        require(daoToken.transferFrom(msg.sender, address(governance), price), "Payment failed");
        emit DataRetrieved(contentCID, msg.sender);
    }

    /**
     * @notice Tips a content creator with HDT.
     * @dev Transfers HDT to this contract; accumulates tips.
     * @param contentCID IPFS CID of the content.
     * @param amount Amount of HDT to tip.
     */
    function tipContent(string memory contentCID, uint256 amount) external {
        require(storedContent[contentCID] || memberUpdates[contentOwners[contentCID]].length > 0, "Content not found");
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
        require(storedContent[contentCID] || memberUpdates[contentOwners[contentCID]].length > 0, "Content not found");
        contentRecommendations[contentCID] += 1;
        emit ContentRecommended(contentCID, msg.sender);
    }

    /**
     * @notice Withdraws accumulated tips for content.
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
     * @notice Retrieves a member's update CIDs.
     * @dev Returns the list of status/photo updates.
     * @param member The member's address.
     * @return string[] Array of IPFS CIDs.
     */
    function getMemberUpdates(address member) external view returns (string[] memory) {
        return memberUpdates[member];
    }

    /**
     * @notice Retrieves the top N recommended content CIDs.
     * @dev Uses bubble sort; returns CIDs and counts.
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
     * @notice Retrieves the top N tipped content CIDs.
     * @dev Uses bubble sort; returns CIDs and tip amounts.
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
     * @notice Returns the total number of stored content items.
     * @dev Includes Filecoin content and member updates.
     * @return uint256 Total count of content CIDs.
     */
    function getContentCount() external view returns (uint256) {
        return allContentCIDs.length;
    }
}