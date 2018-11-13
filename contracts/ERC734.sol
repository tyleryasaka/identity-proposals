pragma solidity ^0.4.24;

interface ERC734 {
    event KeyAdded(address key, uint256 role);
    event KeyRemoved(address key);

    function getKey(address key) external view returns(uint256);
    function addKey(address key, uint256 role) external;
    function removeKey(address key) external;
    function execute(uint256 operationType, address to, uint256 value, bytes data) external;
}
