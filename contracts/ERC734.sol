pragma solidity ^0.4.24;

/*
    Notes:

    I think `getKeysByPurpose` adds unneeded complexity.
    `getKey` and `keyHasPurpose` should be sufficient for verification purposes.
    Events can be used to find keys by purpose off-chain.
    And of course, if individual contracts need this functionality they can add it, but I don't think it needs to be in the standard.
*/

interface ERC734 {
    event KeyAdded(bytes32 key, uint256 purpose);
    event KeyRemoved(bytes32 key);
    event ExecutionRequested(uint256 indexed executionId, address indexed to, uint256 indexed value, bytes data);
    event Executed(uint256 indexed executionId, uint256 operationType, address indexed to, uint256 indexed value, bytes data);
    event Approved(uint256 indexed executionId, bool approved);

    function getKey(bytes32 key) external view returns(uint256);
    function keyHasPurpose(bytes32 key, uint256 purpose) external view returns(bool);
    function addKey(bytes32 key, uint256 purpose) external;
    function removeKey(bytes32 key) external;
    function execute(uint256 operationType, address to, uint256 value, bytes data) external returns (uint256);
    function approve(uint256 id, bool approve) external;
}
