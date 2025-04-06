// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DealClient
 * @author Karthik
 * @notice Handles Filecoin storage deals for the Health DAO.
 * @dev Adapted from Filecoin FVM starter kit for making storage deal proposals.
 */
contract DealClient {
    uint64 constant public MAX_END_EPOCH = 536_000; // Maximum allowed end epoch for deals

    address constant CALL_ACTOR_ADDRESS = address(0xfE00000000000000000000000000000000000002); // Filecoin actor address
    bytes4 constant CALL_ACTOR_METHOD = bytes4(keccak256("CallActor")); // Method signature for actor calls

    /**
     * @notice Struct to hold extra parameters for Filecoin deal proposals (version 1).
     * @dev Used to provide additional configuration for storage deals.
     */
    struct ExtraParamsV1 {
        string location_ref; // Reference to the content location (e.g., IPFS URL)
        uint64 car_size; // Size of the CAR file in bytes
        bool skip_ipni_announce; // Whether to skip IPNI announcement
        bool remove_unsealed_copy; // Whether to remove unsealed copies after sealing
    }

    /**
     * @notice Struct to define a Filecoin storage deal request.
     * @dev Contains all parameters required to propose a storage deal.
     */
    struct DealRequest {
        bytes pieceCid; // Filecoin piece CID
        uint64 pieceSize; // Size of the piece in bytes
        bool verifiedDeal; // Whether the deal is verified
        string label; // Descriptive label for the deal
        uint64 startEpoch; // Start epoch for the deal (changed to uint64)
        uint64 endEpoch; // End epoch for the deal (changed to uint64)
        uint256 storagePricePerEpoch; // Price per epoch in ETH/FIL
        uint256 providerCollateral; // Collateral provided by the storage provider in ETH/FIL
        uint256 clientCollateral; // Collateral provided by the client in ETH/FIL
        uint64 extraParamsVersion; // Version of extra parameters (e.g., 1 for V1)
        bytes extraParams; // Encoded extra parameters
    }

    mapping(uint256 => DealRequest) public dealRequests; // Deal ID => Deal details
    uint256 public dealRequestCount; // Total number of deal requests created

    /**
     * @notice Emitted when a new deal proposal is created.
     * @param id The ID of the deal proposal.
     * @param size The size of the piece in bytes.
     * @param verified Whether the deal is verified.
     * @param price The storage price per epoch in ETH/FIL.
     */
    event DealProposalCreate(
        uint256 indexed id,
        uint64 size,
        bool indexed verified,
        uint256 price
    );

    /**
     * @notice Creates a new Filecoin storage deal proposal.
     * @dev Payable function that forwards ETH/FIL to the Filecoin network for deal costs.
     * @param deal The DealRequest struct containing all deal parameters.
     * @return uint256 The ID of the created deal proposal.
     */
    function makeDealProposal(DealRequest memory deal) public payable returns (uint256) {
        require(deal.startEpoch > 0, "start epoch must be positive"); // Updated to uint64, so check > 0
        require(deal.endEpoch <= MAX_END_EPOCH, "end epoch exceeds maximum"); // Now both uint64
        require(deal.endEpoch > deal.startEpoch, "end epoch must be after start");

        dealRequests[dealRequestCount] = deal;
        emit DealProposalCreate(
            dealRequestCount,
            deal.pieceSize,
            deal.verifiedDeal,
            deal.storagePricePerEpoch
        );

        return dealRequestCount++;
    }

    /**
     * @notice Retrieves the encoded details of a deal proposal.
     * @dev Returns the deal parameters as a byte array for off-chain processing.
     * @param id The ID of the deal proposal to retrieve.
     * @return bytes The encoded deal request data.
     */
    function getDealProposal(uint256 id) public view returns (bytes memory) {
        DealRequest memory deal = dealRequests[id];
        return abi.encode(
            deal.pieceCid,
            deal.pieceSize,
            deal.verifiedDeal,
            deal.label,
            deal.startEpoch,
            deal.endEpoch,
            deal.storagePricePerEpoch,
            deal.providerCollateral,
            deal.clientCollateral,
            deal.extraParamsVersion,
            deal.extraParams
        );
    }

    /**
     * @notice Placeholder for authenticating messages from the Filecoin network.
     * @dev Restricted to the CALL_ACTOR_ADDRESS; currently a stub.
     * @param params The message parameters to authenticate.
     */
    function authenticateMessage(bytes memory params) public  {
        require(msg.sender == CALL_ACTOR_ADDRESS, "Invalid caller");
        // Placeholder for authentication logic
    }

    /**
     * @notice Placeholder for handling deal notifications from the Filecoin network.
     * @dev Restricted to the CALL_ACTOR_ADDRESS; currently a stub.
     * @param params The notification parameters.
     */
    function dealNotify(bytes memory params) public {
        require(msg.sender == CALL_ACTOR_ADDRESS, "Invalid caller");
        // Placeholder for deal notification logic
    }
}