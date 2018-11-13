pragma solidity ^0.4.24;

interface ERC734 {
    event KeyAdded(bytes32 key, uint256 role);
    event KeyRemoved(bytes32 key);

    function getKey(bytes32 key) external view returns(uint256);
    function addKey(bytes32 key, uint256 role) external;
    function removeKey(bytes32 key) external;
    function execute(uint256 operationType, address to, uint256 value, bytes data) external;
}
