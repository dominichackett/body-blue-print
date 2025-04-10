// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Interface of the {Storage}.
 */
interface IStorage {
    error BucketAlreadyExists();
    error BucketInvalid();
    error BucketInvalidOwner();
    error BucketNonexists();
    error BucketNonempty();

    error FileAlreadyExists();
    error FileInvalid();
    error FileNonexists();
    error FileNonempty();
    error FileNameDuplicate();
    error FileFullyUploaded();
    error FileChunkDuplicate();

    error BlockAlreadyExists();
    error BlockInvalid();
    error BlockNonexists();

    error InvalidArrayLength(uint256 cidsLength, uint256 sizesLength);
    error InvalidFileBlocksCount();
    error InvalidLastBlockSize();
    error InvalidEncodedSize();
    error InvalidFileCID();
    error IndexMismatch();

    struct Bucket {
        bytes32 id;
        string name;
        uint256 createdAt;
        address owner;

        bytes32[] files;
    }

    struct File {
        bytes32 id;
        bytes fileCID;
        bytes32 bucketId;
        string name;
        uint256 encodedSize;
        uint256 createdAt;
        Chunk chunks;
    }
    
    struct Chunk {
        bytes[] chunkCIDs;
        uint256[] chunkSize;
    }

        struct PeerBlock {
        bytes peerId;
        //bytes32 id;
        //bytes cid;
        bool isReplica;
    }

    event CreateBucket(bytes32 indexed id, string indexed name, address indexed owner);
    event DeleteBucket(bytes32 indexed id, string indexed name, address indexed owner);

    event CreateFile(bytes32 indexed id, bytes32 indexed bucketId, string indexed name, address owner);
    event AddFile(bytes32 indexed id, bytes32 indexed bucketId, string indexed name, address owner);
    event DeleteFile(bytes32 indexed id, bytes32 indexed bucketId, string indexed name, address owner);
    event FileUploaded(bytes32 indexed id, bytes32 indexed bucketId, string indexed name, address owner);

    event AddFileBlocks(bytes32[] indexed ids, bytes32 indexed fileId);

    event AddPeerBlock(bytes32 indexed blockId, bytes indexed peerId);
    event DeletePeerBlock(bytes32 indexed blockId, bytes indexed peerId);

    /// Bucket

    /**
     * @dev Creates bucket by `name`.
     *
     * Returns bucket `id`.
     */
    function createBucket(string memory name) external returns (bytes32 id);

    /**
     * @dev Deletes a bucket by `name`. O(1).
     *
     * Returns true if the bucket was removed from the set, that is if it was present.
     */
    function deleteBucket(bytes32 id, string memory name, uint256 index) external returns (bool);

    /**
     * @dev Returns buckets ids list by `owner`
     */
    function getOwnerBuckets(address owner) external view returns (bytes32[] memory buckets);

    /**
     * @dev Returns blocks by 'ids'
     */
    function getBucketsByIds(bytes32[] calldata ids) external view returns (Bucket[] memory);

    /**
     * @dev Returns a bucket by 'name'
     */
    function getBucketByName(string memory name) external view returns (Bucket memory bucket);

    /**
     * @dev Returns a bucket index by 'name'
     */
    function getBucketIndexByName(string memory name,address owner) external view returns (uint256 index);

    /// File

    /**
     * Adds a new file to the bucket.
     */
    function createFile(bytes32 bucketId, string memory name) external returns (bytes32);

    /**
     * Creates a new chunk of the file.
     */
    function addFileChunk(bytes memory cid, bytes32 bucketId, string memory name, uint256 size, bytes32[] calldata cids, uint256[] calldata chunkBlocksSizes,uint256 chunkIndex) external returns (bytes32); 

    /**
     * Commits the file and restricts the upload of new chunks.
     */
    function commitFile(bytes32 bucketId, string memory name, uint256 encodedFileSize, bytes memory fileCID) external returns (bytes32);

    /**
     * @dev Deletes a file from the bucket.
     *
     * Returns true if the file was removed from the set, that is if it was present.
     */
    function deleteFile(bytes32 id, bytes32 bucketId, string memory name, uint256 index) external returns (bool);
    
    /**
     * @dev Returns the file by 'id'
     */
    function getFileById(bytes32 id) external view returns (File memory file);

    /**
     * @dev Returns file index in files array of certain bucket.
     * @param name of the bucket.
     * @param fileId id of the file.
     */
    function getFileIndexById(string memory name, bytes32 fileId) external view returns (uint256 index);

    /**
     * @dev Returns the file by `bucketId` & `name`.
     */
    function getFileByName(bytes32 bucketId, string memory name) external view returns (File memory file);


    /// File Blocks

    /**
     * @dev Returns the blocks by 'ids'
     */
    //function getFileBlocksByIds(bytes32[] calldata ids) external view returns (FileBlock[] memory);


    /// Peer Blocks

    /**
     * Adds a new pear block.
     */
    function addPeerBlock(bytes calldata peerId, bytes calldata cid, bool isReplica) external returns (bytes32 id);

    /**
     * @dev Deletes a peer block.
     *
     * Returns true if the file was removed from the set, that is if it was present.
     */
    function deletePeerBlock(bytes32 id, bytes calldata peerId, bytes calldata cid) external returns (bool);

    /**
     * @dev Returns the block by 'id'
     */
    function getPeerBlockById(bytes32 id) external view returns (PeerBlock memory peerBlock);

    /**
     * @dev Returns the block by 'peerId' & `cid`
     */
    function getPeerBlockByCid(bytes calldata peerId, bytes memory cid) external view returns (PeerBlock memory peerBlock);

    /**
     * @dev Returns the peers list peer block `cid`.
     *
     */
    function getPeersByPeerBlockCid(bytes memory cid) external view returns (bytes[] memory peers);

    /**
     * @dev Returns the chain id of the current blockchain.
     */
    function getChainID() external view returns (uint256);

    /**
     * @dev {Storage} version.
     */
    function version() external pure returns (string memory);

    /**
     * @dev Returns the current timestamp.
     */
    function timestamp() external view returns (uint256);
}
